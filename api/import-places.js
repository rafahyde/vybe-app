// Vercel Function — bulk import de lugares via Google Places API (New)
// POST { lat, lng, radius, type?, withPhotos? }   Auth: Bearer <admin_jwt>
// Retorna: { inserted, skipped, errors, places: [...] }
//
// Env vars: GOOGLE_PLACES_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Estende timeout pra Pro Vercel (default 10s no hobby, 60s aqui é seguro)
export const config = { maxDuration: 60 };

import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "rafahyde9@hotmail.com";

// Mapeamento de tipos Google → nossos tipos
const TYPE_MAP = {
  bar: "bar",
  pub: "bar",
  wine_bar: "bar",
  night_club: "club",
  dance_hall: "club",
  restaurant: "restaurant",
  cafe: "restaurant",
  steak_house: "restaurant",
  pizza_restaurant: "restaurant",
};

// Tipos do Google Places que devem ser buscados
const SEARCH_TYPES = ["bar", "night_club", "restaurant"];

// Cores padrão por tipo
const TYPE_COLORS = {
  bar: "#FF6B6B",
  club: "#A78BFA",
  restaurant: "#F59E0B",
};

// Converte horários do Google Places (weekdayDescriptions) pro formato {seg: "18:00-02:00", ter: "fechado", ...}
const DAY_MAP_PT = {
  "segunda-feira": "seg", "segunda": "seg", "monday": "seg",
  "terça-feira": "ter", "terça": "ter", "tuesday": "ter",
  "quarta-feira": "qua", "quarta": "qua", "wednesday": "qua",
  "quinta-feira": "qui", "quinta": "qui", "thursday": "qui",
  "sexta-feira": "sex", "sexta": "sex", "friday": "sex",
  "sábado": "sab", "saturday": "sab",
  "domingo": "dom", "sunday": "dom",
};

function parseGoogleHours(regularOpeningHours) {
  if (!regularOpeningHours?.weekdayDescriptions) return null;
  const out = {};
  for (const line of regularOpeningHours.weekdayDescriptions) {
    // Ex: "segunda-feira: 18:00 – 02:00" ou "terça-feira: Fechado"
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) continue;
    const dayName = m[1].toLowerCase().trim();
    const value = m[2].trim();
    const dayKey = DAY_MAP_PT[dayName];
    if (!dayKey) continue;
    if (/fechado|closed/i.test(value)) {
      out[dayKey] = "fechado";
    } else {
      // Normaliza "18:00 – 02:00" → "18:00-02:00"
      const hours = value.replace(/[–—−]/g, "-").replace(/\s+/g, "").replace(",", "; ");
      out[dayKey] = hours;
    }
  }
  return Object.keys(out).length > 0 ? out : null;
}

// Rate limit simples por IP
const rateLimitStore = new Map();
function checkRateLimit(ip) {
  const now = Date.now();
  const window = 60_000;
  const max = 10;
  const rec = rateLimitStore.get(ip);
  if (!rec || now - rec.windowStart > window) {
    rateLimitStore.set(ip, { windowStart: now, count: 1 });
    return { ok: true };
  }
  if (rec.count >= max) {
    return { ok: false, retryAfter: Math.ceil((window - (now - rec.windowStart)) / 1000) };
  }
  rec.count += 1;
  return { ok: true };
}

