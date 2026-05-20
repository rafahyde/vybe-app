import { useState, useEffect, useRef } from "react";
import { supabase } from "./supabase";

const PLACES = [
  {
    id: 1, name: "Bar Coronel", type: "bar", distance: "0.3km",
    tags: ["petiscos", "chopp", "tradicional"], rating: 4.7, crowd: 80,
    vibe: "Lively", music: "Sertanejo", cover: "Grátis",
    color: "#FF6B6B",
    lat: -23.1825311, lng: -45.8833651,
    checkins: 34,
    address: "R. Francisco Raphael, 298 - Centro",
    reports: [
      { user: "Ana M.", avatar: "AM", time: "5min atrás", msg: "Chopp gelado e petiscos incríveis hoje! Tá cheio mas vale!", mood: "🔥" },
      { user: "Rafa S.", avatar: "RS", time: "12min atrás", msg: "Sem fila ainda, aproveita!", mood: "✨" },
    ]
  },
  {
    id: 2, name: "Honey Club", type: "club", distance: "1.4km",
    tags: ["eletrônico", "shows", "18+"], rating: 4.1, crowd: 92,
    vibe: "Packed", music: "House / Pop", cover: "R$40",
    color: "#A78BFA",
    lat: -23.193503999999997, lng: -45.890727299999995,
    checkins: 112,
    address: "Av. Dr. Ademar de Barros, 152 - Vila Adyana",
    reports: [
      { user: "Bia T.", avatar: "BT", time: "2min atrás", msg: "DJ está arrasando agora 🎧 pista lotada!", mood: "🔥" },
      { user: "Leo R.", avatar: "LR", time: "8min atrás", msg: "Fila ~20min. Dentro tá ótimo!", mood: "⚡" },
      { user: "Julia C.", avatar: "JC", time: "20min atrás", msg: "Melhor noite aqui em meses, estão tocando muito", mood: "🔥" },
    ]
  },
  {
    id: 3, name: "Buteco da Villa", type: "bar", distance: "2.1km",
    tags: ["boteco", "torresmo", "zona leste"], rating: 4.7, crowd: 58,
    vibe: "Relaxed", music: "Pagode / Samba", cover: "Grátis",
    color: "#34D399",
    lat: -23.174844399999998, lng: -45.8541844,
    checkins: 67,
    address: "Av. Prof. S. P. T. Pontes, 875 - Vila Industrial",
    reports: [
      { user: "Pedro A.", avatar: "PA", time: "15min atrás", msg: "Mesa na calçada disponível, clima perfeito essa noite 🌙", mood: "✨" },
    ]
  },
  {
    id: 4, name: "Buxixo Gastrobar", type: "restaurant", distance: "1.8km",
    tags: ["gastronomia", "cocktails", "vista"], rating: 4.6, crowd: 65,
    vibe: "Chill", music: "Deep House", cover: "Grátis",
    color: "#F59E0B",
    lat: -23.1954347, lng: -45.908351499999995,
    checkins: 89,
    address: "Av. Anchieta, 1580 - Jardim Esplanada",
    reports: [
      { user: "Mari F.", avatar: "MF", time: "3min atrás", msg: "Vista incrível hoje, vibes perfeitas 🏙️", mood: "✨" },
      { user: "Caio B.", avatar: "CB", time: "30min atrás", msg: "Ainda não tá lotado, corre pegar lugar!", mood: "⚡" },
    ]
  },
  {
    id: 5, name: "Hangar Gastronomia", type: "restaurant", distance: "2.0km",
    tags: ["temático", "aviação", "família"], rating: 4.8, crowd: 45,
    vibe: "Relaxed", music: "MPB", cover: "Grátis",
    color: "#60A5FA",
    lat: -23.197353099999997, lng: -45.90464610000001,
    checkins: 41,
    address: "Av. Barão do Rio Branco, 669 - Jd. Esplanada",
    reports: [
      { user: "Dani W.", avatar: "DW", time: "45min atrás", msg: "Tema de avião incrível, comida ótima. Ótimo pra conversar.", mood: "✨" },
    ]
  },
  {
    id: 6, name: "FREAKOUT", type: "club", distance: "1.6km",
    tags: ["rock", "underground", "alternativo"], rating: 3.6, crowd: 88,
    vibe: "Packed", music: "Rock / Alternativo", cover: "R$25",
    color: "#F43F5E",
    lat: -23.1911182, lng: -45.8915233,
    checkins: 178,
    address: "R. Luiz Jacinto, 240 - Centro",
    reports: [
      { user: "Thiago P.", avatar: "TP", time: "1min atrás", msg: "Rock pesado rolando agora 🎸 galera doida!", mood: "🔥" },
      { user: "Flávia N.", avatar: "FN", time: "7min atrás", msg: "Fila tá grande mas tô dentro, valeu a espera!", mood: "⚡" },
    ]
  },
];

