// ─── EVENT NORMALIZER ─────────────────────────────────────────────────────────
import { parseEventDate } from "./date.ts";
import { classifyEventType, getTypeConfig } from "./classify.ts";
import { generateFingerprint } from "./dedupe.ts";

export interface RawEvent {
  name: string;
  date?: string;
  time?: string;
  starts_at?: string;
  ends_at?: string;
  location?: string;
  venue_name?: string;
  address?: string;
  city?: string;
  state?: string;
  lat?: number;
  lng?: number;
  description?: string;
  lineup?: string[];
  image_url?: string;
  ticket_link?: string;
  price_min?: number;
  price_text?: string;
  is_free?: boolean;
  source: string;
  source_event_id?: string;
  source_url?: string;
  confirmed?: number;
}

export interface NormalizedEvent {
  name: string;
  type: string;
  date: string;
  time: string;
  starts_at: string | null;
  ends_at: string | null;
  location: string;
  venue_name: string;
  address: string;
  city: string;
  state: string;
  lat: number | null;
  lng: number | null;
  description: string;
  lineup: string[];
  confirmed: number;
  color: string;
  gradient: string;
  emoji: string;
  tickets: any[];
  ticket_link: string;
  image_url: string | null;
  price_min: number | null;
  price_text: string;
  is_free: boolean;
  source: string;
  source_event_id: string | null;
  source_url: string | null;
  fingerprint: string;
  status: string;
  imported_at: string;
  updated_at: string;
}

export function normalizeEvent(raw: RawEvent): NormalizedEvent | null {
  if (!raw.name?.trim()) return null;

  // Parse date
  let startsAt: string | null = null;
  if (raw.starts_at) {
    startsAt = new Date(raw.starts_at).toISOString();
  } else if (raw.date) {
    startsAt = parseEventDate(raw.date, raw.time);
  }

  // Skip expired
  if (startsAt && new Date(startsAt) < new Date()) return null;

  // Classify
  const type = classifyEventType(raw.name, raw.description || "");
  const config = getTypeConfig(type);

  // Fingerprint
  const location = raw.venue_name || raw.location || raw.address || "";
  const fingerprint = generateFingerprint(
    raw.name,
    startsAt || raw.date || "",
    location,
    raw.city || "sjc"
  );

  // Tickets
  const tickets = [];
  if (raw.price_text || raw.price_min !== undefined) {
    tickets.push({
      lote: "Ingresso",
      price: raw.price_text || (raw.is_free ? "Grátis" : raw.price_min ? `R$${raw.price_min}` : "Consultar"),
      available: true,
    });
  }

  const dateObj = startsAt ? new Date(startsAt) : null;
  const dateLabel = dateObj
    ? dateObj.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })
    : raw.date || "";
  const timeLabel = dateObj
    ? dateObj.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : raw.time || "";

  return {
    name: raw.name.trim(),
    type,
    date: dateLabel,
    time: timeLabel,
    starts_at: startsAt,
    ends_at: raw.ends_at ? new Date(raw.ends_at).toISOString() : null,
    location: raw.location || raw.venue_name || raw.address || "",
    venue_name: raw.venue_name || raw.location || "",
    address: raw.address || "",
    city: raw.city || "São José dos Campos",
    state: raw.state || "SP",
    lat: raw.lat || null,
    lng: raw.lng || null,
    description: raw.description || "",
    lineup: raw.lineup || [],
    confirmed: raw.confirmed || 0,
    color: config.color,
    gradient: config.gradient,
    emoji: config.emoji,
    tickets,
    ticket_link: raw.ticket_link || "",
    image_url: raw.image_url || null,
    price_min: raw.price_min || null,
    price_text: raw.price_text || (raw.is_free ? "Grátis" : ""),
    is_free: raw.is_free || false,
    source: raw.source,
    source_event_id: raw.source_event_id || null,
    source_url: raw.source_url || null,
    fingerprint,
    status: "active",
    imported_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