export default async function handler(req, res) {
  const allowedOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  // ENV CHECK
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    return res.status(500).json({ error: "Servidor mal configurado (Google Places)" });
  }
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Servidor mal configurado (Supabase)" });
  }

  // RATE LIMIT
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: `Aguarde ${rl.retryAfter}s` });
  }

  // AUTH: valida JWT + admin
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Não autenticado" });

  const supabaseAuth = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const { data: userData, error: authErr } = await supabaseAuth.auth.getUser(token);
  if (authErr || !userData?.user) return res.status(401).json({ error: "Token inválido" });
  if (userData.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Apenas admin" });
  }

  // VALIDAÇÃO INPUT
  const { lat, lng, radius = 3000, type, withPhotos = true } = req.body || {};
  if (typeof lat !== "number" || lat < -90 || lat > 90) {
    return res.status(400).json({ error: "lat inválido" });
  }
  if (typeof lng !== "number" || lng < -180 || lng > 180) {
    return res.status(400).json({ error: "lng inválido" });
  }
  if (typeof radius !== "number" || radius < 100 || radius > 50_000) {
    return res.status(400).json({ error: "radius inválido (100-50000)" });
  }
  const searchTypes = type ? [type] : SEARCH_TYPES;

  // Cliente Supabase com service role (bypass RLS — protegido pela checagem de admin acima)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const allPlaces = [];
  const errors = [];

  // Faz uma busca por tipo (Google Places (New) — searchNearby)
  for (const googleType of searchTypes) {
    try {
      const response = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
          "X-Goog-FieldMask":
            "places.id,places.displayName,places.formattedAddress,places.location,places.types,places.rating,places.userRatingCount,places.priceLevel,places.photos,places.regularOpeningHours,places.websiteUri",
        },
        body: JSON.stringify({
          includedTypes: [googleType],
          maxResultCount: 20,
          locationRestriction: {
            circle: {
              center: { latitude: lat, longitude: lng },
              radius,
            },
          },
          languageCode: "pt-BR",
          regionCode: "BR",
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (!response.ok) {
        const errText = await response.text();
        errors.push({ type: googleType, status: response.status, msg: errText.slice(0, 200) });
        continue;
      }

      const json = await response.json();
      const places = json.places || [];
      for (const p of places) {
        allPlaces.push({ ...p, _searchType: googleType });
      }
    } catch (e) {
      errors.push({ type: googleType, msg: e.message });
    }
  }

  if (allPlaces.length === 0) {
    return res.status(200).json({ inserted: 0, skipped: 0, errors, places: [], message: "Nenhum lugar encontrado" });
  }

  // Mapeia pra schema do banco
  const rows = allPlaces.map((p) => {
    // Decide o nosso tipo baseado nos types do Google
    let ourType = "restaurant";
    for (const t of p.types || []) {
      if (TYPE_MAP[t]) {
        ourType = TYPE_MAP[t];
        break;
      }
    }
    // Override se a busca foi específica
    if (p._searchType === "bar") ourType = "bar";
    else if (p._searchType === "night_club") ourType = "club";
    else if (p._searchType === "restaurant" && !p.types?.includes("bar") && !p.types?.includes("night_club")) {
      ourType = "restaurant";
    }

    const hours = parseGoogleHours(p.regularOpeningHours);
    // Guarda a referência da primeira foto pra baixar depois (em outra etapa)
    const photoRef = p.photos?.[0]?.name || null;

    return {
      google_place_id: p.id,
      name: p.displayName?.text || "Sem nome",
      type: ourType,
      address: p.formattedAddress || "",
      lat: p.location?.latitude,
      lng: p.location?.longitude,
      rating: p.rating || 0,
      checkins: p.userRatingCount || 0,
      crowd: 0,
      cover: p.priceLevel === "PRICE_LEVEL_FREE" ? "Grátis" : "Consultar",
      color: TYPE_COLORS[ourType] || "#A78BFA",
      tags: (p.types || []).filter((t) => !["point_of_interest", "establishment", "food"].includes(t)).slice(0, 5),
      image_url: null, // preenchido depois pelo downloadPhotos
      hours,
      reports: [],
      source: "google_places",
      imported_at: new Date().toISOString(),
      _photoRef: photoRef, // campo temporário, removido antes do insert
    };
  }).filter((r) => r.lat && r.lng); // remove sem coordenadas

  // Baixa fotos em paralelo (concorrência limitada) ANTES do upsert
  let photosDownloaded = 0;
  if (withPhotos) {
    const photoTasks = rows
      .filter((r) => r._photoRef)
      .map((r) => async () => {
        const url = await downloadAndStorePhoto(r._photoRef, r.google_place_id, supabase);
        if (url) {
          r.image_url = url;
          photosDownloaded += 1;
        }
      });
    // Roda 5 por vez pra não estourar timeout nem rate limit do Google
    await runWithConcurrency(photoTasks, 5);
  }

  // Dedupe: mesmo lugar pode vir em mais de uma busca (bar + night_club)
  // Postgres ON CONFLICT só aceita 1 linha por google_place_id no mesmo batch
  const dedupedMap = new Map();
  for (const r of rows) {
    if (!r.google_place_id) continue;
    if (!dedupedMap.has(r.google_place_id)) {
      dedupedMap.set(r.google_place_id, r);
    }
  }
  const deduped = Array.from(dedupedMap.values());

  // Remove o campo temporário _photoRef antes de inserir
  const cleanRows = deduped.map(({ _photoRef, ...rest }) => rest);

  // Upsert em batch — onConflict no google_place_id ATUALIZA campos do Google
  const { data: inserted, error: insertErr } = await supabase
    .from("places")
    .upsert(cleanRows, { onConflict: "google_place_id", ignoreDuplicates: false })
    .select("id, name, google_place_id, image_url");

  if (insertErr) {
    console.error("[import-places] insert error:", insertErr);
    return res.status(500).json({ error: "Falha ao inserir no banco", detail: insertErr.message });
  }

  return res.status(200).json({
    inserted: inserted?.length || 0,
    skipped: cleanRows.length - (inserted?.length || 0),
    total_found: cleanRows.length,
    photos_downloaded: photosDownloaded,
    errors,
    places: inserted || [],
  });
}

