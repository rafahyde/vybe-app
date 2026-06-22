// Vercel Serverless Function — extrai dados de evento a partir de uma URL.
// Recebe: POST { url }   Headers: Authorization: Bearer <supabase_jwt>
// Retorna: { data: {name, date, time, location, address, ...}, source_url }
//
// SEGURANÇA:
// - Exige Authorization Bearer token (JWT do Supabase)
// - Valida o JWT chamando Supabase auth.getUser()
// - Confere que o usuário é admin (email = ADMIN_EMAIL)
// - Rate limit 30 req/min por IP (proteção secundária)
//
// Env vars necessárias (Vercel):
//   ANTHROPIC_API_KEY  — Claude API key (server-only)
//   VITE_SUPABASE_URL  — usado pra criar cliente Supabase server-side
//   VITE_SUPABASE_ANON_KEY  — anon key (segura no servidor, mesmo no client)

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "rafahyde9@hotmail.com";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Rate limit em memória (resetado quando função "esfria" — Vercel reusa instâncias)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitStore.get(ip);
  if (!record || now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(ip, { windowStart: now, count: 1 });
    return { ok: true, remaining: RATE_LIMIT_MAX - 1 };
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return { ok: false, retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - record.windowStart)) / 1000) };
  }
  record.count += 1;
  return { ok: true, remaining: RATE_LIMIT_MAX - record.count };
}

// Limpa o store ocasionalmente (evita memory leak em instâncias warm)
function cleanupRateLimitStore() {
  if (rateLimitStore.size < 1000) return;
  const now = Date.now();
  for (const [ip, rec] of rateLimitStore) {
    if (now - rec.windowStart > RATE_LIMIT_WINDOW_MS * 2) rateLimitStore.delete(ip);
  }
}

const EVENT_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    date: { type: ["string", "null"], description: "YYYY-MM-DD ou null se não encontrado" },
    time: { type: ["string", "null"], description: "HH:MM em 24h ou null" },
    location: { type: ["string", "null"], description: "Nome do estabelecimento/local" },
    address: { type: ["string", "null"], description: "Endereço completo (rua, número, bairro)" },
    city: { type: ["string", "null"] },
    description: { type: ["string", "null"], description: "Descrição curta do evento" },
    lineup: { type: "array", items: { type: "string" } },
    price_text: { type: ["string", "null"] },
    is_free: { type: "boolean" },
    image_url: { type: ["string", "null"] },
    ticket_link: { type: ["string", "null"] },
    type: { type: "string", enum: ["Universitária", "Eletrônico", "Funk", "Rock", "Outros"] },
    emoji: { type: "string" },
  },
  required: [
    "name", "date", "time", "location", "address", "city",
    "description", "lineup", "price_text", "is_free",
    "image_url", "ticket_link", "type", "emoji",
  ],
  additionalProperties: false,
};

export default async function handler(req, res) {
  // CORS — só permite o domínio do app em produção
  const allowedOrigin = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "*";
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  // --- ENV CHECK ---
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "Servidor mal configurado" });
  }
  if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Servidor mal configurado" });
  }

  // --- RATE LIMIT (por IP) ---
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
  cleanupRateLimitStore();
  const rl = checkRateLimit(ip);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({ error: `Muitas requisições. Tente em ${rl.retryAfter}s.` });
  }
  res.setHeader("X-RateLimit-Remaining", String(rl.remaining));

  // --- AUTENTICAÇÃO ---
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Não autenticado" });

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const { data: userData, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !userData?.user) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
  if (userData.user.email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: "Apenas admin pode importar eventos" });
  }

  // --- VALIDAÇÃO DE INPUT ---
  const { url } = req.body || {};
  if (!url || typeof url !== "string") return res.status(400).json({ error: "URL obrigatória" });
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    return res.status(400).json({ error: "URL inválida" });
  }
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    return res.status(400).json({ error: "Apenas http/https" });
  }
  // Bloqueia SSRF — IPs privados/localhost
  const host = parsedUrl.hostname.toLowerCase();
  const blockedHostPatterns = [
    /^localhost$/,
    /^127\./,
    /^10\./,
    /^192\.168\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
    /\.local$/,
    /\.internal$/,
  ];
  if (blockedHostPatterns.some((p) => p.test(host))) {
    return res.status(400).json({ error: "Host não permitido" });
  }

  try {
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });

    if (!pageRes.ok) {
      return res.status(502).json({ error: `Página retornou ${pageRes.status}` });
    }

    let html = await pageRes.text();
    if (html.length > 80_000) html = html.slice(0, 80_000);

    const message = await anthropic.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: {
        format: { type: "json_schema", schema: EVENT_SCHEMA },
        effort: "medium",
      },
      messages: [
        {
          role: "user",
          content: `Extraia os dados deste HTML de página de evento/festa em São José dos Campos.

REGRAS:
- Se a data não estiver explicitamente no HTML, use null. NUNCA invente data.
- image_url: prefira o banner/cartaz principal. URL absoluta.
- ticket_link: use a própria URL da página se não houver link separado.
- type: Funk se for MC/baile funk, Eletrônico se DJ/house/techno, Rock se banda rock/indie, Universitária se festa universitária, Outros pro resto.
- Campos opcionais sem certeza: use null.

HTML:
${html}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock) return res.status(500).json({ error: "Resposta vazia" });

    let data;
    try {
      data = JSON.parse(textBlock.text);
    } catch {
      return res.status(500).json({ error: "Resposta da IA não foi JSON válido" });
    }

    if (!data.ticket_link) data.ticket_link = url;

    return res.status(200).json({
      data,
      source_url: url,
      usage: {
        input_tokens: message.usage?.input_tokens,
        output_tokens: message.usage?.output_tokens,
      },
    });
  } catch (e) {
    // Log no servidor (Vercel logs), não vaza ao cliente
    console.error("[import-event] error:", e?.message || e);
    return res.status(500).json({ error: "Erro ao importar. Tente novamente." });
  }
}
