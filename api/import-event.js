// Vercel Serverless Function — extrai dados de evento a partir de uma URL.
// Recebe: POST { url }
// Retorna: { data: {name, date, time, location, address, ...}, source_url }
//
// Usa Claude API para parsear HTML em JSON estruturado.
// Requer env var: ANTHROPIC_API_KEY (configurada no Vercel)

import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Schema do evento — usado pelo structured output do Claude
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
    lineup: {
      type: "array",
      items: { type: "string" },
      description: "Artistas, DJs, MCs presentes",
    },
    price_text: { type: ["string", "null"], description: "Ex: 'R$30 antecipado'" },
    is_free: { type: "boolean" },
    image_url: { type: ["string", "null"], description: "URL absoluta da imagem/banner principal" },
    ticket_link: { type: ["string", "null"], description: "URL pra comprar ingresso" },
    type: {
      type: "string",
      enum: ["Universitária", "Eletrônico", "Funk", "Rock", "Outros"],
    },
    emoji: { type: "string", description: "1 emoji que represente o evento" },
  },
  required: [
    "name", "date", "time", "location", "address", "city",
    "description", "lineup", "price_text", "is_free",
    "image_url", "ticket_link", "type", "emoji",
  ],
  additionalProperties: false,
};

export default async function handler(req, res) {
  // CORS pra dev (em produção mesmo origin)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no servidor" });
  }

  const { url } = req.body || {};
  if (!url || typeof url !== "string" || !url.startsWith("http")) {
    return res.status(400).json({ error: "URL inválida" });
  }

  try {
    // Busca a página com User-Agent de browser pra evitar bloqueios básicos
    const pageRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
      },
      redirect: "follow",
    });

    if (!pageRes.ok) {
      return res.status(502).json({ error: `Página retornou ${pageRes.status}` });
    }

    let html = await pageRes.text();
    // Limita tamanho pra controlar custo (Claude lida bem com HTML truncado)
    if (html.length > 80000) html = html.slice(0, 80000);

    // Chama Claude com structured output
    const message = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: {
        format: {
          type: "json_schema",
          schema: EVENT_SCHEMA,
        },
        effort: "medium",
      },
      messages: [
        {
          role: "user",
          content: `Extraia os dados deste HTML de página de evento/festa em São José dos Campos.

REGRAS:
- Se a data não estiver explicitamente no HTML, use null. NUNCA invente data — datas inventadas causam mais erro que ausência.
- Para image_url, prefira o banner/cartaz principal do evento. URL deve ser absoluta (http/https).
- Para ticket_link, use a própria URL da página se não houver link separado.
- O tipo deve ser inferido pelos artistas/música/descrição. Funk se for MC/baile funk, Eletrônico se for DJ/house/techno, Rock se for banda rock/indie, Universitária se for festa universitária/calourada, Outros pro resto.
- Se algum campo opcional não estiver claro, use null em vez de inventar.

HTML:
${html}`,
        },
      ],
    });

    // Pega o primeiro bloco de texto (o JSON parseado)
    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock) {
      return res.status(500).json({ error: "Resposta da IA sem conteúdo de texto" });
    }

    let data;
    try {
      data = JSON.parse(textBlock.text);
    } catch (e) {
      return res.status(500).json({
        error: "IA retornou texto inválido",
        raw: textBlock.text.slice(0, 500),
      });
    }

    // Fallback do ticket_link pra própria URL
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
    console.error("[import-event] error:", e);
    return res.status(500).json({ error: e.message || "Erro desconhecido" });
  }
}
