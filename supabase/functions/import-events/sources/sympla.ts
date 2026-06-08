// ─── SYMPLA SOURCE ────────────────────────────────────────────────────────────
// Sympla tem API pública de busca - https://www.sympla.com.br/api/
// Não requer autenticação para busca básica por cidade
import { RawEvent } from "../utils/normalize.ts";

const SYMPLA_SEARCH_URL = "https://www.sympla.com.br/api/v1/events";
const SJC_CITY_ID = "6312"; // ID de São José dos Campos no Sympla

export async function fetchSymplaEvents(): Promise<RawEvent[]> {
  try {
    const params = new URLSearchParams({
      city_id: SJC_CITY_ID,
      state_id: "35",
      page_size: "50",
      order_by: "starts_at",
    });

    const res = await fetch(`${SYMPLA_SEARCH_URL}?${params}`, {
      headers: {
        "User-Agent": "VybeApp/1.0 (events aggregator; contact: vybe@example.com)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`Sympla API error: ${res.status}`);
      return [];
    }

    const json = await res.json();
    const events = json?.data?.events || json?.events || [];

    return events.map((e: any): RawEvent => ({
      name: e.name || e.title || "",
      starts_at: e.start_date_formats?.en_us || e.start_date || e.starts_at,
      ends_at: e.end_date_formats?.en_us || e.end_date,
      venue_name: e.address?.name || "",
      address: [e.address?.address, e.address?.complement].filter(Boolean).join(", "),
      city: e.address?.city || "São José dos Campos",
      state: e.address?.state || "SP",
      lat: e.address?.lat ? parseFloat(e.address.lat) : undefined,
      lng: e.address?.lon ? parseFloat(e.address.lon) : undefined,
      description: e.detail || e.description || "",
      image_url: e.image || e.cover_image || null,
      ticket_link: e.url || `https://www.sympla.com.br/${e.id}`,
      is_free: e.free === true || e.is_free === true,
      price_text: e.is_free ? "Grátis" : (e.min_price ? `A partir de R$${e.min_price}` : ""),
      price_min: e.min_price ? parseFloat(e.min_price) : undefined,
      source: "sympla",
      source_event_id: String(e.id),
      source_url: e.url || `https://www.sympla.com.br/${e.id}`,
      confirmed: e.total_sold || 0,
    }));
  } catch (err) {
    console.error("Sympla fetch error:", err);
    return [];
  }
}