// Baixa 1 foto do Google Places e faz upload no Storage. Retorna URL pública ou null.
async function downloadAndStorePhoto(photoName, placeId, supabase) {
  try {
    const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&skipHttpRedirect=true`;
    const photoRes = await fetch(photoUrl, {
      headers: { "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY },
      signal: AbortSignal.timeout(8000),
    });
    if (!photoRes.ok) {
      console.warn(`[photos] ${placeId}: status ${photoRes.status}`);
      return null;
    }
    // Resposta vem como JSON com photoUri (URL temporária assinada)
    const photoJson = await photoRes.json();
    const signedUrl = photoJson.photoUri;
    if (!signedUrl) return null;

    // Baixa a imagem em si
    const imgRes = await fetch(signedUrl, { signal: AbortSignal.timeout(8000) });
    if (!imgRes.ok) return null;
    const buf = Buffer.from(await imgRes.arrayBuffer());

    // Tamanho máximo: 2MB
    if (buf.length > 2 * 1024 * 1024) {
      console.warn(`[photos] ${placeId}: too big (${buf.length})`);
      return null;
    }

    // Upload pro Storage (overwrite se já existe)
    const filename = `${placeId}.jpg`;
    const { error: uploadErr } = await supabase.storage
      .from("place-photos")
      .upload(filename, buf, {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000", // 1 ano
      });

    if (uploadErr) {
      console.error(`[photos] ${placeId} upload:`, uploadErr.message);
      return null;
    }

    // URL pública (bucket é público)
    const { data: pub } = supabase.storage.from("place-photos").getPublicUrl(filename);
    return pub.publicUrl;
  } catch (e) {
    console.warn(`[photos] ${placeId}: ${e.message}`);
    return null;
  }
}

// Roda N tarefas async com concorrência limitada
async function runWithConcurrency(tasks, limit) {
  const queue = [...tasks];
  const running = new Set();
  async function next() {
    if (queue.length === 0) return;
    const task = queue.shift();
    const p = task().finally(() => running.delete(p));
    running.add(p);
    if (running.size >= limit) await Promise.race(running);
    return next();
  }
  await next();
  await Promise.all(running);
}
