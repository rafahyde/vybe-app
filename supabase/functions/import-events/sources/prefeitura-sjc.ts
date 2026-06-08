// ─── PREFEITURA SJC SOURCE ────────────────────────────────────────────────────
// Agenda Cultural oficial: https://www.sjc.sp.gov.br/servicos/cultura-e-lazer/agenda-cultural/
// Usa scraping leve via fetch + parsing de JSON-LD ou meta tags
import { RawEvent } from "../utils/normalize.ts";

const AGENDA_URL = "https://www.sjc.sp.gov.br/servicos/cultura-e-lazer/agenda-cultural/";

export async function fetchPrefeituraEvents(): Promise<RawEvent[]> {
  try {
    const res = await fetch(AGENDA_URL, {
      headers: {
        "User-Agent": "VybeApp/1.0 (aggregador de eventos SJC; vybe@example.com)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      console.error(`Prefeitura SJC error: ${res.status}`);
      return [];
    }

    const html = await res.text();

    // Tenta extrair eventos de JSON-LD embedded na página
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    const events: RawEvent[] = [];

    for (const match of jsonLdMatches) {
      try {
        const data = JSON.parse(match[1]);
        const items = Array.isArray(data) ? data : [data];

        for (const item of items) {
          if (item["@type"] === "Event") {
            events.push({
              name: item.name || "",
              starts_at: item.startDate,
              ends_at: item.endDate,
              venue_name: item.location?.name || "",
              address: item.location?.address?.streetAddress || "",
              city: item.location?.address?.addressLocality || "São José dos Campos",
              state: "SP",
              description: item.description || "",
              image_url: item.image || null,
              ticket_link: item.url || AGENDA_URL,
              is_free: true,
              price_text: "Grátis",
              source: "prefeitura-sjc",
              source_event_id: item.identifier || item.url || null,
              source_url: item.url || AGENDA_URL,
            });
          }
        }
      } catch {}
    }

    // Fallback: tenta extrair cards de eventos manualmente
    if (events.length === 0) {
      const cardMatches = html.matchAll(/<article[^>]*class="[^"]*evento[^"]*"[^>]*>([\s\S]*?)<\/article>/gi);
      for (const match of cardMatches) {
        const card = match[1];
        const titleMatch = card.match(/<h\d[^>]*>([\s\S]*?)<\/h\d>/i);
        const dateMatch = card.match(/(\d{2}\/\d{2}\/\d{4})/);
        const linkMatch = card.match(/href="([^"]+)"/);

        if (titleMatch && dateMatch) {
          events.push({
            name: titleMatch[1].replace(/<[^>]+>/g, "").trim(),
            date: dateMatch[1],
            city: "São José dos Campos",
            state: "SP",
            is_free: true,
            price_text: "Grátis",
            ticket_link: linkMatch ? linkMatch[1] : AGENDA_URL,
            source: "prefeitura-sjc",
            source_url: linkMatch ? linkMatch[1] : AGENDA_URL,
          });
        }
      }
    }

    return events;
  } catch (err) {
    console.error("Prefeitura SJC fetch error:", err);
    return [];
  }
}
