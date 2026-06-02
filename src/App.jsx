import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "./supabase";

// ─── DATA ────────────────────────────────────────────────────────────────────

// Dados locais removidos — app usa 100% o Supabase
const PLACES = [];

// Eventos vêm 100% do Supabase
const EVENTS = [];

const VIBES = ["Tranquilo", "Agitado", "Lotado"];
const TYPES = ["Todos", "bar", "club", "restaurant"];
const EVENT_TYPES = ["Todos", "Universitária", "Eletrônico", "Funk", "Rock"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const crowdColor = (c) => c >= 90 ? "#EF4444" : c >= 65 ? "#F59E0B" : "#22C55E";
const crowdLabel = (c) => c >= 90 ? "Lotado" : c >= 65 ? "Agitado" : "Tranquilo";
const crowdEmoji = (c) => c >= 90 ? "🔴" : c >= 65 ? "🟡" : "🟢";

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLng/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
function fmtDist(km) {
  if (km < 1) return Math.round(km * 1000) + "m";
  return km.toFixed(1) + "km";
}
const typeLabel = (t) => t === "bar" ? "Bar" : t === "club" ? "Balada" : t === "restaurant" ? "Restaurante" : t;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function Avatar({ initials, color }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: color + "22", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, border: `1.5px solid ${color}44` }}>
      {initials}
    </div>
  );
}

function CrowdBar({ value }) {
  const color = crowdColor(value);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#888", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>CHEIO</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{crowdEmoji(value)} {value}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "#1e1e1e", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}99, ${color})`, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

function PlaceCard({ place, onClick, isFav, onToggleFav }) {
  return (
    <div
      onClick={() => onClick(place)}
      style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: 16, cursor: "pointer", transition: "transform 0.15s, border-color 0.15s", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = place.color + "88"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#222"; }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${place.color}18, transparent 70%)`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: place.color + "22", color: place.color, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{typeLabel(place.type)}</span>
            <span style={{ fontSize: 11, color: "#555" }}>{place.distance}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f0f0f0" }}>{place.name}</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
          <button
            onClick={e => { e.stopPropagation(); onToggleFav?.(place); }}
            style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, padding: 0, lineHeight: 1, transition: "transform 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >{isFav ? "❤️" : "🤍"}</button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>⭐ {place.rating}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{place.checkins} aqui</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {place.tags.map(t => <span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a" }}>{t}</span>)}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 2, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>MÚSICA</div>
          <div style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>🎵 {place.music}</div>
        </div>
        <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 2, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>ENTRADA</div>
          <div style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>🎟 {place.cover}</div>
        </div>
      </div>
      <CrowdBar value={place.crowd} />
      {place.reports[0] && (
        <div style={{ marginTop: 10, padding: "8px 10px", background: "#161616", borderRadius: 10, borderLeft: `3px solid ${place.color}66` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>{place.reports[0].mood}</span>
            <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic", lineHeight: 1.3 }}>"{place.reports[0].msg.length > 60 ? place.reports[0].msg.slice(0, 57) + "…" : place.reports[0].msg}"</span>
          </div>
          <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>— {place.reports[0].user} · {place.reports[0].time}</div>
        </div>
      )}
    </div>
  );
}

