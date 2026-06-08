// ─── EVENTBRITE SOURCE ────────────────────────────────────────────────────────
// Eventbrite API v3 - requer token público (gratuito)
// Obtenha em: https://www.eventbrite.com/platform/api
import { RawEvent } from "../utils/normalize.ts";

const EVENTBRITE_API = "https://www.eventbriteapi.com/v3";
const TOKEN = Deno.env.get("EVENTBRITE_TOKEN") || "";

export async function fetchEventbriteEvents(): Promise<RawEvent[]> {
  if (!TOKEN) {
    console.warn("EVENTBRITE_TOKEN não configurado. Pulando Eventbrite.");
    return [];
  }

  try {
    const params = new URLSearchParams({
      "location.address": "São José dos Campos, SP, Brazil",
      "location.within": "30km",
      "start_date.range_start": new Date().toISOString().slice(0, 19) + "Z",
      "expand": "venue,ticket_availability",
      "page_size": "50",
      "sort_by": "date",
    });

    const res = await fetch(`${EVENTBRITE_API}/events/search/?${params}`, {
      headers: {
        "Authorization": `Bearer ${TOKEN}`,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      console.error(`Eventbrite API error: ${res.status}`);
      return [];
    }

    const json = await res.json();
    const events = json?.events || [];

    return events.map((e: any): RawEvent => ({
      name: e.name?.text || "",
      starts_at: e.start?.utc || e.start?.local,
      ends_at: e.end?.utc || e.end?.local,
      venue_name: e.venue?.name || "",
      address: e.venue?.address?.localized_address_display || "",
      city: e.venue?.address?.city || "São José dos Campos",
      state: e.venue?.address?.region || "SP",
      lat: e.venue?.latitude ? parseFloat(e.venue.latitude) : undefined,
      lng: e.venue?.longitude ? parseFloat(e.venue.longitude) : undefined,
      description: e.description?.text || e.summary || "",
      image_url: e.logo?.url || null,
      ticket_link: e.url,
      is_free: e.is_free === true,
      price_text: e.is_free ? "Grátis" : (e.ticket_availability?.minimum_ticket_price?.display || ""),
      price_min: e.ticket_availability?.minimum_ticket_price?.value
        ? parseFloat(e.ticket_availability.minimum_ticket_price.value) : undefined,
      source: "eventbrite",
      source_event_id: String(e.id),
      source_url: e.url,
      confirmed: e.ticket_availability?.has_available_tickets ? 1 : 0,
    }));
  } catch (err) {
    console.error("Eventbrite fetch error:", err);
    return [];
  }
}
