// ─── SESC SJC SOURCE ──────────────────────────────────────────────────────────
// SESC São José dos Campos tem agenda pública
// https://www.sescsp.org.br/programacao/
import { RawEvent } from "../utils/normalize.ts";

const SESC_API = "https://www.sescsp.org.br/wp-json/sesc/v1/activities";

export async function fetchSescEvents(): Promise<RawEvent[]> {
  try {
    const params = new URLSearchParams({
      city: "São José dos Campos",
      per_page: "30",
      order: "asc",
      orderby: "start_date",
    });

    const res = await fetch(`${SESC_API}?${params}`, {
      headers: {
        "User-Agent": "VybeApp/1.0 (aggregador de eventos SJC)",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`SESC API error: ${res.status}`);
      return [];
    }

    const json = await res.json();
    const activities = Array.isArray(json) ? json : json?.data || [];

    return activities
      .filter((a: any) => {
        const city = (a.city || a.unit_city || "").toLowerCase();
        return city.includes("são josé") || city.includes("sao jose");
      })
      .map((a: any): RawEvent => ({
        name: a.title || a.name || "",
        starts_at: a.start_date || a.date,
        ends_at: a.end_date,
        venue_name: a.unit_name || a.venue || "SESC São José dos Campos",
        address: a.address || a.unit_address || "",
        city: "São José dos Campos",
        state: "SP",
        description: a.description || a.excerpt || "",
        image_url: a.thumbnail || a.image || null,
        ticket_link: a.url || a.link || "",
        is_free: a.is_free === true || a.free === "1",
        price_text: a.is_free ? "Grátis" : (a.price || ""),
        source: "sesc-sjc",
        source_event_id: String(a.id || a.slug || ""),
        source_url: a.url || a.link || "",
      }));
  } catch (err) {
    console.error("SESC SJC fetch error:", err);
    return [];
  }
}
