// ─── EVENT CLASSIFIER ─────────────────────────────────────────────────────────

export type EventType =
  | "Funk" | "Eletrônico" | "Rock" | "Universitária"
  | "Teatro" | "Cultural" | "Pagode" | "Sertanejo"
  | "MPB" | "Outros";

interface TypeConfig {
  color: string;
  gradient: string;
  emoji: string;
}

const TYPE_CONFIG: Record<EventType, TypeConfig> = {
  "Funk":          { color: "#34D399", gradient: "linear-gradient(135deg, #34D399, #F59E0B)", emoji: "🎤" },
  "Eletrônico":    { color: "#A78BFA", gradient: "linear-gradient(135deg, #A78BFA, #60A5FA)", emoji: "🎧" },
  "Rock":          { color: "#F43F5E", gradient: "linear-gradient(135deg, #F43F5E, #F59E0B)", emoji: "🎸" },
  "Universitária": { color: "#F472B6", gradient: "linear-gradient(135deg, #F472B6, #A78BFA)", emoji: "🎓" },
  "Teatro":        { color: "#818CF8", gradient: "linear-gradient(135deg, #818CF8, #A78BFA)", emoji: "🎭" },
  "Cultural":      { color: "#60A5FA", gradient: "linear-gradient(135deg, #60A5FA, #34D399)", emoji: "🎨" },
  "Pagode":        { color: "#F59E0B", gradient: "linear-gradient(135deg, #F59E0B, #FF6B6B)", emoji: "🥁" },
  "Sertanejo":     { color: "#FF6B6B", gradient: "linear-gradient(135deg, #FF6B6B, #F59E0B)", emoji: "🤠" },
  "MPB":           { color: "#34D399", gradient: "linear-gradient(135deg, #34D399, #60A5FA)", emoji: "🎶" },
  "Outros":        { color: "#888",    gradient: "linear-gradient(135deg, #444, #666)",        emoji: "🎉" },
};

const KEYWORDS: Array<{ type: EventType; terms: string[] }> = [
  { type: "Funk",          terms: ["funk", "open funk", "mandelão", "baile funk", "proibidão"] },
  { type: "Eletrônico",    terms: ["techno", "house", "eletrônico", "eletrônica", "dj set", "rave", "edm", "psy", "trance", "bass", "drum and bass"] },
  { type: "Rock",          terms: ["rock", "metal", "punk", "tributo", "banda ao vivo", "pop rock", "indie", "alternativo", "headbang"] },
  { type: "Universitária", terms: ["universitária", "universitario", "atlética", "atlético", "faculdade", "república", "calouros", "formatura", "inter-repúblicas"] },
  { type: "Teatro",        terms: ["teatro", "peça", "monólogo", "espetáculo teatral", "comédia stand", "stand-up", "stand up", "improviso"] },
  { type: "Cultural",      terms: ["exposição", "arte", "museu", "galeria", "feira cultural", "festival cultural", "sarau", "poesia", "literatura"] },
  { type: "Pagode",        terms: ["pagode", "samba", "boteco", "roda de samba"] },
  { type: "Sertanejo",     terms: ["sertanejo", "country", "cowboy", "rodeio", "dupla sertaneja"] },
  { type: "MPB",           terms: ["mpb", "bossa nova", "jazz", "blues", "soul", "axé", "forró", "baião"] },
];

export function classifyEventType(name: string, description: string = ""): EventType {
  const text = `${name} ${description}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  for (const { type, terms } of KEYWORDS) {
    if (terms.some(term => text.includes(term.normalize("NFD").replace(/[\u0300-\u036f]/g, "")))) {
      return type;
    }
  }
  return "Outros";
}

export function getTypeConfig(type: EventType): TypeConfig {
  return TYPE_CONFIG[type] || TYPE_CONFIG["Outros"];
}
