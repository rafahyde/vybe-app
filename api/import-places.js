// Vercel Function — bulk import de lugares via Google Places API (New)
// POST { lat, lng, radius, type? }   Auth: Bearer <admin_jwt>
// Retorna: { inserted, skipped, errors, places: [...] }
//
// Env vars: GOOGLE_PLACES_API_KEY, VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//   (service role necessária pra bypass RLS no insert em batch)

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
  const { lat, lng, radius = 3000, type } = req.body || {};
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

    // Imagem: photoreference do Google (URL precisa de API key — não armazenamos)
    // Por enquanto deixa null; pode ser enriquecido depois
    const imageUrl = null;

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
      image_url: imageUrl,
      reports: [],
      source: "google_places",
      imported_at: new Date().toISOString(),
    };
  }).filter((r) => r.lat && r.lng); // remove sem coordenadas

  // Upsert em batch — onConflict no google_place_id evita duplicar
  const { data: inserted, error: insertErr } = await supabase
    .from("places")
    .upsert(rows, { onConflict: "google_place_id", ignoreDuplicates: true })
    .select("id, name, google_place_id");

  if (insertErr) {
    console.error("[import-places] insert error:", insertErr);
    return res.status(500).json({ error: "Falha ao inserir no banco", detail: insertErr.message });
  }

  return res.status(200).json({
    inserted: inserted?.length || 0,
    skipped: rows.length - (inserted?.length || 0),
    total_found: rows.length,
    errors,
    places: inserted || [],
  });
}