const VIBES = ["All", "Quiet", "Chill", "Relaxed", "Lively", "Packed"];
const TYPES = ["All", "bar", "club", "restaurant"];
const EVENT_TYPES = ["Todos", "Universitária", "Show", "Eletrônico", "Funk", "Rock"];

const EVENTS = [
  {
    id: 1,
    name: "BATUKADA UNIVERSITÁRIA",
    type: "Universitária",
    date: "Sáb, 24 Mai",
    time: "23:00",
    location: "UNIVAP — Av. Shishima Hifumi, 2911",
    description: "A maior festa universitária de SJC está de volta! DJs convidados, open bar por 2h e muito agito. Não perde!",
    lineup: ["DJ Marquinhos", "DJ Letícia Lima", "MC Paulinho"],
    confirmed: 312,
    color: "#F472B6",
    gradient: "linear-gradient(135deg, #F472B6, #A78BFA)",
    tickets: [
      { lote: "1° Lote", price: "R$25", available: true },
      { lote: "2° Lote", price: "R$35", available: true },
      { lote: "Na porta", price: "R$50", available: true },
    ],
    ticketLink: "https://sympla.com.br",
    emoji: "🎓",
  },
  {
    id: 2,
    name: "HONEY CLUB PRESENTS: OVERLOAD",
    type: "Eletrônico",
    date: "Sex, 23 Mai",
    time: "00:00",
    location: "Honey Club — Av. Dr. Ademar de Barros, 152",
    description: "Uma noite de house music com os melhores DJs do circuito paulista. Pista quente, luz estroboscópica e muito bass.",
    lineup: ["DJ Snake Jr.", "Valentina Cruz", "KVSH"],
    confirmed: 489,
    color: "#A78BFA",
    gradient: "linear-gradient(135deg, #A78BFA, #60A5FA)",
    tickets: [
      { lote: "1° Lote", price: "R$40", available: false },
      { lote: "2° Lote", price: "R$55", available: true },
      { lote: "VIP", price: "R$120", available: true },
    ],
    ticketLink: "https://sympla.com.br",
    emoji: "🎧",
  },
  {
    id: 3,
    name: "BAILE DO VALE",
    type: "Funk",
    date: "Dom, 25 Mai",
    time: "22:00",
    location: "Arena Vale — R. dos Expedicionários, 500",
    description: "O baile que tomou conta do Vale! Funk, pagode e muito suingue. Entrada feminina com desconto até meia noite.",
    lineup: ["MC Davi", "MC Livinho", "DJ Batutinha"],
    confirmed: 728,
    color: "#34D399",
    gradient: "linear-gradient(135deg, #34D399, #F59E0B)",
    tickets: [
      { lote: "Feminino", price: "R$15", available: true },
      { lote: "Masculino", price: "R$30", available: true },
      { lote: "Casal", price: "R$40", available: true },
    ],
    ticketLink: "https://sympla.com.br",
    emoji: "🎤",
  },
  {
    id: 4,
    name: "FREAKOUT FEST",
    type: "Rock",
    date: "Sáb, 31 Mai",
    time: "21:00",
    location: "FREAKOUT — R. Luiz Jacinto, 240",
    description: "Festival de rock alternativo com 3 bandas ao vivo, praça de alimentação e muito headbanging. A noite mais pesada do ano!",
    lineup: ["Scalene", "Lagum", "Los Hermanos Cover"],
    confirmed: 215,
    color: "#F43F5E",
    gradient: "linear-gradient(135deg, #F43F5E, #F59E0B)",
    tickets: [
      { lote: "1° Lote", price: "R$35", available: true },
      { lote: "2° Lote", price: "R$45", available: true },
      { lote: "Na porta", price: "R$60", available: true },
    ],
    ticketLink: "https://sympla.com.br",
    emoji: "🎸",
  },
];

const crowdColor = (c) => c >= 90 ? "#EF4444" : c >= 65 ? "#F59E0B" : "#22C55E";
const crowdLabel = (c) => c >= 90 ? "Lotado" : c >= 65 ? "Movimentado" : "Tranquilo";
const crowdEmoji = (c) => c >= 90 ? "🔴" : c >= 65 ? "🟡" : "🟢";

function Avatar({ initials, color }) {
  return (
    <div style={{
      width: 34, height: 34, borderRadius: "50%",
      background: color + "22", color,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 11, fontWeight: 700, flexShrink: 0,
      border: `1.5px solid ${color}44`
    }}>{initials}</div>
  );
}