function PlaceDetail({ place, onClose }) {
  const [newReport, setNewReport] = useState("");
  const [newMood, setNewMood] = useState("🔥");
  const [reports, setReports] = useState(place.reports);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!newReport.trim()) return;
    // Save to Supabase
    await supabase.from("reports").insert({
      place_id: place.id,
      user_name: "Você",
      msg: newReport,
      mood: newMood,
    });
    setReports(prev => [{ user: "Você", avatar: "VC", time: "agora", msg: newReport, mood: newMood }, ...prev]);
    setNewReport("");
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 500, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#0d0d0d", borderRadius: "24px 24px 0 0", border: `1px solid ${place.color}44`, maxHeight: "90vh", overflowY: "auto", padding: "0 0 32px" }}>
        <div style={{ height: 4, width: 40, background: "#333", borderRadius: 2, margin: "14px auto 20px" }} />
        <div style={{ padding: "0 20px 16px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: place.color + "22", color: place.color, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{place.type}</span>
              <h2 style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 800, color: "#f5f5f5" }}>{place.name}</h2>
              <div style={{ color: "#555", fontSize: 12 }}>📍 {place.address}</div>
              <div style={{ color: "#666", fontSize: 13, marginTop: 2 }}>{place.distance} · ⭐ {place.rating} · {place.checkins} check-ins</div>
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, background: "#1a1a1a", border: "1px solid #333", borderRadius: 20, padding: "5px 12px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#60A5FA" }}>Me levar até lá</span>
              </a>
            </div>
            <button onClick={onClose} style={{ background: "#1a1a1a", border: "none", color: "#888", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "CHEIO", val: crowdLabel(place.crowd), sub: `${place.crowd}%`, color: crowdColor(place.crowd) },
              { label: "MÚSICA", val: place.music, sub: "ao vivo", color: "#A78BFA" },
              { label: "ENTRADA", val: place.cover, sub: "cover", color: "#F59E0B" },
            ].map(item => (
              <div key={item.label} style={{ background: "#111", borderRadius: 12, padding: "10px 12px", border: `1px solid ${item.color}22` }}>
                <div style={{ fontSize: 9, color: "#555", marginBottom: 3, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.val}</div>
                <div style={{ fontSize: 10, color: "#444" }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}><CrowdBar value={place.crowd} /></div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 13, color: "#888", fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.08em" }}>ATUALIZAÇÕES · {reports.length}</h4>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22C55E", animation: "pulse 2s infinite" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reports.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", background: "#111", borderRadius: 12 }}>
                <Avatar initials={r.avatar} color={place.color} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 3 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#ddd" }}>{r.user}</span>
                    <span style={{ fontSize: 10, color: "#555" }}>{r.time}</span>
                    <span style={{ fontSize: 14, marginLeft: "auto" }}>{r.mood}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.4 }}>{r.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "#888", fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.08em" }}>TÁ LÁ? MANDA O VYBE</h4>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["🔥", "✨", "⚡", "😴", "🎵", "🍺"].map(m => (
              <button key={m} onClick={() => setNewMood(m)} style={{ fontSize: 18, background: newMood === m ? "#1a1a1a" : "transparent", border: newMood === m ? `1.5px solid ${place.color}66` : "1.5px solid #222", borderRadius: 8, padding: "4px 8px", cursor: "pointer" }}>{m}</button>
            ))}
          </div>
          <textarea value={newReport} onChange={e => setNewReport(e.target.value)} placeholder="Como tá aí agora? Fila, música, clima..." style={{ width: "100%", minHeight: 72, background: "#111", border: "1px solid #222", borderRadius: 12, padding: "10px 12px", color: "#ddd", fontSize: 14, resize: "none", boxSizing: "border-box", outline: "none", fontFamily: "inherit" }} />
          <button onClick={submit} style={{ marginTop: 8, width: "100%", padding: 12, background: sent ? "#1a2e1a" : place.color, color: sent ? "#22C55E" : "#000", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "background 0.3s" }}>
            {sent ? "✓ Update enviado!" : "📍 Enviar Atualização"}
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }`}</style>
    </div>
  );
}

function PreferencesModal({ onClose, onApply, current }) {
  const [vibePrefs, setVibePrefs] = useState(current?.vibePrefs ?? []);
  const [typePrefs, setTypePrefs] = useState(current?.typePrefs ?? []);
  const [maxCrowd, setMaxCrowd] = useState(current?.maxCrowd ?? 100);
  const toggle = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  const hasFilters = vibePrefs.length > 0 || typePrefs.length > 0 || maxCrowd < 100;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0d0d0d", borderRadius: 20, border: "1px solid #222", padding: 24, width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#f5f5f5" }}>Meu Vybe 🎛️</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 10, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>CLIMA</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VIBES.map(v => (
              <button key={v} onClick={() => toggle(vibePrefs, setVibePrefs, v)} style={{ padding: "6px 14px", borderRadius: 20, background: vibePrefs.includes(v) ? "#A78BFA22" : "#111", color: vibePrefs.includes(v) ? "#A78BFA" : "#666", border: vibePrefs.includes(v) ? "1px solid #A78BFA55" : "1px solid #222", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{v}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 10, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>TIPO DE LUGAR</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TYPES.slice(1).map(t => (
              <button key={t} onClick={() => toggle(typePrefs, setTypePrefs, t)} style={{ padding: "6px 14px", borderRadius: 20, background: typePrefs.includes(t) ? "#34D39922" : "#111", color: typePrefs.includes(t) ? "#34D399" : "#666", border: typePrefs.includes(t) ? "1px solid #34D39955" : "1px solid #222", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{typeLabel(t)}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>MAX CHEIO</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: crowdColor(maxCrowd) }}>{crowdEmoji(maxCrowd)} {maxCrowd}%</span>
          </div>
          <input type="range" min={20} max={100} step={5} value={maxCrowd} onChange={e => setMaxCrowd(+e.target.value)} style={{ width: "100%", accentColor: crowdColor(maxCrowd) }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#444", marginTop: 2 }}>
            <span>Tranquilo</span><span>Moderado</span><span>Qualquer</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {hasFilters && (
            <button onClick={() => { onApply(null); onClose(); }} style={{ flex: 1, padding: 14, background: "#111", border: "1px solid #333", borderRadius: 12, color: "#888", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Limpar</button>
          )}
          <button onClick={() => { onApply({ vibePrefs, typePrefs, maxCrowd }); onClose(); }} style={{ flex: 2, padding: 14, background: "#A78BFA", border: "none", borderRadius: 12, color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Aplicar ✓</button>
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, onClick, isFav, onToggleFav }) {
  return (
    <div
      onClick={() => onClick(event)}
      style={{ background: "#111", border: "1px solid #222", borderRadius: 20, overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, border-color 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = event.color + "88"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#222"; }}
    >
      <div style={{ background: event.gradient, padding: "24px 20px 16px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.15, transform: "rotate(-10deg)" }}>{event.emoji}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(0,0,0,0.3)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{event.type}</span>
            <h3 style={{ margin: "8px 0 4px", fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{event.name}</h3>
          </div>
          <div style={{ fontSize: 32 }}>{event.emoji}</div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>📅 {event.date}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>🕐 {event.time}</span>
        </div>
        <button onClick={e => { e.stopPropagation(); onToggleFav?.(event); }} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {isFav ? "❤️" : "🤍"}
        </button>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>📍 {event.location}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {event.lineup.map(a => <span key={a} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: event.color + "22", color: event.color, border: `1px solid ${event.color}44`, fontWeight: 600 }}>{a}</span>)}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "#555" }}>👥 {event.confirmed} confirmados</span>
          <div style={{ background: event.color, color: "#000", fontSize: 12, fontWeight: 800, padding: "6px 16px", borderRadius: 20 }}>
            A partir de {event.tickets.find(t => t.available)?.price ?? "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventDetail({ event, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 500, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#0d0d0d", borderRadius: "24px 24px 0 0", border: `1px solid ${event.color}44`, maxHeight: "92vh", overflowY: "auto", padding: "0 0 40px" }}>
        <div style={{ height: 4, width: 40, background: "#333", borderRadius: 2, margin: "14px auto 0" }} />
        <div style={{ background: event.gradient, padding: "20px 20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, fontSize: 120, opacity: 0.1 }}>{event.emoji}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.3)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(0,0,0,0.3)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>{event.type}</span>
          <h2 style={{ margin: "8px 0 4px", fontSize: 24, fontWeight: 900, color: "#fff" }}>{event.name}</h2>
          <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>📅 {event.date}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>🕐 {event.time}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>📍 {event.location}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 6, fontWeight: 600 }}>👥 {event.confirmed} confirmados</div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.08em" }}>SOBRE O EVENTO</h4>
          <p style={{ margin: 0, fontSize: 14, color: "#aaa", lineHeight: 1.6 }}>{event.description}</p>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.08em" }}>🎵 LINEUP</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {event.lineup.map((a, i) => (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, background: "#111", borderRadius: 12, padding: "10px 14px", border: `1px solid ${event.color}22` }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: event.color + "22", color: event.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{i + 1}</div>
                <span style={{ fontSize: 14, color: "#ddd", fontWeight: 600 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 11, color: "#555", fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.08em" }}>🎟 INGRESSOS</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {event.tickets.map(t => (
              <div key={t.lote} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", borderRadius: 12, padding: "12px 14px", border: t.available ? `1px solid ${event.color}33` : "1px solid #1a1a1a", opacity: t.available ? 1 : 0.5 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.available ? "#ddd" : "#555" }}>{t.lote}</div>
                  {!t.available && <div style={{ fontSize: 10, color: "#555" }}>Esgotado</div>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: t.available ? event.color : "#444" }}>{t.price}</div>
              </div>
            ))}
          </div>
          <a href={event.ticketLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <button style={{ width: "100%", padding: 14, background: event.gradient, border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>🎟 Garantir Ingresso</button>
          </a>
          <div style={{ textAlign: "center", fontSize: 11, color: "#444", marginTop: 8 }}>Você será redirecionado para a plataforma de ingressos</div>
        </div>
      </div>
    </div>
  );
}

// ─── HOME MAP VIEW (com localização real) ────────────────────────────────────

function HomeMapView({ places, onSelectPlace, onAreaChange, userLocation, activeType }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const addMarkersRef = useRef(null);
  const placesRef = useRef(places);
  const onSelectRef = useRef(onSelectPlace);
  const onAreaRef = useRef(onAreaChange);
  const userLocationRef = useRef(userLocation);

  useEffect(() => { onSelectRef.current = onSelectPlace; }, [onSelectPlace]);
  useEffect(() => { onAreaRef.current = onAreaChange; }, [onAreaChange]);
  useEffect(() => { userLocationRef.current = userLocation; }, [userLocation]);

  // Atualiza marcador do usuário quando localização muda
  useEffect(() => {
    if (!leafletMapRef.current || !window.L || !userLocation) return;
    const L = window.L;
    const { lat, lng } = userLocation;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([lat, lng]);
    } else {
      const icon = L.divIcon({
        html: `<div style="position:relative;width:20px;height:20px;">
          <div style="position:absolute;inset:0;background:#60A5FA;border-radius:50%;opacity:0.3;animation:userPulse 2s infinite;"></div>
          <div style="position:absolute;inset:2px;background:#60A5FA;border:2.5px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(96,165,250,0.6);"></div>
        </div>`,
        className: "",
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      userMarkerRef.current = L.marker([lat, lng], { icon })
        .addTo(leafletMapRef.current)
        .bindPopup("<b>Você está aqui</b>");
    }

    // Centraliza o mapa na localização real do usuário (só na primeira vez)
    if (userLocation.firstTime) {
      leafletMapRef.current.setView([lat, lng], 14, { animate: true });
    }
  }, [userLocation]);

  // Rebuild markers quando lugares mudam
  useEffect(() => {
    placesRef.current = places;
    const tryUpdate = () => {
      if (!addMarkersRef.current || !leafletMapRef.current) {
        setTimeout(tryUpdate, 300);
        return;
      }
      addMarkersRef.current(places);
      const bounds = leafletMapRef.current.getBounds();
      const visible = places.filter(p => bounds.contains([p.lat, p.lng]));
      onAreaRef.current(visible.length > 0 ? visible : places);
    };
    tryUpdate();
  }, [places]);

  // Inicializa mapa uma vez
  useEffect(() => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }
    if (!document.getElementById("vybe-fonts")) {
      const link = document.createElement("link");
      link.id = "vybe-fonts";
      link.rel = "stylesheet";
      link.href = "https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;600;700&display=swap";
      document.head.appendChild(link);
    }
    if (!document.getElementById("vybe-map-style")) {
      const style = document.createElement("style");
      style.id = "vybe-map-style";
      style.innerHTML = `
        .leaflet-container { background: #080808 !important; }
        .vybe-marker { background: transparent !important; border: none !important; }
        .vybe-pin-wrap { display:flex; flex-direction:column; align-items:center; cursor:pointer; }
        .vybe-pin { width:42px; height:42px; border-radius:50% 50% 50% 0; transform:rotate(-45deg); display:flex; align-items:center; justify-content:center; box-shadow:0 6px 18px rgba(0,0,0,0.5); border:2px solid rgba(255,255,255,0.65); }
        .vybe-pin span { transform:rotate(45deg); font-size:18px; line-height:1; }
        .vybe-pin-dot { width:7px; height:7px; border-radius:50%; margin-top:2px; opacity:0.75; }
        @keyframes userPulse { 0%,100%{transform:scale(1);opacity:0.3} 50%{transform:scale(2);opacity:0} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `;
      document.head.appendChild(style);
    }

    const getEmoji = (type) => type === "bar" ? "🍺" : type === "club" ? "🎵" : type === "restaurant" ? "🍽️" : "📍";

    const initMap = () => {
      if (!window.L || !mapRef.current || leafletMapRef.current) return;
      const L = window.L;
      if (mapRef.current._leaflet_id) {
        mapRef.current._leaflet_id = null;
        try { mapRef.current.innerHTML = ""; } catch (e) {}
      }

      const initialCenter = userLocationRef.current 
        ? [userLocationRef.current.lat, userLocationRef.current.lng]
        : [-23.1891, -45.8841];
      const map = L.map(mapRef.current, { center: initialCenter, zoom: 15, zoomControl: false });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const addMarkersRef_type = { current: activeType };
      const addMarkers = (list) => {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        const filtered = addMarkersRef_type.current && addMarkersRef_type.current !== "Todos"
          ? list.filter(p => p.type === addMarkersRef_type.current)
          : list;
        filtered.forEach(place => {
          if (typeof place.lat !== "number" || typeof place.lng !== "number" || isNaN(place.lat) || isNaN(place.lng)) return;
          const icon = L.divIcon({
            html: `<div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;">
              <div style="
                width:28px;height:28px;
                background:${place.color};
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                display:flex;align-items:center;justify-content:center;
                box-shadow:0 2px 8px ${place.color}88;
                border:1.5px solid rgba(255,255,255,0.5);
              ">
                <span style="transform:rotate(45deg);font-size:12px;line-height:1">${getEmoji(place.type)}</span>
              </div>
              <div style="width:4px;height:4px;background:${place.color};border-radius:50%;margin-top:1px;opacity:0.6;"></div>
            </div>`,
            className: "vybe-marker", iconSize: [28, 36], iconAnchor: [14, 36], popupAnchor: [0, -36],
          });
          const marker = L.marker([place.lat, place.lng], { icon })
            .addTo(map)
            .on("click", () => onSelectRef.current(place));
          markersRef.current.push(marker);
        });
      };

      addMarkersRef.current = addMarkers;
      addMarkers(placesRef.current);

      const updateVisible = () => {
        const bounds = map.getBounds();
        const zoom = map.getZoom();
        const visible = placesRef.current.filter(p => bounds.contains([p.lat, p.lng]));
        onAreaRef.current(visible.length > 0 ? visible : placesRef.current);
        // Show/hide pins based on zoom level
        markersRef.current.forEach(m => {
          const el = m.getElement();
          if (el) el.style.opacity = zoom >= 12 ? "1" : "0";
        });
      };

      map.on("moveend", updateVisible);
      map.on("zoomend", updateVisible);
      leafletMapRef.current = map;
      setTimeout(() => { map.invalidateSize(); updateVisible(); }, 250);
    };

    if (window.L) {
      initMap();
    } else {
      const existing = document.querySelector('script[src*="leaflet@1.9.4"]');
      if (existing) {
        existing.addEventListener("load", initMap);
      } else {
        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = initMap;
        document.head.appendChild(script);
      }
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = [];
        userMarkerRef.current = null;
        addMarkersRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} style={{ position: "absolute", inset: 0, background: "#080808" }} />;
}

function LoginScreen({ onGuest }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) { alert("Erro: " + error.message); setLoading(false); }
  };

  return (
    <div style={{ height: "100%", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", fontFamily: "'Inter Tight', -apple-system, system-ui, sans-serif", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "10%", left: "20%", width: 200, height: 200, borderRadius: "50%", background: "#A78BFA", opacity: 0.08, filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 250, height: 250, borderRadius: "50%", background: "#F472B6", opacity: 0.08, filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 56, fontWeight: 900, background: "linear-gradient(90deg, #A78BFA, #F472B6, #FF6B6B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-2px", lineHeight: 1.2, paddingBottom: 4 }}>vybe.</h1>
        <p style={{ margin: 0, fontSize: 15, color: "#666", fontWeight: 500 }}>Descubra o que tá rolando perto de você</p>
      </div>
      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 12 }}>
        <button
          onClick={handleGoogle} disabled={loading}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 20px", background: "#fff", border: "none", borderRadius: 14, cursor: loading ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 700, color: "#111", opacity: loading ? 0.7 : 1, transition: "transform 0.15s" }}
          onMouseEnter={e => !loading && (e.currentTarget.style.transform = "translateY(-1px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {loading ? "Entrando..." : "Continuar com Google"}
        </button>
        <button disabled style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 20px", background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", border: "none", borderRadius: 14, cursor: "not-allowed", fontSize: 15, fontWeight: 700, color: "#fff", opacity: 0.4 }}>
          <span style={{ fontSize: 20 }}>📸</span>Continuar com Instagram
          <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: 20 }}>em breve</span>
        </button>
        <button disabled style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 20px", background: "#111", border: "1px solid #333", borderRadius: 14, cursor: "not-allowed", fontSize: 15, fontWeight: 700, color: "#fff", opacity: 0.4 }}>
          <svg width="20" height="20" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-96.8C82.6 727.2 10 625 10 525.4c0-190.5 126.4-291.5 250.8-291.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
          Continuar com Apple
          <span style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", padding: "2px 7px", borderRadius: 20 }}>em breve</span>
        </button>
        <button
          onClick={onGuest}
          style={{ marginTop: 8, padding: "12px 20px", background: "transparent", border: "1px solid #222", borderRadius: 14, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#666" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.borderColor = "#444"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#222"; }}
        >Explorar sem conta →</button>
      </div>
      <p style={{ position: "absolute", bottom: 32, fontSize: 11, color: "#333", textAlign: "center" }}>Ao entrar você concorda com os Termos de Uso</p>
    </div>
  );
}

function ProfileScreen({ user, onClose, favPlaces, favEvents, onLogout, onToggleFavPlace, onToggleFavEvent, onSelectPlace, onSelectEvent }) {
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Convidado";
  const email = user?.email || "Modo convidado";
  const avatar = user?.user_metadata?.avatar_url;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#080808", zIndex: 700, display: "flex", flexDirection: "column", fontFamily: "'Inter Tight', -apple-system, system-ui, sans-serif", overflowY: "auto" }}>
      <div style={{ background: "linear-gradient(135deg, #A78BFA, #F472B6)", padding: "60px 20px 70px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(0,0,0,0.3)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "3px solid #fff", marginBottom: 12 }}>
            {avatar ? (
              <img src={avatar} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none"><circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.9)"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="rgba(255,255,255,0.9)"/></svg>
              </div>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{email}</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "20px 20px 0", marginTop: -30 }}>
        <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #222", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#A78BFA", marginBottom: 4 }}>{favPlaces.length}</div>
          <div style={{ fontSize: 12, color: "#666" }}>Lugares salvos</div>
        </div>
        <div style={{ background: "#111", borderRadius: 16, padding: 16, border: "1px solid #222", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#F472B6", marginBottom: 4 }}>{favEvents.length}</div>
          <div style={{ fontSize: 12, color: "#666" }}>Festas salvas</div>
        </div>
      </div>
      <div style={{ padding: "20px 20px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 11, color: "#444", fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.08em", marginBottom: 4 }}>MINHA CONTA</div>
        <div style={{ background: "#111", borderRadius: 14, border: "1px solid #222", overflow: "hidden" }}>
          {[{ icon: "❤️", title: "Lugares salvos", sub: `${favPlaces.length} lugares`, border: true }, { icon: "🎉", title: "Festas salvas", sub: `${favEvents.length} festas`, border: false }].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: item.border ? "1px solid #1a1a1a" : "none" }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "#555" }}>{item.sub}</div>
              </div>
              <span style={{ fontSize: 16, color: "#444" }}>›</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: "#444", fontFamily: "'JetBrains Mono', ui-monospace, monospace", letterSpacing: "0.08em", marginBottom: 4, marginTop: 8 }}>EM BREVE</div>
        <div style={{ background: "#111", borderRadius: 14, border: "1px solid #1a1a1a", overflow: "hidden", opacity: 0.5 }}>
          {[{ icon: "🏆", title: "Badges e conquistas", sub: "Desbloqueie recompensas" }, { icon: "👥", title: "Amigos", sub: "Veja onde seus amigos estão" }, { icon: "📍", title: "Histórico de visitas", sub: "Lugares que você foi" }].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: i < 2 ? "1px solid #1a1a1a" : "none" }}>
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>{item.title}</div>
                <div style={{ fontSize: 11, color: "#555" }}>{item.sub}</div>
              </div>
              <span style={{ fontSize: 10, background: "#222", color: "#555", padding: "2px 8px", borderRadius: 20 }}>em breve</span>
            </div>
          ))}
        </div>
        <button onClick={onLogout} style={{ marginTop: 8, padding: 16, background: "#1a0a0a", border: "1px solid #EF444433", borderRadius: 14, color: "#EF4444", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          🚪 Sair da conta
        </button>
        <div style={{ textAlign: "center", fontSize: 11, color: "#333", marginTop: 8 }}>vybe. v1.0 · São José dos Campos</div>
      </div>
    </div>
  );
}


// ─── LIVE TAB ─────────────────────────────────────────────────────────────────
function LiveTab({ dbPlaces, user, onSelectPlace, onLiveCount }) {
  const [liveReports, setLiveReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const placeMap = {};
  dbPlaces.forEach(p => { placeMap[p.id] = p; });

  // Format time
  const fmtTime = (ts) => {
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return Math.floor(diff/60) + "min atrás";
    if (diff < 86400) return Math.floor(diff/3600) + "h atrás";
    return Math.floor(diff/86400) + "d atrás";
  };

  useEffect(() => {
    // Fetch initial reports
    const fetchReports = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (!error && data) {
        setLiveReports(data);
        // Count recent (last 2h)
        const recent = data.filter(r => (Date.now() - new Date(r.created_at)) < 7200000);
        onLiveCount?.(recent.length);
      }
      setLoading(false);
    };
    fetchReports();

    // Subscribe to realtime
    const channel = supabase
      .channel("reports-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reports" }, (payload) => {
        setLiveReports(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const allReports = [
    ...liveReports,
    ...dbPlaces.flatMap(p => (p.reports || []).map(r => ({
      id: `local-${p.id}-${r.user}`,
      place_id: p.id,
      user_name: r.user,
      user_avatar: r.avatar,
      msg: r.msg,
      mood: r.mood,
      created_at: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    })))
  ];

  return (
    <div style={{ flex: 1, overflow: "auto", padding: "20px 16px 100px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 900, letterSpacing: -0.8, color: "#f5f5f5" }}>Ao Vivo</h2>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", boxShadow: "0 0 8px #EF4444", animation: "pulse 2s infinite" }} />
      </div>
      <p style={{ margin: "0 0 20px", fontSize: 13, color: "#555" }}>Updates em tempo real de quem está lá agora</p>

      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#555" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
          <div>Carregando...</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {allReports.map((r, i) => {
            const place = placeMap[r.place_id];
            if (!place) return null;
            const initials = r.user_avatar || r.user_name?.slice(0,2)?.toUpperCase() || "??";
            return (
              <div key={r.id || i} onClick={() => onSelectPlace(place)} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "12px 14px", cursor: "pointer", borderLeft: `3px solid ${place.color}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: place.color + "22", color: place.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, border: `1.5px solid ${place.color}44` }}>
                    {initials.length <= 2 ? initials : initials.slice(0,2)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: place.color }}>{place.name}</span>
                      <span style={{ fontSize: 10, color: "#444" }}>·</span>
                      <span style={{ fontSize: 11, color: "#555" }}>{fmtTime(r.created_at)}</span>
                      <span style={{ marginLeft: "auto", fontSize: 16 }}>{r.mood}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.4 }}>{r.msg}</p>
                    <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>por {r.user_name}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── LOCATION MODAL ───────────────────────────────────────────────────────────
