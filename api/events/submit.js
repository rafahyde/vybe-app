// Vercel Function — endpoint público pra casas/parceiros enviarem eventos
// POST /api/events/submit
// Headers: X-Vybe-API-Key: vyk_xxxxxxxx_yyyyyyyyyyyy
// Body: { name, type, date, time, location, address, ... }
//
// Fluxo:
//   1. Valida API key (hash compare na tabela venue_api_keys)
//   2. Rate limit por key (default 30/hora)
//   3. Valida dados do evento
//   4. Insere (status='active' se trusted, 'draft' se não)
//   5. Loga em venue_api_log

import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function hashKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

const ALLOWED_TYPES = ["Universitária", "Eletrônico", "Funk", "Rock", "Outros"];

export default async function handler(req, res) {
  // CORS aberto — endpoint público
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Vybe-API-Key");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Servidor mal configurado" });
  }

  const apiKey = req.headers["x-vybe-api-key"] || "";
  if (!apiKey || !apiKey.startsWith("vyk_")) {
    return res.status(401).json({ error: "Header X-Vybe-API-Key obrigatório" });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Busca key pelo hash
  const keyHash = hashKey(apiKey);
  const { data: keyRow, error: keyErr } = await supabase
    .from("venue_api_keys")
    .select("*")
    .eq("key_hash", keyHash)
    .is("revoked_at", null)
    .single();

  if (keyErr || !keyRow) {
    // Loga tentativa inválida sem revelar muito
    await supabase.from("venue_api_log").insert({
      endpoint: "events.submit",
      ip_address: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null,
      status_code: 401,
    });
    return res.status(401).json({ error: "API key inválida" });
  }

  // Rate limit: conta requisições da hora atual
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recentCount } = await supabase
    .from("venue_api_log")
    .select("id", { count: "exact", head: true })
    .eq("venue_key_id", keyRow.id)
    .gte("occurred_at", oneHourAgo);

  if (recentCount && recentCount >= keyRow.rate_limit_per_hour) {
    await supabase.from("venue_api_log").insert({
      venue_key_id: keyRow.id,
      endpoint: "events.submit",
      ip_address: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null,
      status_code: 429,
    });
    return res.status(429).json({ error: `Rate limit atingido (${keyRow.rate_limit_per_hour}/hora)` });
  }

  // VALIDAÇÃO DO PAYLOAD
  const ev = req.body || {};
  const required = ["name", "date", "time", "location", "address"];
  for (const f of required) {
    if (!ev[f] || typeof ev[f] !== "string") {
      return res.status(400).json({ error: `Campo obrigatório ausente ou inválido: ${f}` });
    }
  }
  if (ev.name.length > 200) return res.status(400).json({ error: "name muito longo" });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ev.date)) return res.status(400).json({ error: "date deve ser YYYY-MM-DD" });
  if (!/^\d{2}:\d{2}$/.test(ev.time)) return res.status(400).json({ error: "time deve ser HH:MM" });
  const evType = ev.type && ALLOWED_TYPES.includes(ev.type) ? ev.type : "Outros";
  if (ev.lat != null && (typeof ev.lat !== "number" || ev.lat < -90 || ev.lat > 90)) {
    return res.status(400).json({ error: "lat inválido" });
  }
  if (ev.lng != null && (typeof ev.lng !== "number" || ev.lng < -180 || ev.lng > 180)) {
    return res.status(400).json({ error: "lng inválido" });
  }

  // Monta starts_at
  let starts_at = null;
  try {
    starts_at = new Date(`${ev.date}T${ev.time}:00-03:00`).toISOString();
  } catch {}

  const status = keyRow.trusted ? "active" : "draft";
  const payload = {
    name: ev.name.trim(),
    type: evType,
    date: ev.date,
    time: ev.time,
    location: ev.location.trim().slice(0, 200),
    address: ev.address.trim().slice(0, 500),
    description: ev.description?.trim()?.slice(0, 2000) || null,
    lineup: Array.isArray(ev.lineup) ? ev.lineup.slice(0, 50) : null,
    color: ev.color || "#A78BFA",
    emoji: ev.emoji?.slice(0, 4) || "🎉",
    ticket_link: ev.ticket_link || null,
    image_url: ev.image_url || null,
    price_text: ev.price_text?.slice(0, 100) || null,
    is_free: !!ev.is_free,
    starts_at,
    lat: ev.lat ?? null,
    lng: ev.lng ?? null,
    venue_name: ev.location.trim().slice(0, 200),
    status,
    source: "partner_api",
    source_event_id: ev.external_id?.slice(0, 200) || null,
    submitted_by_venue_key: keyRow.id,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("events")
    .insert(payload)
    .select("id, status")
    .single();

  if (insertErr) {
    console.error("[events.submit] insert error:", insertErr);
    await supabase.from("venue_api_log").insert({
      venue_key_id: keyRow.id,
      endpoint: "events.submit",
      ip_address: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null,
      status_code: 500,
    });
    return res.status(500).json({ error: "Falha ao salvar evento" });
  }

  // Atualiza contadores
  await supabase
    .from("venue_api_keys")
    .update({
      events_submitted: keyRow.events_submitted + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq("id", keyRow.id);

  await supabase.from("venue_api_log").insert({
    venue_key_id: keyRow.id,
    endpoint: "events.submit",
    ip_address: (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null,
    status_code: 200,
  });

  return res.status(200).json({
    success: true,
    event_id: inserted.id,
    status: inserted.status,
    message: status === "active" ? "Evento publicado" : "Evento em revisão pelo admin",
  });
}