function CrowdBar({ value }) {
  const color = crowdColor(value);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>CROWD</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{crowdEmoji(value)} {value}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "#1e1e1e", overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${value}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${color}99, ${color})`,
          transition: "width 0.6s ease"
        }} />
      </div>
    </div>
  );
}

function PlaceCard({ place, onClick }) {
  return (
    <div onClick={() => onClick(place)} style={{
      background: "#111", border: "1px solid #222", borderRadius: 16,
      padding: 16, cursor: "pointer", transition: "transform 0.15s, border-color 0.15s",
      position: "relative", overflow: "hidden",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = place.color + "88"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#222"; }}
    >
      <div style={{
        position: "absolute", top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle at top right, ${place.color}18, transparent 70%)`,
        pointerEvents: "none"
      }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: place.color + "22", color: place.color,
              textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace"
            }}>{place.type}</span>
            <span style={{ fontSize: 11, color: "#555" }}>{place.distance}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f0f0f0" }}>{place.name}</h3>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>⭐ {place.rating}</div>
          <div style={{ fontSize: 11, color: "#555" }}>{place.checkins} aqui</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {place.tags.map(t => (
          <span key={t} style={{
            fontSize: 11, padding: "2px 8px", borderRadius: 20,
            background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a"
          }}>{t}</span>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 2, fontFamily: "monospace" }}>MÚSICA</div>
          <div style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>🎵 {place.music}</div>
        </div>
        <div style={{ flex: 1, background: "#1a1a1a", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 10, color: "#555", marginBottom: 2, fontFamily: "monospace" }}>ENTRADA</div>
          <div style={{ fontSize: 12, color: "#ccc", fontWeight: 600 }}>🎟 {place.cover}</div>
        </div>
      </div>
      <CrowdBar value={place.crowd} />
      {place.reports[0] && (
        <div style={{
          marginTop: 10, padding: "8px 10px",
          background: "#161616", borderRadius: 10,
          borderLeft: `3px solid ${place.color}66`
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>{place.reports[0].mood}</span>
            <span style={{ fontSize: 12, color: "#aaa", fontStyle: "italic", lineHeight: 1.3 }}>
              "{place.reports[0].msg.length > 60 ? place.reports[0].msg.slice(0, 57) + "…" : place.reports[0].msg}"
            </span>
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

  const submit = () => {
    if (!newReport.trim()) return;
    setReports([{ user: "Você", avatar: "VC", time: "agora", msg: newReport, mood: newMood }, ...reports]);
    setNewReport("");
    setSent(true);
    setTimeout(() => setSent(false), 2000);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 500, display: "flex", alignItems: "flex-end",
      backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: "#0d0d0d", borderRadius: "24px 24px 0 0",
        border: `1px solid ${place.color}44`,
        maxHeight: "90vh", overflowY: "auto", padding: "0 0 32px",
      }}>
        <div style={{ height: 4, width: 40, background: "#333", borderRadius: 2, margin: "14px auto 20px" }} />
        <div style={{ padding: "0 20px 16px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
                background: place.color + "22", color: place.color,
                textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace"
              }}>{place.type}</span>
              <h2 style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 800, color: "#f5f5f5" }}>{place.name}</h2>
              <div style={{ color: "#555", fontSize: 12 }}>📍 {place.address}</div>
              <div style={{ color: "#666", fontSize: 13, marginTop: 2 }}>{place.distance} · ⭐ {place.rating} · {place.checkins} check-ins</div>
            </div>
            <button onClick={onClose} style={{
              background: "#1a1a1a", border: "none", color: "#888",
              width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
              fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
            }}>✕</button>
          </div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "CROWD", val: crowdLabel(place.crowd), sub: `${place.crowd}%`, color: crowdColor(place.crowd) },
              { label: "MÚSICA", val: place.music, sub: "ao vivo", color: "#A78BFA" },
              { label: "ENTRADA", val: place.cover, sub: "cover", color: "#F59E0B" }
            ].map(item => (
              <div key={item.label} style={{
                background: "#111", borderRadius: 12, padding: "10px 12px",
                border: `1px solid ${item.color}22`
              }}>
                <div style={{ fontSize: 9, color: "#555", marginBottom: 3, fontFamily: "monospace" }}>{item.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: item.color }}>{item.val}</div>
                <div style={{ fontSize: 10, color: "#444" }}>{item.sub}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}><CrowdBar value={place.crowd} /></div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <h4 style={{ margin: 0, fontSize: 13, color: "#888", fontFamily: "monospace", letterSpacing: "0.08em" }}>
              ATUALIZAÇÕES · {reports.length}
            </h4>
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
          <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "#888", fontFamily: "monospace", letterSpacing: "0.08em" }}>
            TÁ LÁ? MANDA O VYBE
          </h4>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            {["🔥", "✨", "⚡", "😴", "🎵", "🍺"].map(m => (
              <button key={m} onClick={() => setNewMood(m)} style={{
                fontSize: 18, background: newMood === m ? "#1a1a1a" : "transparent",
                border: newMood === m ? `1.5px solid ${place.color}66` : "1.5px solid #222",
                borderRadius: 8, padding: "4px 8px", cursor: "pointer"
              }}>{m}</button>
            ))}
          </div>
          <textarea value={newReport} onChange={e => setNewReport(e.target.value)}
            placeholder="Como tá aí agora? Fila, música, clima..."
            style={{
              width: "100%", minHeight: 72, background: "#111",
              border: "1px solid #222", borderRadius: 12, padding: "10px 12px",
              color: "#ddd", fontSize: 14, resize: "none", boxSizing: "border-box",
              outline: "none", fontFamily: "inherit"
            }}
          />
          <button onClick={submit} style={{
            marginTop: 8, width: "100%", padding: 12,
            background: sent ? "#1a2e1a" : place.color,
            color: sent ? "#22C55E" : "#000",
            border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700,
            cursor: "pointer", transition: "background 0.3s"
          }}>
            {sent ? "✓ Update enviado!" : "📍 Enviar Atualização"}
          </button>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }`}</style>
    </div>
  );
}

function PreferencesModal({ onClose, onApply }) {
  const [vibePrefs, setVibePrefs] = useState([]);
  const [typePrefs, setTypePrefs] = useState([]);
  const [maxCrowd, setMaxCrowd] = useState(100);
  const toggle = (arr, setArr, val) =>
    setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(4px)", padding: 20
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0d0d0d", borderRadius: 20,
        border: "1px solid #222", padding: 24, width: "100%", maxWidth: 400
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#f5f5f5" }}>Seu Vybe</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 10, fontFamily: "monospace" }}>CLIMA</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VIBES.slice(1).map(v => (
              <button key={v} onClick={() => toggle(vibePrefs, setVibePrefs, v)} style={{
                padding: "6px 14px", borderRadius: 20,
                background: vibePrefs.includes(v) ? "#A78BFA22" : "#111",
                color: vibePrefs.includes(v) ? "#A78BFA" : "#666",
                border: vibePrefs.includes(v) ? "1px solid #A78BFA55" : "1px solid #222",
                cursor: "pointer", fontSize: 13, fontWeight: 600
              }}>{v}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 10, fontFamily: "monospace" }}>TIPO DE LUGAR</div>
          <div style={{ display: "flex", gap: 8 }}>
            {TYPES.slice(1).map(t => (
              <button key={t} onClick={() => toggle(typePrefs, setTypePrefs, t)} style={{
                padding: "6px 14px", borderRadius: 20,
                background: typePrefs.includes(t) ? "#34D39922" : "#111",
                color: typePrefs.includes(t) ? "#34D399" : "#666",
                border: typePrefs.includes(t) ? "1px solid #34D39955" : "1px solid #222",
                cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "capitalize"
              }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>MAX CROWD</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: crowdColor(maxCrowd) }}>{crowdEmoji(maxCrowd)} {maxCrowd}%</span>
          </div>
          <input type="range" min={20} max={100} step={5} value={maxCrowd}
            onChange={e => setMaxCrowd(+e.target.value)}
            style={{ width: "100%", accentColor: crowdColor(maxCrowd) }}
          />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#444", marginTop: 2 }}>
            <span>Tranquilo</span><span>Moderado</span><span>Qualquer</span>
          </div>
        </div>
        <button onClick={() => { onApply({ vibePrefs, typePrefs, maxCrowd }); onClose(); }} style={{
          width: "100%", padding: 14, background: "#A78BFA",
          border: "none", borderRadius: 12, color: "#000",
          fontSize: 15, fontWeight: 800, cursor: "pointer"
        }}>Aplicar ✓</button>
      </div>
    </div>
  );
}

function EventCard({ event, onClick }) {
  return (
    <div onClick={() => onClick(event)} style={{
      background: "#111", border: "1px solid #222", borderRadius: 20,
      overflow: "hidden", cursor: "pointer",
      transition: "transform 0.15s, border-color 0.15s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = event.color + "88"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#222"; }}
    >
      <div style={{
        background: event.gradient, padding: "24px 20px 16px",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", top: -20, right: -20, fontSize: 80,
          opacity: 0.15, transform: "rotate(-10deg)"
        }}>{event.emoji}</div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
              background: "rgba(0,0,0,0.3)", color: "#fff",
              textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace"
            }}>{event.type}</span>
            <h3 style={{ margin: "8px 0 4px", fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{event.name}</h3>
          </div>
          <div style={{ fontSize: 32 }}>{event.emoji}</div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>📅 {event.date}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>🕐 {event.time}</span>
        </div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>📍 {event.location}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {event.lineup.map(a => (
            <span key={a} style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 20,
              background: event.color + "22", color: event.color,
              border: `1px solid ${event.color}44`, fontWeight: 600
            }}>{a}</span>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <div style={{
            background: event.color, color: "#000",
            fontSize: 12, fontWeight: 800, padding: "6px 16px", borderRadius: 20
          }}>
            A partir de {event.tickets.find(t => t.available)?.price}
          </div>
        </div>
      </div>
    </div>
  );
}

function EventDetail({ event, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)",
      zIndex: 500, display: "flex", alignItems: "flex-end",
      backdropFilter: "blur(4px)"
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 480, margin: "0 auto",
        background: "#0d0d0d", borderRadius: "24px 24px 0 0",
        border: `1px solid ${event.color}44`,
        maxHeight: "92vh", overflowY: "auto", padding: "0 0 40px",
      }}>
        <div style={{ height: 4, width: 40, background: "#333", borderRadius: 2, margin: "14px auto 0" }} />
        <div style={{ background: event.gradient, padding: "20px 20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, fontSize: 120, opacity: 0.1 }}>{event.emoji}</div>
          <button onClick={onClose} style={{
            position: "absolute", top: 12, right: 12,
            background: "rgba(0,0,0,0.3)", border: "none", color: "#fff",
            width: 32, height: 32, borderRadius: "50%", cursor: "pointer",
            fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center"
          }}>✕</button>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20,
            background: "rgba(0,0,0,0.3)", color: "#fff",
            textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace"
          }}>{event.type}</span>
          <h2 style={{ margin: "8px 0 4px", fontSize: 24, fontWeight: 900, color: "#fff" }}>{event.name}</h2>
          <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>📅 {event.date}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>🕐 {event.time}</span>
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>📍 {event.location}</div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <h4 style={{ margin: "0 0 8px", fontSize: 11, color: "#555", fontFamily: "monospace", letterSpacing: "0.08em" }}>SOBRE O EVENTO</h4>
          <p style={{ margin: 0, fontSize: 14, color: "#aaa", lineHeight: 1.6 }}>{event.description}</p>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 11, color: "#555", fontFamily: "monospace", letterSpacing: "0.08em" }}>🎵 LINEUP</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {event.lineup.map((a, i) => (
              <div key={a} style={{
                display: "flex", alignItems: "center", gap: 12,
                background: "#111", borderRadius: 12, padding: "10px 14px",
                border: `1px solid ${event.color}22`
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: event.color + "22", color: event.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 800
                }}>{i + 1}</div>
                <span style={{ fontSize: 14, color: "#ddd", fontWeight: 600 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 11, color: "#555", fontFamily: "monospace", letterSpacing: "0.08em" }}>🎟 INGRESSOS</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {event.tickets.map(t => (
              <div key={t.lote} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#111", borderRadius: 12, padding: "12px 14px",
                border: t.available ? `1px solid ${event.color}33` : "1px solid #1a1a1a",
                opacity: t.available ? 1 : 0.5
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: t.available ? "#ddd" : "#555" }}>{t.lote}</div>
                  {!t.available && <div style={{ fontSize: 10, color: "#555" }}>Esgotado</div>}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: t.available ? event.color : "#444" }}>{t.price}</div>
              </div>
            ))}
          </div>
          <a href={event.ticketLink} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
            <button style={{
              width: "100%", padding: 14, background: event.gradient,
              border: "none", borderRadius: 14, color: "#fff",
              fontSize: 15, fontWeight: 800, cursor: "pointer",
            }}>🎟 Garantir Ingresso</button>
          </a>
          <div style={{ textAlign: "center", fontSize: 11, color: "#444", marginTop: 8 }}>
            Você será redirecionado para a plataforma de ingressos
          </div>
        </div>
      </div>
    </div>
  );
}

// FIX 1: O mapa agora é destruído corretamente quando troca de aba
function MapView({ places, onSelectPlace, isActive }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (!isActive) {
      // Destrói o mapa quando a aba não está ativa
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = [];
      }
      return;
    }

    if (leafletMapRef.current) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!window.L || !mapRef.current) return;
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [-23.1891, -45.8841],
        zoom: 14,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      const userIcon = L.divIcon({
        html: `<div style="width:16px;height:16px;background:#60A5FA;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(96,165,250,0.3)"></div>`,
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });
      L.marker([-23.1860, -45.8870], { icon: userIcon }).addTo(map)
        .bindPopup("<b>Você está aqui</b>");

      places.forEach(place => {
        const hue = place.color;
        const icon = L.divIcon({
          html: `<div style="
            background:${hue};
            color:#000;
            border-radius:20px;
            padding:5px 10px;
            font-size:11px;
            font-weight:800;
            white-space:nowrap;
            box-shadow:0 2px 12px ${hue}88;
            border:2px solid rgba(255,255,255,0.2);
            cursor:pointer;
            display:flex;align-items:center;gap:4px;
          ">
            ${place.crowd >= 90 ? "🔴" : place.crowd >= 65 ? "🟡" : "🟢"}
            ${place.name}
          </div>`,
          className: "",
          iconAnchor: [0, 0],
        });

        const marker = L.marker([place.lat, place.lng], { icon })
          .addTo(map)
          .on("click", () => onSelectPlace(place));

        markersRef.current.push(marker);
      });

      leafletMapRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = [];
      }
    };
  }, [isActive]);

  return (
    // FIX 2: z-index do mapa agora é menor que o da barra de navegação
    <div style={{ position: "relative", height: "100%", width: "100%", zIndex: 1 }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%", borderRadius: 0 }} />

      <div style={{
        position: "absolute", top: 16, left: 16, zIndex: 10,
        background: "rgba(10,10,10,0.85)", borderRadius: 12,
        border: "1px solid #222", padding: "10px 14px",
        backdropFilter: "blur(8px)"
      }}>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 6, fontFamily: "monospace" }}>CROWD AGORA</div>
        {[["🟢", "Tranquilo"], ["🟡", "Movimentado"], ["🔴", "Lotado"]].map(([e, l]) => (
          <div key={l} style={{ fontSize: 12, color: "#aaa", display: "flex", gap: 6, alignItems: "center", marginBottom: 2 }}>
            <span>{e}</span><span>{l}</span>
          </div>
        ))}
      </div>

      <div style={{
        position: "absolute", bottom: 100, left: "50%", transform: "translateX(-50%)",
        zIndex: 10, background: "rgba(10,10,10,0.85)", borderRadius: 20,
        border: "1px solid #222", padding: "6px 14px",
        fontSize: 12, color: "#777", whiteSpace: "nowrap",
        backdropFilter: "blur(8px)"
      }}>
        Toque em um lugar para ver detalhes
      </div>
    </div>
  );
}


function HomeMapView({ places, onSelectPlace, onAreaChange }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const allPlacesRef = useRef(places);

  useEffect(() => {
    allPlacesRef.current = places;
  }, [places]);

  useEffect(() => {
    if (leafletMapRef.current) return;
    if (mapRef.current && mapRef.current._leaflet_id) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      if (!window.L || !mapRef.current) return;
      if (mapRef.current._leaflet_id) return;
      const L = window.L;

      const map = L.map(mapRef.current, {
        center: [-23.1891, -45.8841],
        zoom: 14,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap © CARTO",
        subdomains: "abcd",
        maxZoom: 19
      }).addTo(map);

      L.control.zoom({ position: "bottomright" }).addTo(map);

      // User location dot
      const userIcon = L.divIcon({
        html: `<div style="width:14px;height:14px;background:#60A5FA;border:2.5px solid #fff;border-radius:50%;box-shadow:0 0 0 5px rgba(96,165,250,0.25)"></div>`,
        className: "", iconSize: [14, 14], iconAnchor: [7, 7],
      });
      L.marker([-23.1860, -45.8870], { icon: userIcon }).addTo(map)
        .bindPopup("<b>Você está aqui</b>");

      // Add markers for all places
      const addMarkers = (placeList) => {
        markersRef.current.forEach(m => m.remove());
        markersRef.current = [];
        placeList.forEach(place => {
          const icon = L.divIcon({
            html: `<div style="background:${place.color};color:#000;border-radius:20px;padding:5px 10px;font-size:11px;font-weight:800;white-space:nowrap;box-shadow:0 2px 12px ${place.color}88;border:2px solid rgba(255,255,255,0.2);cursor:pointer;display:flex;align-items:center;gap:4px;">${place.crowd >= 90 ? "🔴" : place.crowd >= 65 ? "🟡" : "🟢"} ${place.name}</div>`,
            className: "", iconAnchor: [0, 0],
          });
          const marker = L.marker([place.lat, place.lng], { icon })
            .addTo(map)
            .on("click", () => onSelectPlace(place));
          markersRef.current.push(marker);
        });
      };

      addMarkers(places);

      // Update cards when map stops moving
      const updateVisiblePlaces = () => {
        const bounds = map.getBounds();
        const visible = allPlacesRef.current.filter(p =>
          bounds.contains([p.lat, p.lng])
        );
        onAreaChange(visible.length > 0 ? visible : allPlacesRef.current);
      };

      map.on("moveend", updateVisiblePlaces);
      map.on("zoomend", updateVisiblePlaces);

      leafletMapRef.current = map;
      setTimeout(() => map.invalidateSize(), 100);
    };

    if (window.L) {
      initMap();
    } else {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initMap;
      document.head.appendChild(script);
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
        markersRef.current = [];
      }
    };
  }, []);

  return <div ref={mapRef} style={{ height: "100%", width: "100%", minHeight: "100vh" }} />;
}

export default function App() {
  const [tab, setTab] = useState("home");
  const [selected, setSelected] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [filterEventType, setFilterEventType] = useState("Todos");
  const [events, setEvents] = useState(EVENTS);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [areaPlaces, setAreaPlaces] = useState(PLACES);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (error) {
        setEvents(EVENTS);
      } else if (data && data.length > 0) {
        const formatted = data.map(e => ({
          id: e.id, name: e.name, type: e.type, date: e.date, time: e.time,
          location: e.location, address: e.address, description: e.description,
          lineup: e.lineup || [], color: e.color || "#A78BFA",
          gradient: e.gradient || `linear-gradient(135deg, ${e.color || "#A78BFA"}, #60A5FA)`,
          emoji: e.emoji || "🎉", tickets: e.tickets || [], ticketLink: e.ticket_link || "#",
        }));
        setEvents(formatted);
      } else {
        setEvents(EVENTS);
      }
      setLoadingEvents(false);
    };
    fetchEvents();
  }, []);

  const filteredEvents = events.filter(e => filterEventType === "Todos" || e.type === filterEventType);

  return (
    <div style={{ height: "100vh", background: "#080808", color: "#f5f5f5", maxWidth: 480, margin: "0 auto", position: "relative", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* HOME — Mapa como tela principal estilo Airbnb */}
      {tab === "home" && (
        <div style={{ flex: 1, position: "relative", overflow: "hidden", minHeight: 0 }}>

          {/* Header flutuante sobre o mapa */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 100, padding: "20px 16px 12px", background: "linear-gradient(180deg, rgba(8,8,8,0.95) 60%, transparent)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, background: "linear-gradient(90deg, #A78BFA, #F472B6, #FF6B6B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>vybe.</h1>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ background: "rgba(0,0,0,0.7)", border: "1px solid #333", borderRadius: 20, padding: "5px 12px", fontSize: 11, color: "#aaa", backdropFilter: "blur(8px)" }}>📍 SJC, SP</div>
                <button onClick={() => setShowPrefs(true)} style={{ background: prefs ? "#A78BFA22" : "rgba(0,0,0,0.7)", border: prefs ? "1px solid #A78BFA55" : "1px solid #333", borderRadius: 20, padding: "5px 12px", color: prefs ? "#A78BFA" : "#888", cursor: "pointer", fontSize: 11, fontWeight: 600, backdropFilter: "blur(8px)" }}>
                  {prefs ? "⚡ On" : "⚡ Filtros"}
                </button>
              </div>
            </div>
            {/* Filtros de tipo flutuantes */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
              {TYPES.map(t => (
                <button key={t} onClick={() => {
                  if (t === "All") setAreaPlaces(PLACES);
                  else setAreaPlaces(PLACES.filter(p => p.type === t));
                }} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 20, background: "rgba(0,0,0,0.75)", color: "#aaa", border: "1px solid #333", fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", backdropFilter: "blur(8px)" }}>{t === "All" ? "Todos" : t}</button>
              ))}
            </div>
          </div>

          {/* Mapa ocupa toda a tela */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
            <HomeMapView places={areaPlaces} onSelectPlace={setSelected} onAreaChange={setAreaPlaces} />
          </div>

          {/* Cards deslizantes na parte inferior */}
          <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, zIndex: 100 }}>
            <div style={{ padding: "0 0 8px 16px", display: "flex", gap: 10, overflowX: "auto", scrollbarWidth: "none" }}>
              {areaPlaces.length === 0 ? (
                <div style={{ background: "rgba(13,13,13,0.95)", border: "1px solid #222", borderRadius: 16, padding: "14px 20px", backdropFilter: "blur(12px)", whiteSpace: "nowrap" }}>
                  <div style={{ fontSize: 13, color: "#555" }}>Nenhum lugar nessa área</div>
                </div>
              ) : (
                areaPlaces.map(place => (
                  <div key={place.id} onClick={() => setSelected(place)} style={{ flexShrink: 0, width: 180, background: "rgba(13,13,13,0.95)", border: `1px solid ${place.color}44`, borderRadius: 16, padding: "12px 14px", cursor: "pointer", backdropFilter: "blur(12px)", transition: "transform 0.15s", }}
                    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                    onMouseLeave={e => e.currentTarget.style.transform = ""}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 20, background: place.color + "22", color: place.color, textTransform: "uppercase", fontFamily: "monospace" }}>{place.type}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#f0f0f0" }}>⭐ {place.rating}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#f0f0f0", marginBottom: 3 }}>{place.name}</div>
                    <div style={{ fontSize: 10, color: "#555", marginBottom: 8 }}>{place.distance} · {place.cover}</div>
                    <div style={{ height: 3, borderRadius: 2, background: "#1e1e1e", overflow: "hidden", marginBottom: 3 }}>
                      <div style={{ height: "100%", width: `${place.crowd}%`, borderRadius: 2, background: `linear-gradient(90deg, ${crowdColor(place.crowd)}99, ${crowdColor(place.crowd)})` }} />
                    </div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: crowdColor(place.crowd) }}>{crowdEmoji(place.crowd)} {place.crowd}% {crowdLabel(place.crowd)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {tab === "festas" && (
        <div style={{ flex: 1, overflow: "auto" }}>
          <div style={{ padding: "20px 16px 0", background: "#080808" }}>
            <h2 style={{ margin: "0 0 2px", fontSize: 24, fontWeight: 800, color: "#f5f5f5" }}>Festas & Shows 🎉</h2>
            <p style={{ margin: "0 0 14px", fontSize: 13, color: "#555" }}>Eventos próximos em São José dos Campos</p>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
              {EVENT_TYPES.map(t => (
                <button key={t} onClick={() => setFilterEventType(t)} style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, background: filterEventType === t ? "#f5f5f5" : "#111", color: filterEventType === t ? "#080808" : "#666", border: filterEventType === t ? "none" : "1px solid #222", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ padding: "12px 16px 100px", display: "flex", flexDirection: "column", gap: 14 }}>
            {loadingEvents ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Carregando eventos...</div>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Nenhum evento nessa categoria</div>
              </div>
            ) : (
              filteredEvents.map(event => (<EventCard key={event.id} event={event} onClick={setSelectedEvent} />))
            )}
          </div>
        </div>
      )}

      {tab === "live" && (
        <div style={{ flex: 1, overflow: "auto", padding: "20px 16px 100px" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#f5f5f5" }}>Ao Vivo 🔴</h2>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#555" }}>Updates em tempo real de quem está lá agora</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PLACES.flatMap(p => p.reports.map(r => ({ ...r, place: p }))).map((r, i) => (
              <div key={i} onClick={() => setSelected(r.place)} style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: 14, padding: "12px 14px", cursor: "pointer", borderLeft: `3px solid ${r.place.color}` }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <Avatar initials={r.avatar} color={r.place.color} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: r.place.color }}>{r.place.name}</span>
                      <span style={{ fontSize: 10, color: "#444" }}>·</span>
                      <span style={{ fontSize: 11, color: "#555" }}>{r.time}</span>
                      <span style={{ marginLeft: "auto", fontSize: 16 }}>{r.mood}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "#aaa", lineHeight: 1.4 }}>{r.msg}</p>
                    <div style={{ fontSize: 11, color: "#444", marginTop: 4 }}>por {r.user}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "saved" && (
        <div style={{ flex: 1, overflow: "auto", padding: "20px 16px 100px", textAlign: "center", paddingTop: 80 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>♡</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#555" }}>Nenhum lugar salvo</div>
          <div style={{ fontSize: 13, color: "#444", marginTop: 8 }}>Salve seus lugares favoritos para encontrá-los rápido</div>
        </div>
      )}

      {/* Barra de navegação */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, #080808 60%, transparent)", padding: "16px 20px 24px", zIndex: 400 }}>
        <div style={{ display: "flex", background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: 4, gap: 4 }}>
          {[
            { id: "home", icon: "🌐", label: "Início" },
            { id: "festas", icon: "🎉", label: "Festas" },
            { id: "live", icon: "🔴", label: "Ao Vivo" },
            { id: "saved", icon: "♡", label: "Salvos" }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 0", background: tab === t.id ? "#1e1e1e" : "transparent", border: "none", borderRadius: 12, cursor: "pointer", color: tab === t.id ? "#f5f5f5" : "#555", fontSize: 11, fontWeight: 600, position: "relative", zIndex: 400 }}>
              <div style={{ fontSize: 16, marginBottom: 1 }}>{t.icon}</div>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {selected && <PlaceDetail place={selected} onClose={() => setSelected(null)} />}
      {selectedEvent && <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {showPrefs && <PreferencesModal onClose={() => setShowPrefs(false)} onApply={setPrefs} />}
    </div>
  );
}