function LocationModal({ onClose, onUseGPS, locStatus }) {
  const [query, setQuery] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ", São José dos Campos")}&format=json&limit=1`);
      const data = await res.json();
      if (data[0]) {
        onUseGPS({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), firstTime: true });
        onClose();
      } else {
        alert("Endereço não encontrado. Tente novamente.");
      }
    } catch {
      alert("Erro ao buscar endereço.");
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 800, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#0d0d0d", borderRadius: "24px 24px 0 0", border: "1px solid #222", padding: "20px 20px 40px" }}>
        <div style={{ width: 40, height: 4, background: "#333", borderRadius: 2, margin: "0 auto 20px" }} />
        <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: "#f5f5f5" }}>Localização</h3>

        <button onClick={() => { onUseGPS(null); onClose(); }} style={{ width: "100%", padding: "14px 16px", background: "#111", border: "1px solid #60A5FA44", borderRadius: 14, color: "#60A5FA", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#60A5FA22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📍</div>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Minha localização atual</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 1 }}>{locStatus === "granted" ? "GPS ativo" : "Usar GPS do dispositivo"}</div>
          </div>
        </button>

        <div style={{ position: "relative" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Buscar endereço ou bairro..."
            style={{ width: "100%", boxSizing: "border-box", background: "#111", border: "1px solid #333", borderRadius: 14, padding: "14px 50px 14px 16px", color: "#f5f5f5", fontSize: 14, outline: "none", fontFamily: "'Inter Tight', system-ui" }}
          />
          <button onClick={handleSearch} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "#A78BFA", border: "none", borderRadius: 10, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── APP ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: "home", icon: "🌐", label: "Início" },
  { id: "festas", icon: "🎉", label: "Festas" },
  { id: "live", icon: "🔴", label: "Ao Vivo", badge: true },
  { id: "saved", icon: "♡", label: "Salvos" },
];

export default function App() {
  const [user, setUser] = useState(undefined);
  const [guest, setGuest] = useState(false);
  const [tab, setTab] = useState("home");
  const [selected, setSelected] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [filterEventType, setFilterEventType] = useState("Todos");
  const [events, setEvents] = useState(EVENTS);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [areaPlaces, setAreaPlaces] = useState(PLACES);
  const [dbPlaces, setDbPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(true);
  const [favPlaces, setFavPlaces] = useState([]);
  const [favEvents, setFavEvents] = useState([]);
  const [liveCount, setLiveCount] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [locStatus, setLocStatus] = useState("idle");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showLocModal, setShowLocModal] = useState(false);
  const [customLocQuery, setCustomLocQuery] = useState("");

  // PWA Service Worker
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Geolocalização — pede permissão automaticamente ao abrir
  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, firstTime: true });
        setLocStatus("granted");
        // Atualiza posição em tempo real
        navigator.geolocation.watchPosition(
          (p) => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude, firstTime: false }),
          () => {},
          { enableHighAccuracy: true, maximumAge: 10000 }
        );
      },
      () => setLocStatus("denied"),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Eventos
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (!error && data?.length > 0) {
        setEvents(data.map(e => ({
          id: e.id, name: e.name, type: e.type, date: e.date, time: e.time,
          location: e.location, description: e.description,
          lineup: e.lineup || [], confirmed: e.confirmed || 0,
          color: e.color || "#A78BFA",
          gradient: e.gradient || `linear-gradient(135deg, ${e.color || "#A78BFA"}, #60A5FA)`,
          emoji: e.emoji || "🎉", tickets: e.tickets || [],
          ticketLink: e.ticket_link || "#",
        })));
      } else {
        setEvents(EVENTS);
      }
      setLoadingEvents(false);
    };
    fetchEvents();
  }, []);

  // Busca lugares do Supabase
  useEffect(() => {
    const fetchPlaces = async () => {
      setLoadingPlaces(true);
      const { data, error } = await supabase.from("places").select("*");
      if (!error && data && data.length > 0) {
        const formatted = data.map(p => ({
          id: p.id,
          name: p.name,
          type: p.type,
          distance: p.distance || "",
          tags: Array.isArray(p.tags) ? p.tags : [],
          rating: Number(p.rating) || 0,
          crowd: Number(p.crowd) || 0,
          music: p.music || "",
          cover: p.cover || "Consultar",
          color: p.color || "#A78BFA",
          lat: Number(p.lat),
          lng: Number(p.lng),
          checkins: Number(p.checkins) || 0,
          address: p.address || "",
          reports: Array.isArray(p.reports) ? p.reports : [],
          image_url: p.image_url || null,
        }));
        setDbPlaces(formatted);
        setAreaPlaces(formatted);
      } else {
        setDbPlaces(PLACES);
        setAreaPlaces(PLACES);
      }
      setLoadingPlaces(false);
    };
    fetchPlaces();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null); setGuest(false); setShowProfile(false);
    setFavPlaces([]); setFavEvents([]);
  };

  const toggleFavPlace = (place) =>
    setFavPlaces(prev => prev.some(p => p.id === place.id) ? prev.filter(p => p.id !== place.id) : [...prev, place]);

  const toggleFavEvent = (event) =>
    setFavEvents(prev => prev.some(e => e.id === event.id) ? prev.filter(e => e.id !== event.id) : [...prev, event]);

  const activePlaces = dbPlaces.length > 0 ? dbPlaces : PLACES;
  const placesToShow = useMemo(() => {
    if (!prefs) return activePlaces;
    return activePlaces.filter(p => {
      if (prefs.typePrefs.length > 0 && !prefs.typePrefs.includes(p.type)) return false;
      if (prefs.vibePrefs.length > 0 && !prefs.vibePrefs.includes(crowdLabel(p.crowd))) return false;
      if (p.crowd > prefs.maxCrowd) return false;
      return true;
    });
  }, [prefs, dbPlaces]);

  const filteredEvents = useMemo(
    () => events.filter(e =>
      (filterEventType === "Todos" || e.type === filterEventType) &&
      (searchQuery === "" || e.name.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [events, filterEventType, searchQuery]
  );

  const filteredAreaPlaces = useMemo(
    () => searchQuery && tab === "home"
      ? areaPlaces.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : areaPlaces,
    [areaPlaces, searchQuery, tab]
  );

  if (user === undefined) {
    return (
      <div style={{ height: "100%", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg, #A78BFA, #F472B6, #FF6B6B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>vybe.</div>
      </div>
    );
  }

  if (user === null && !guest) {
    return <LoginScreen onGuest={() => setGuest(true)} />;
  }

  return (
    <div style={{ height: "100%", background: "#080808", color: "#f5f5f5", maxWidth: 480, margin: "0 auto", position: "relative", fontFamily: "'Inter Tight', -apple-system, system-ui, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* HOME */}
      {tab === "home" && (
        <div style={{ flex: 1, position: "relative", minHeight: 0, overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, zIndex: 1 }}>
            <HomeMapView places={placesToShow} onSelectPlace={setSelected} onAreaChange={setAreaPlaces} userLocation={userLocation} activeType={filterType} />
          </div>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 200, padding: "20px 16px 12px", background: "linear-gradient(180deg, rgba(8,8,8,0.95) 60%, transparent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, background: "linear-gradient(90deg, #A78BFA, #F472B6, #FF6B6B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>vybe.</h1>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {/* Indicador de localização */}
                <button onClick={() => setShowLocModal(true)} style={{ background: "rgba(0,0,0,0.8)", border: `1px solid ${locStatus === "granted" ? "#60A5FA55" : "#333"}`, borderRadius: 20, padding: "5px 12px", fontSize: 11, color: locStatus === "granted" ? "#60A5FA" : "#aaa", display: "flex", alignItems: "center", gap: 5, cursor: "pointer" }}>
                  {locStatus === "loading" ? "📡" : "📍"}
                  {locStatus === "granted" ? "Você aqui" : "SJC, SP"}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <button
                  onClick={() => setShowPrefs(true)}
                  style={{ background: "rgba(0,0,0,0.8)", border: `1px solid ${prefs ? "#A78BFA88" : "#333"}`, borderRadius: 20, padding: "5px 10px", fontSize: 13, cursor: "pointer", color: prefs ? "#A78BFA" : "#aaa", lineHeight: 1 }}
                >🎛️</button>
                <button onClick={() => setShowSearch(s => !s)} style={{ width: 34, height: 34, borderRadius: 10, background: showSearch ? "#A78BFA22" : "rgba(0,0,0,0.8)", border: `1px solid ${showSearch ? "#A78BFA55" : "#333"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showSearch ? "#A78BFA" : "#aaa"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
                </button>
                <div onClick={() => setShowProfile(true)} style={{ width: 34, height: 34, borderRadius: "50%", overflow: "hidden", cursor: "pointer", border: "2px solid #A78BFA44", flexShrink: 0 }}>
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><circle cx="12" cy="8" r="4" fill="#555"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="#555"/></svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
              {TYPES.map(t => (
                <button key={t} onClick={() => setAreaPlaces(t === "Todos" ? placesToShow : placesToShow.filter(p => p.type === t))} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 20, background: "rgba(0,0,0,0.8)", color: "#aaa", border: "1px solid #333", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {t === "Todos" ? "Todos" : typeLabel(t)}
                </button>
              ))}
            </div>
            {showSearch && (
              <div style={{ marginTop: 8 }}>
                <div style={{ position: "relative" }}>
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar estabelecimento..."
                    style={{ width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,0.92)", border: "1px solid #333", borderRadius: 12, padding: "10px 14px 10px 38px", color: "#f5f5f5", fontSize: 14, outline: "none", fontFamily: "'Inter Tight', system-ui", backdropFilter: "blur(12px)" }}
                  />
                  <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
                </div>
                {searchQuery.length > 0 && (
                  <div style={{ marginTop: 6, background: "rgba(10,10,10,0.98)", border: "1px solid #222", borderRadius: 14, overflow: "hidden", backdropFilter: "blur(16px)", maxHeight: 320, overflowY: "auto" }}>
                    {activePlaces.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                      <div style={{ padding: "20px 16px", textAlign: "center", color: "#555", fontSize: 13 }}>Nenhum lugar encontrado</div>
                    ) : (
                      activePlaces
                        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((p, i, arr) => {
                          const query = searchQuery.toLowerCase();
                          const name = p.name;
                          const idx = name.toLowerCase().indexOf(query);
                          const before = name.slice(0, idx);
                          const match = name.slice(idx, idx + query.length);
                          const after = name.slice(idx + query.length);
                          return (
                            <div key={p.id} onClick={() => { setSelected(p); setShowSearch(false); setSearchQuery(""); }}
                              style={{ padding: "12px 16px", borderBottom: i < arr.length - 1 ? "1px solid #1a1a1a" : "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}
                              onMouseEnter={e => e.currentTarget.style.background = "#111"}
                              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                            >
                              <div style={{ width: 38, height: 38, borderRadius: 10, background: p.color + "22", border: `1px solid ${p.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
                                {p.type === "bar" ? "🍺" : p.type === "club" ? "🎵" : "🍽️"}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5", letterSpacing: -0.3 }}>
                                  {before}<span style={{ color: p.color }}>{match}</span>{after}
                                </div>
                                <div style={{ fontSize: 12, color: "#555", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {p.address} · São José dos Campos
                                </div>
                              </div>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                            </div>
                          );
                        })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, zIndex: 200 }}>
            <div style={{ padding: "0 0 8px 16px", display: "flex", gap: 12, overflowX: "auto", scrollbarWidth: "none" }}>
              {loadingPlaces ? (
                [1,2,3].map(i => (
                  <div key={i} style={{ flexShrink: 0, width: 228, borderRadius: 20, background: "#111", border: "1px solid #1a1a1a", overflow: "hidden" }}>
                    <div style={{ height: 108, background: "linear-gradient(90deg, #1a1a1a 25%, #222 50%, #1a1a1a 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
                    <div style={{ padding: "12px 14px" }}>
                      <div style={{ height: 16, background: "#1a1a1a", borderRadius: 6, marginBottom: 8, width: "70%" }} />
                      <div style={{ height: 10, background: "#1a1a1a", borderRadius: 6, width: "50%" }} />
                    </div>
                  </div>
                ))
              ) : filteredAreaPlaces.map(place => {
                const dist = userLocation ? fmtDist(haversineKm(userLocation.lat, userLocation.lng, place.lat, place.lng)) : (place.distance || "—");
                const isFavPlace = favPlaces.some(p => p.id === place.id);
                return (
                  <div key={place.id} onClick={() => setSelected(place)}
                    style={{ flexShrink: 0, width: 228, borderRadius: 20, background: "rgba(10,10,10,0.96)", border: "1px solid rgba(245,245,245,0.08)", cursor: "pointer", overflow: "hidden", backdropFilter: "blur(20px)", transition: "transform 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = ""}
                  >
                    <div style={{ height: 108, position: "relative", background: place.image_url ? "transparent" : `repeating-linear-gradient(135deg, ${place.color}33 0 12px, ${place.color}1a 12px 24px)`, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                      {place.image_url && <img src={place.image_url} alt={place.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }} />}
                      {!place.image_url && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: place.color, textTransform: "uppercase", textAlign: "center", lineHeight: 1.4 }}>FOTO<br/>em breve</div>}
                      <div style={{ position: "absolute", top: 10, left: 10, right: 10, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <span style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", padding: "4px 10px", borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, letterSpacing: 1, color: "#fff", textTransform: "uppercase" }}>
                          {place.type === "bar" ? "🍺 Bar" : place.type === "club" ? "🎵 Balada" : "🍽️ Rest."}
                        </span>
                        <button onClick={e => { e.stopPropagation(); toggleFavPlace(place); }} style={{ width: 30, height: 30, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", border: "none", borderRadius: "50%", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {isFavPlace ? "❤️" : "🤍"}
                        </button>
                      </div>
                      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 40, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }} />
                    </div>
                    <div style={{ padding: "12px 14px 14px" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5", letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, marginBottom: 10 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#666" }}>{dist}</span>
                        <span style={{ width: 2, height: 2, borderRadius: "50%", background: "#444" }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "#666" }}>{place.cover}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 3, background: "#1e1e1e", overflow: "hidden", marginBottom: 6 }}>
                        <div style={{ height: "100%", width: `${place.crowd}%`, borderRadius: 3, background: `linear-gradient(90deg, ${crowdColor(place.crowd)}99, ${crowdColor(place.crowd)})` }} />
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: crowdColor(place.crowd), boxShadow: `0 0 5px ${crowdColor(place.crowd)}` }} />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, color: crowdColor(place.crowd) }}>{place.crowd}% {crowdLabel(place.crowd)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* FESTAS */}
      {tab === "festas" && (
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ position: "sticky", top: 0, zIndex: 5, background: "linear-gradient(180deg, #080808 80%, transparent)", paddingTop: 20, paddingBottom: 12 }}>
            <div style={{ padding: "0 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
              <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, margin: 0, lineHeight: 1, color: "#f5f5f5", fontFamily: "'Inter Tight', system-ui" }}>Festas</h1>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button onClick={() => setShowSearch(s => !s)} style={{ width: 40, height: 40, borderRadius: 12, background: showSearch ? "#A78BFA22" : "#111", border: `1px solid ${showSearch ? "#A78BFA55" : "#222"}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={showSearch ? "#A78BFA" : "#f5f5f5"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/></svg>
                </button>
                <div onClick={() => setShowProfile(true)} style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #A78BFA, #F472B6)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(167,139,250,0.4)" }}>
                  {user?.user_metadata?.avatar_url ? (
                    <img src={user.user_metadata.avatar_url} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{user?.email?.[0]?.toUpperCase() || "V"}</span>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none", padding: "0 16px" }}>
              {EVENT_TYPES.map(t => (
                <button key={t} onClick={() => setFilterEventType(t)} style={{ flexShrink: 0, padding: "7px 16px", borderRadius: 999, background: filterEventType === t ? "#f5f5f5" : "#111", color: filterEventType === t ? "#080808" : "#666", border: filterEventType === t ? "none" : "1px solid #222", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>{t}</button>
              ))}
            </div>
            {showSearch && (
              <div style={{ padding: "8px 16px 0" }}>
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar festa por nome..."
                  style={{ width: "100%", boxSizing: "border-box", background: "#111", border: "1px solid #222", borderRadius: 12, padding: "10px 14px", color: "#f5f5f5", fontSize: 14, outline: "none", fontFamily: "'Inter Tight', system-ui" }}
                />
              </div>
            )}
          </div>
          <div style={{ padding: "8px 16px 100px", display: "flex", flexDirection: "column", gap: 16 }}>
            {loadingEvents ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Carregando eventos...</div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div style={{ margin: "0 0", padding: "24px 20px", background: "#111", border: "1px dashed #222", borderRadius: 18, display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245,245,245,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🌚</div>
                <div><div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5" }}>Nada rolando aqui</div><div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>Tenta outro filtro →</div></div>
              </div>
            ) : filteredEvents.map(event => (
              <EventCard key={event.id} event={event} onClick={setSelectedEvent} isFav={favEvents.some(e => e.id === event.id)} onToggleFav={toggleFavEvent} />
            ))}
          </div>
        </div>
      )}

      {/* AO VIVO */}
      {tab === "live" && (
        <LiveTab dbPlaces={dbPlaces} user={user} onSelectPlace={setSelected} onLiveCount={setLiveCount} />
      )}

      {/* SALVOS */}
      {tab === "saved" && (
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ padding: "20px 16px 14px", display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <h1 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1, margin: 0, lineHeight: 1, color: "#f5f5f5" }}>Salvos</h1>
            <div onClick={() => setShowProfile(true)} style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #A78BFA, #F472B6)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 4px 14px rgba(167,139,250,0.4)" }}>
              {user?.user_metadata?.avatar_url ? <img src={user.user_metadata.avatar_url} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} /> : <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{user?.email?.[0]?.toUpperCase() || "V"}</span>}
            </div>
          </div>
          <div style={{ padding: "0 16px 10px", display: "flex", alignItems: "baseline", gap: 10 }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, margin: 0, color: "#f5f5f5" }}>Lugares Salvos</h2>
            <div style={{ background: "#A78BFA22", border: "1px solid #A78BFA44", color: "#A78BFA", padding: "2px 8px", borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700 }}>{favPlaces.length}</div>
          </div>
          {favPlaces.length === 0 ? (
            <div style={{ margin: "0 16px 16px", padding: "24px 20px", background: "#111", border: "1px dashed #222", borderRadius: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245,245,245,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🤍</div>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5" }}>Nenhum lugar ainda</div><div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>Encontre seu cantinho →</div></div>
            </div>
          ) : (
            <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
              {favPlaces.map(place => (
                <div key={place.id} onClick={() => setSelected(place)} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: place.color + "22", border: `1px solid ${place.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{place.type === "bar" ? "🍺" : place.type === "club" ? "🎵" : "🍽️"}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5", letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{place.name}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{userLocation ? fmtDist(haversineKm(userLocation.lat, userLocation.lng, place.lat, place.lng)) : place.distance} · {place.cover}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleFavPlace(place); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 4 }}>❤️</button>
                </div>
              ))}
            </div>
          )}
          <div style={{ padding: "8px 16px 10px", display: "flex", alignItems: "baseline", gap: 10 }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.4, margin: 0, color: "#f5f5f5" }}>Festas Salvas</h2>
            <div style={{ background: "#F472B622", border: "1px solid #F472B644", color: "#F472B6", padding: "2px 8px", borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700 }}>{favEvents.length}</div>
          </div>
          {favEvents.length === 0 ? (
            <div style={{ margin: "0 16px 100px", padding: "24px 20px", background: "#111", border: "1px dashed #222", borderRadius: 18, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245,245,245,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🤍</div>
              <div><div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5" }}>Nenhuma festa ainda</div><div style={{ fontSize: 13, color: "#555", marginTop: 2 }}>Vê o que tá rolando →</div></div>
            </div>
          ) : (
            <div style={{ padding: "0 16px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
              {favEvents.map(event => (
                <div key={event.id} onClick={() => onSelectEvent?.(event)} style={{ background: "#111", border: "1px solid #1a1a1a", borderRadius: 16, padding: 12, display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
                  <div style={{ width: 46, height: 46, borderRadius: 12, background: event.gradient || event.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{event.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f5f5f5", letterSpacing: -0.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{event.name}</div>
                    <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{event.date} · {event.time}</div>
                  </div>
                  <button onClick={e => { e.stopPropagation(); onToggleFavEvent?.(event); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 4 }}>❤️</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NAV BAR */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, #080808 60%, transparent)", padding: "16px 20px 24px", zIndex: 400 }}>
        <div style={{ display: "flex", background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: 4, gap: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTabChange(t.id)} style={{ flex: 1, padding: "8px 0", background: tab === t.id ? "#1e1e1e" : "transparent", border: "none", borderRadius: 12, cursor: "pointer", color: tab === t.id ? "#f5f5f5" : "#555", fontSize: 11, fontWeight: 600, position: "relative" }}>
              <div style={{ fontSize: 16, marginBottom: 1 }}>{t.icon}</div>
              {t.label}
              {t.badge && liveCount > 0 && tab !== "live" && (
                <div style={{ position: "absolute", top: 4, right: "50%", transform: "translateX(10px)", background: "#EF4444", borderRadius: 999, minWidth: 16, height: 16, fontSize: 9, fontWeight: 800, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{liveCount > 99 ? "99+" : liveCount}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* MODALS */}
      {selected && <PlaceDetail place={selected} onClose={() => setSelected(null)} />}
      {selectedEvent && <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {showPrefs && <PreferencesModal current={prefs} onClose={() => setShowPrefs(false)} onApply={setPrefs} />}
      {showProfile && <ProfileScreen user={user} onClose={() => setShowProfile(false)} favPlaces={favPlaces} favEvents={favEvents} onLogout={handleLogout} onToggleFavPlace={toggleFavPlace} onToggleFavEvent={toggleFavEvent} onSelectPlace={(p) => { setShowProfile(false); setSelected(p); }} onSelectEvent={(e) => { setShowProfile(false); setSelectedEvent(e); }} />}
      {showLocModal && <LocationModal onClose={() => setShowLocModal(false)} locStatus={locStatus} onUseGPS={(loc) => {
        if (loc === null) {
          // Re-request GPS
          navigator.geolocation?.getCurrentPosition(
            pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, firstTime: true }); setLocStatus("granted"); },
            () => setLocStatus("denied"),
            { enableHighAccuracy: true }
          );
        } else {
          setUserLocation(loc);
          setLocStatus("granted");
        }
      }} />}
    </div>
  );
}