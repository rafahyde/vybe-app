import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./supabase";

const PLACES = [
  { id: 1, name: "Bar Coronel", type: "bar", distance: "0.3km", tags: ["petiscos", "chopp", "tradicional"], rating: 4.7, crowd: 80, vibe: "Lively", music: "Sertanejo", cover: "Grátis", color: "#FF6B6B", lat: -23.1825311, lng: -45.8833651, checkins: 34, address: "R. Francisco Raphael, 298 - Centro", reports: [{ user: "Ana M.", avatar: "AM", time: "5min atrás", msg: "Chopp gelado e petiscos incríveis hoje! Tá cheio mas vale!", mood: "🔥" }, { user: "Rafa S.", avatar: "RS", time: "12min atrás", msg: "Sem fila ainda, aproveita!", mood: "✨" }] },
  { id: 2, name: "Honey Club", type: "club", distance: "1.4km", tags: ["eletrônico", "shows", "18+"], rating: 4.1, crowd: 92, vibe: "Packed", music: "House / Pop", cover: "R$40", color: "#A78BFA", lat: -23.193503999999997, lng: -45.890727299999995, checkins: 112, address: "Av. Dr. Ademar de Barros, 152 - Vila Adyana", reports: [{ user: "Bia T.", avatar: "BT", time: "2min atrás", msg: "DJ está arrasando agora 🎧 pista lotada!", mood: "🔥" }, { user: "Leo R.", avatar: "LR", time: "8min atrás", msg: "Fila ~20min. Dentro tá ótimo!", mood: "⚡" }] },
  { id: 3, name: "Buteco da Villa", type: "bar", distance: "2.1km", tags: ["boteco", "torresmo", "zona leste"], rating: 4.7, crowd: 58, vibe: "Relaxed", music: "Pagode / Samba", cover: "Grátis", color: "#34D399", lat: -23.174844399999998, lng: -45.8541844, checkins: 67, address: "Av. Prof. S. P. T. Pontes, 875 - Vila Industrial", reports: [{ user: "Pedro A.", avatar: "PA", time: "15min atrás", msg: "Mesa na calçada disponível, clima perfeito essa noite 🌙", mood: "✨" }] },
  { id: 4, name: "Buxixo Gastrobar", type: "restaurant", distance: "1.8km", tags: ["gastronomia", "cocktails", "vista"], rating: 4.6, crowd: 65, vibe: "Chill", music: "Deep House", cover: "Grátis", color: "#F59E0B", lat: -23.1954347, lng: -45.908351499999995, checkins: 89, address: "Av. Anchieta, 1580 - Jardim Esplanada", reports: [{ user: "Mari F.", avatar: "MF", time: "3min atrás", msg: "Vista incrível hoje, vibes perfeitas 🏙️", mood: "✨" }] },
  { id: 5, name: "Hangar Gastronomia", type: "restaurant", distance: "2.0km", tags: ["temático", "aviação", "família"], rating: 4.8, crowd: 45, vibe: "Relaxed", music: "MPB", cover: "Grátis", color: "#60A5FA", lat: -23.197353099999997, lng: -45.90464610000001, checkins: 41, address: "Av. Barão do Rio Branco, 669 - Jd. Esplanada", reports: [{ user: "Dani W.", avatar: "DW", time: "45min atrás", msg: "Tema de avião incrível, comida ótima.", mood: "✨" }] },
  { id: 6, name: "FREAKOUT", type: "club", distance: "1.6km", tags: ["rock", "underground", "alternativo"], rating: 3.6, crowd: 88, vibe: "Packed", music: "Rock / Alternativo", cover: "R$25", color: "#F43F5E", lat: -23.1911182, lng: -45.8915233, checkins: 178, address: "R. Luiz Jacinto, 240 - Centro", reports: [{ user: "Thiago P.", avatar: "TP", time: "1min atrás", msg: "Rock pesado rolando agora 🎸 galera doida!", mood: "🔥" }] },
];

const VIBES = ["Tranquilo", "Agitado", "Lotado"];
const TYPES = ["Todos", "bar", "club", "restaurant"];
const EVENT_TYPES = ["Todos", "Universitária", "Show", "Eletrônico", "Funk", "Rock"];

const EVENTS = [
  { id: 1, name: "BATUKADA UNIVERSITÁRIA", type: "Universitária", date: "Sáb, 24 Mai", time: "23:00", location: "UNIVAP — Av. Shishima Hifumi, 2911", description: "A maior festa universitária de SJC está de volta! DJs convidados, open bar por 2h e muito agito. Não perde!", lineup: ["DJ Marquinhos", "DJ Letícia Lima", "MC Paulinho"], color: "#F472B6", gradient: "linear-gradient(135deg, #F472B6, #A78BFA)", tickets: [{ lote: "1° Lote", price: "R$25", available: true }, { lote: "2° Lote", price: "R$35", available: true }], ticketLink: "https://sympla.com.br", emoji: "🎓" },
  { id: 2, name: "HONEY CLUB PRESENTS: OVERLOAD", type: "Eletrônico", date: "Sex, 23 Mai", time: "00:00", location: "Honey Club — Av. Dr. Ademar de Barros, 152", description: "Uma noite de house music com os melhores DJs do circuito paulista.", lineup: ["DJ Snake Jr.", "Valentina Cruz", "KVSH"], color: "#A78BFA", gradient: "linear-gradient(135deg, #A78BFA, #60A5FA)", tickets: [{ lote: "2° Lote", price: "R$55", available: true }, { lote: "VIP", price: "R$120", available: true }], ticketLink: "https://sympla.com.br", emoji: "🎧" },
  { id: 3, name: "BAILE DO VALE", type: "Funk", date: "Dom, 25 Mai", time: "22:00", location: "Arena Vale — R. dos Expedicionários, 500", description: "O baile que tomou conta do Vale! Funk, pagode e muito suingue.", lineup: ["MC Davi", "MC Livinho", "DJ Batutinha"], color: "#34D399", gradient: "linear-gradient(135deg, #34D399, #F59E0B)", tickets: [{ lote: "Feminino", price: "R$15", available: true }, { lote: "Masculino", price: "R$30", available: true }], ticketLink: "https://sympla.com.br", emoji: "🎤" },
  { id: 4, name: "FREAKOUT FEST", type: "Rock", date: "Sáb, 31 Mai", time: "21:00", location: "FREAKOUT — R. Luiz Jacinto, 240", description: "Festival de rock alternativo com 3 bandas ao vivo.", lineup: ["Scalene", "Lagum", "Los Hermanos Cover"], color: "#F43F5E", gradient: "linear-gradient(135deg, #F43F5E, #F59E0B)", tickets: [{ lote: "1° Lote", price: "R$35", available: true }, { lote: "2° Lote", price: "R$45", available: true }], ticketLink: "https://sympla.com.br", emoji: "🎸" },
];

const crowdColor = (c) => c >= 90 ? "#EF4444" : c >= 65 ? "#F59E0B" : "#22C55E";
const crowdLabel = (c) => c >= 90 ? "Lotado" : c >= 65 ? "Agitado" : "Tranquilo";
const crowdEmoji = (c) => c >= 90 ? "🔴" : c >= 65 ? "🟡" : "🟢";


// ============================================================
// TELA DE PERFIL
// ============================================================
function ProfileScreen({ user, favPlaces, favEvents, onClose, onLogout }) {
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";
  const avatar = user?.user_metadata?.avatar_url || null;
  const initials = displayName.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase();

  return (
    <div style={{ position: "fixed", inset: 0, background: "#080808", zIndex: 700, display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif", overflowY: "auto" }}>
      
      {/* Header com gradiente */}
      <div style={{ background: "linear-gradient(135deg, #A78BFA, #F472B6)", padding: "60px 20px 70px", position: "relative", flexShrink: 0 }}>
        {/* Botão fechar */}
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(0,0,0,0.3)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        
        {/* Avatar */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          {avatar ? (
            <img src={avatar} alt="avatar" style={{ width: 80, height: 80, borderRadius: "50%", border: "3px solid rgba(255,255,255,0.5)", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(255,255,255,0.25)", border: "3px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800, color: "#fff" }}>
              {initials}
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", marginBottom: 4 }}>{displayName}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{email}</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: "0 20px", marginTop: -28, marginBottom: 20, display: "flex", gap: 12 }}>
        <div style={{ flex: 1, background: "#111", border: "1px solid #222", borderRadius: 16, padding: "16px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#A78BFA", marginBottom: 4 }}>{favPlaces.length}</div>
          <div style={{ fontSize: 11, color: "#666", fontFamily: "monospace" }}>LUGARES SALVOS</div>
        </div>
        <div style={{ flex: 1, background: "#111", border: "1px solid #222", borderRadius: 16, padding: "16px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 900, color: "#F472B6", marginBottom: 4 }}>{favEvents.length}</div>
          <div style={{ fontSize: 11, color: "#666", fontFamily: "monospace" }}>FESTAS SALVAS</div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding: "0 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        
        <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 4 }}>MINHA CONTA</div>

        {/* Lugares salvos */}
        <div onClick={onClose} style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#FF6B6B22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>❤️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>Lugares salvos</div>
              <div style={{ fontSize: 12, color: "#555" }}>{favPlaces.length} lugares</div>
            </div>
          </div>
          <span style={{ color: "#444", fontSize: 18 }}>›</span>
        </div>

        {/* Festas salvas */}
        <div onClick={onClose} style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: "16px 18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: "#F472B622", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎉</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f0" }}>Festas salvas</div>
              <div style={{ fontSize: 12, color: "#555" }}>{favEvents.length} festas</div>
            </div>
          </div>
          <span style={{ color: "#444", fontSize: 18 }}>›</span>
        </div>

        {/* Em breve */}
        <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace", letterSpacing: "0.08em", marginTop: 8, marginBottom: 4 }}>EM BREVE</div>
        
        {[
          { icon: "🏆", label: "Badges e conquistas", sub: "Seus troféus no vybe" },
          { icon: "📍", label: "Histórico de check-ins", sub: "Lugares que você visitou" },
          { icon: "👥", label: "Amigos", sub: "Veja onde seus amigos estão" },
          { icon: "🎟", label: "Meus ingressos", sub: "Histórico de compras" },
        ].map(item => (
          <div key={item.label} style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", opacity: 0.5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#888" }}>{item.label}</div>
                <div style={{ fontSize: 12, color: "#444" }}>{item.sub}</div>
              </div>
            </div>
            <span style={{ fontSize: 10, color: "#444", background: "#1a1a1a", padding: "2px 8px", borderRadius: 20 }}>breve</span>
          </div>
        ))}

        {/* Logout */}
        <button onClick={onLogout} style={{ marginTop: 16, marginBottom: 40, width: "100%", padding: 16, background: "transparent", border: "1px solid #EF444444", borderRadius: 16, color: "#EF4444", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          🚪 Sair da conta
        </button>
      </div>
    </div>
  );
}

// ============================================================
// TELA DE LOGIN
// ============================================================
function LoginScreen({ onLogin, onGuest }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin }
    });
    if (error) {
      alert("Erro ao entrar com Google: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", background: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 28px", fontFamily: "system-ui, -apple-system, sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Background blur circles */}
      <div style={{ position: "absolute", top: "10%", left: "20%", width: 200, height: 200, borderRadius: "50%", background: "#A78BFA", opacity: 0.08, filter: "blur(60px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "20%", right: "10%", width: 250, height: 250, borderRadius: "50%", background: "#F472B6", opacity: 0.08, filter: "blur(80px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "40%", right: "30%", width: 150, height: 150, borderRadius: "50%", background: "#FF6B6B", opacity: 0.06, filter: "blur(50px)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 48, padding: "0 8px" }}>
        <h1 style={{ margin: "0 0 8px", fontSize: 56, fontWeight: 900, background: "linear-gradient(90deg, #A78BFA, #F472B6, #FF6B6B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "-2px", lineHeight: 1.2, paddingBottom: 4 }}>vybe.</h1>
        <p style={{ margin: 0, fontSize: 15, color: "#666", fontWeight: 500 }}>Descubra o que tá rolando perto de você</p>
      </div>

      {/* Botões de login */}
      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* Google */}
        <button onClick={handleGoogle} disabled={loading} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 20px", background: "#fff", border: "none", borderRadius: 14, cursor: loading ? "not-allowed" : "pointer", fontSize: 15, fontWeight: 700, color: "#111", opacity: loading ? 0.7 : 1, transition: "opacity 0.2s, transform 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
          onMouseLeave={e => e.currentTarget.style.transform = ""}
        >
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {loading ? "Entrando..." : "Continuar com Google"}
        </button>

        {/* Instagram — em breve */}
        <button disabled style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 20px", background: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", border: "none", borderRadius: 14, cursor: "not-allowed", fontSize: 15, fontWeight: 700, color: "#fff", opacity: 0.4 }}>
          <span style={{ fontSize: 20 }}>📸</span>
          Continuar com Instagram
          <span style={{ fontSize: 10, background: "rgba(255,255,255,0.2)", padding: "2px 7px", borderRadius: 20 }}>em breve</span>
        </button>

        {/* Apple — em breve */}
        <button disabled style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 20px", background: "#111", border: "1px solid #333", borderRadius: 14, cursor: "not-allowed", fontSize: 15, fontWeight: 700, color: "#fff", opacity: 0.4 }}>
          <svg width="20" height="20" viewBox="0 0 814 1000" fill="white"><path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.3-150.3-96.8C82.6 727.2 10 625 10 525.4c0-190.5 126.4-291.5 250.8-291.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"/></svg>
          Continuar com Apple
          <span style={{ fontSize: 10, background: "rgba(255,255,255,0.1)", padding: "2px 7px", borderRadius: 20 }}>em breve</span>
        </button>

        {/* Explorar sem conta */}
        <button onClick={onGuest} style={{ marginTop: 8, padding: "12px 20px", background: "transparent", border: "1px solid #222", borderRadius: 14, cursor: "pointer", fontSize: 14, fontWeight: 600, color: "#666", transition: "color 0.2s, border-color 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#aaa"; e.currentTarget.style.borderColor = "#444"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "#666"; e.currentTarget.style.borderColor = "#222"; }}
        >
          Explorar sem conta →
        </button>
      </div>

      <p style={{ position: "absolute", bottom: 32, fontSize: 11, color: "#333", textAlign: "center" }}>
        Ao entrar você concorda com os Termos de Uso
      </p>
    </div>
  );
}

// ============================================================
// AVATAR
// ============================================================
function Avatar({ initials, color }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: "50%", background: color + "22", color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, border: `1.5px solid ${color}44` }}>{initials}</div>
  );
}

// ============================================================
// CROWDBAR
// ============================================================
function CrowdBar({ value }) {
  const color = crowdColor(value);
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#888", fontFamily: "monospace" }}>CHEIO</span>
        <span style={{ fontSize: 11, fontWeight: 700, color }}>{crowdEmoji(value)} {value}%</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: "#1e1e1e", overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}99, ${color})`, transition: "width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ============================================================
// PLACE CARD (com favorito)
// ============================================================
function PlaceCard({ place, onClick, isFav, onToggleFav }) {
  const [animating, setAnimating] = useState(false);

  const handleFav = (e) => {
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    onToggleFav(place);
  };

  return (
    <div onClick={() => onClick(place)} style={{ background: "#111", border: "1px solid #222", borderRadius: 16, padding: 16, cursor: "pointer", transition: "transform 0.15s, border-color 0.15s", position: "relative", overflow: "hidden" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = place.color + "88"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#222"; }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, background: `radial-gradient(circle at top right, ${place.color}18, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: place.color + "22", color: place.color, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>{place.type === "bar" ? "Bar" : place.type === "club" ? "Balada" : place.type === "restaurant" ? "Restaurante" : place.type}</span>
            <span style={{ fontSize: 11, color: "#555" }}>{place.distance}</span>
          </div>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#f0f0f0" }}>{place.name}</h3>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
          <button onClick={handleFav} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, transform: animating ? "scale(1.4)" : "scale(1)", transition: "transform 0.2s", padding: 0, lineHeight: 1 }}>
            {isFav ? "❤️" : "🤍"}
          </button>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f0f0f0" }}>⭐ {place.rating}</div>
            <div style={{ fontSize: 11, color: "#555" }}>{place.checkins} aqui</div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {(place.tags || []).map(t => (<span key={t} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "#1a1a1a", color: "#888", border: "1px solid #2a2a2a" }}>{t}</span>))}
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

      {(place.reports || [])[0] && (
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

// ============================================================
// PLACE DETAIL
// ============================================================
function PlaceDetail({ place, onClose }) {
  const [newReport, setNewReport] = useState("");
  const [newMood, setNewMood] = useState("🔥");
  const [reports, setReports] = useState(place.reports || []);
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!newReport.trim()) return;
    setReports([{ user: "Você", avatar: "VC", time: "agora", msg: newReport, mood: newMood }, ...reports]);
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
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: place.color + "22", color: place.color, textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>{place.type === "bar" ? "Bar" : place.type === "club" ? "Balada" : place.type === "restaurant" ? "Restaurante" : place.type}</span>
              <h2 style={{ margin: "6px 0 2px", fontSize: 22, fontWeight: 800, color: "#f5f5f5" }}>{place.name}</h2>
              <div style={{ color: "#555", fontSize: 12 }}>📍 {place.address}</div>
              <div style={{ color: "#666", fontSize: 13, marginTop: 2 }}>{place.distance} · ⭐ {place.rating} · {place.checkins} check-ins</div>
            </div>
            <button onClick={onClose} style={{ background: "#1a1a1a", border: "none", color: "#888", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
        </div>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1a1a" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[{ label: "CHEIO", val: crowdLabel(place.crowd), sub: `${place.crowd}%`, color: crowdColor(place.crowd) }, { label: "MÚSICA", val: place.music, sub: "ao vivo", color: "#A78BFA" }, { label: "ENTRADA", val: place.cover, sub: "cover", color: "#F59E0B" }].map(item => (
              <div key={item.label} style={{ background: "#111", borderRadius: 12, padding: "10px 12px", border: `1px solid ${item.color}22` }}>
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
            <h4 style={{ margin: 0, fontSize: 13, color: "#888", fontFamily: "monospace", letterSpacing: "0.08em" }}>ATUALIZAÇÕES · {reports.length}</h4>
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
          <h4 style={{ margin: "0 0 10px", fontSize: 13, color: "#888", fontFamily: "monospace", letterSpacing: "0.08em" }}>TÁ LÁ? MANDA O VYBE</h4>
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

// ============================================================
// PREFERENCES MODAL
// ============================================================
function PreferencesModal({ onClose, onApply }) {
  const [vibePrefs, setVibePrefs] = useState([]);
  const [typePrefs, setTypePrefs] = useState([]);
  const [maxCrowd, setMaxCrowd] = useState(100);
  const toggle = (arr, setArr, val) => setArr(arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 600, display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#0d0d0d", borderRadius: 20, border: "1px solid #222", padding: 24, width: "100%", maxWidth: 400 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: "#f5f5f5" }}>Seu Vybe</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#666", fontSize: 18, cursor: "pointer" }}>✕</button>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 10, fontFamily: "monospace" }}>CLIMA</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {VIBES.slice(1).map(v => (<button key={v} onClick={() => toggle(vibePrefs, setVibePrefs, v)} style={{ padding: "6px 14px", borderRadius: 20, background: vibePrefs.includes(v) ? "#A78BFA22" : "#111", color: vibePrefs.includes(v) ? "#A78BFA" : "#666", border: vibePrefs.includes(v) ? "1px solid #A78BFA55" : "1px solid #222", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>{v}</button>))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 10, fontFamily: "monospace" }}>TIPO DE LUGAR</div>
          <div style={{ display: "flex", gap: 8 }}>
            {TYPES.slice(1).map(t => (<button key={t} onClick={() => toggle(typePrefs, setTypePrefs, t)} style={{ padding: "6px 14px", borderRadius: 20, background: typePrefs.includes(t) ? "#34D39922" : "#111", color: typePrefs.includes(t) ? "#34D399" : "#666", border: typePrefs.includes(t) ? "1px solid #34D39955" : "1px solid #222", cursor: "pointer", fontSize: 13, fontWeight: 600, textTransform: "capitalize" }}>{t === "bar" ? "Bar" : t === "club" ? "Balada" : t === "restaurant" ? "Restaurante" : t}</button>))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "#555", fontFamily: "monospace" }}>MAX CROWD</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: crowdColor(maxCrowd) }}>{crowdEmoji(maxCrowd)} {maxCrowd}%</span>
          </div>
          <input type="range" min={20} max={100} step={5} value={maxCrowd} onChange={e => setMaxCrowd(+e.target.value)} style={{ width: "100%", accentColor: crowdColor(maxCrowd) }} />
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#444", marginTop: 2 }}><span>Tranquilo</span><span>Moderado</span><span>Qualquer</span></div>
        </div>
        <button onClick={() => { onApply({ vibePrefs, typePrefs, maxCrowd }); onClose(); }} style={{ width: "100%", padding: 14, background: "#A78BFA", border: "none", borderRadius: 12, color: "#000", fontSize: 15, fontWeight: 800, cursor: "pointer" }}>Aplicar ✓</button>
      </div>
    </div>
  );
}

// ============================================================
// EVENT CARD (com favorito)
// ============================================================
function EventCard({ event, onClick, isFav, onToggleFav }) {
  const [animating, setAnimating] = useState(false);

  const handleFav = (e) => {
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 400);
    onToggleFav(event);
  };

  return (
    <div onClick={() => onClick(event)} style={{ background: "#111", border: "1px solid #222", borderRadius: 20, overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, border-color 0.15s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.borderColor = event.color + "88"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.borderColor = "#222"; }}
    >
      <div style={{ background: event.gradient, padding: "24px 20px 16px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, fontSize: 80, opacity: 0.15, transform: "rotate(-10deg)" }}>{event.emoji}</div>
        {/* Botão favorito no banner */}
        <button onClick={handleFav} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.3)", border: "none", borderRadius: "50%", width: 32, height: 32, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", transform: animating ? "scale(1.4)" : "scale(1)", transition: "transform 0.2s" }}>
          {isFav ? "❤️" : "🤍"}
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(0,0,0,0.3)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>{event.type}</span>
            <h3 style={{ margin: "8px 0 4px", fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1.2 }}>{event.name}</h3>
          </div>
          <div style={{ fontSize: 32, marginRight: 40 }}>{event.emoji}</div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>📅 {event.date}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>🕐 {event.time}</span>
        </div>
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>📍 {event.location}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {(event.lineup || []).map(a => (<span key={a} style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, background: event.color + "22", color: event.color, border: `1px solid ${event.color}44`, fontWeight: 600 }}>{a}</span>))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <div style={{ background: event.color, color: "#000", fontSize: 12, fontWeight: 800, padding: "6px 16px", borderRadius: 20 }}>
            A partir de {(event.tickets || []).find(t => t.available)?.price || "Consultar"}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EVENT DETAIL
// ============================================================
function EventDetail({ event, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 500, display: "flex", alignItems: "flex-end", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, margin: "0 auto", background: "#0d0d0d", borderRadius: "24px 24px 0 0", border: `1px solid ${event.color}44`, maxHeight: "92vh", overflowY: "auto", padding: "0 0 40px" }}>
        <div style={{ height: 4, width: 40, background: "#333", borderRadius: 2, margin: "14px auto 0" }} />
        <div style={{ background: event.gradient, padding: "20px 20px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -30, right: -30, fontSize: 120, opacity: 0.1 }}>{event.emoji}</div>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.3)", border: "none", color: "#fff", width: 32, height: 32, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(0,0,0,0.3)", color: "#fff", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "monospace" }}>{event.type}</span>
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
            {(event.lineup || []).map((a, i) => (
              <div key={a} style={{ display: "flex", alignItems: "center", gap: 12, background: "#111", borderRadius: 12, padding: "10px 14px", border: `1px solid ${event.color}22` }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: event.color + "22", color: event.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800 }}>{i + 1}</div>
                <span style={{ fontSize: 14, color: "#ddd", fontWeight: 600 }}>{a}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: 11, color: "#555", fontFamily: "monospace", letterSpacing: "0.08em" }}>🎟 INGRESSOS</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
            {(event.tickets || []).map(t => (
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

// ============================================================
// MAP VIEW
// ============================================================
function MapView({ mapPlaces, loadingPlaces, onBoundsChange, onSelectPlace, isActive }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef([]);
  const debounceRef = useRef(null);

  const clearMarkers = () => { markersRef.current.forEach(m => m.remove()); markersRef.current = []; };

  const renderMarkers = useCallback(() => {
    if (!leafletMapRef.current || !window.L) return;
    const L = window.L;
    clearMarkers();
    mapPlaces.forEach(place => {
      if (!place.lat || !place.lng) return;
      const hue = place.color || "#A78BFA";
      const typeEmoji = place.type === "bar" ? "🍺" : place.type === "club" ? "🎵" : "🍽️";
      const icon = L.divIcon({
        html: `<div style="
          display:flex;
          flex-direction:column;
          align-items:center;
          cursor:pointer;
        ">
          <div style="
            width:38px;
            height:38px;
            background:${hue};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            display:flex;
            align-items:center;
            justify-content:center;
            box-shadow:0 3px 14px ${hue}99;
            border:2px solid rgba(255,255,255,0.3);
          ">
            <span style="transform:rotate(45deg);font-size:16px;line-height:1">${typeEmoji}</span>
          </div>
          <div style="
            width:6px;
            height:6px;
            background:${hue};
            border-radius:50%;
            margin-top:1px;
            opacity:0.5;
          "></div>
        </div>`,
        className: "",
        iconSize: [38, 48],
        iconAnchor: [19, 48],
      });
      const marker = L.marker([place.lat, place.lng], { icon }).addTo(leafletMapRef.current).on("click", () => onSelectPlace(place));
      markersRef.current.push(marker);
    });
  }, [mapPlaces, onSelectPlace]);

  const getCurrentBounds = useCallback(() => {
    if (!leafletMapRef.current) return null;
    const bounds = leafletMapRef.current.getBounds();
    return { latMin: bounds.getSouth(), latMax: bounds.getNorth(), lngMin: bounds.getWest(), lngMax: bounds.getEast() };
  }, []);

  const handleMapMoveEnd = useCallback(() => {
    const bounds = getCurrentBounds();
    if (!bounds) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { onBoundsChange(bounds); }, 650);
  }, [getCurrentBounds, onBoundsChange]);

  useEffect(() => { renderMarkers(); }, [renderMarkers]);

  useEffect(() => {
    if (!isActive) {
      if (leafletMapRef.current) { clearMarkers(); leafletMapRef.current.remove(); leafletMapRef.current = null; }
      return;
    }
    if (leafletMapRef.current) return;
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link"); link.id = "leaflet-css"; link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"; document.head.appendChild(link);
    }
    const initMap = () => {
      if (!window.L || !mapRef.current) return;
      if (mapRef.current._leaflet_id) return;
      const L = window.L;
      const map = L.map(mapRef.current, { center: [-23.1891, -45.8841], zoom: 14, zoomControl: false });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", { attribution: "© OpenStreetMap © CARTO", subdomains: "abcd", maxZoom: 19 }).addTo(map);
      L.control.zoom({ position: "bottomright" }).addTo(map);
      const userIcon = L.divIcon({ html: `<div style="width:16px;height:16px;background:#60A5FA;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(96,165,250,0.3)"></div>`, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
      L.marker([-23.1860, -45.8870], { icon: userIcon }).addTo(map).bindPopup("<b>Você está aqui</b>");
      map.on("moveend zoomend", handleMapMoveEnd);
      leafletMapRef.current = map;
      setTimeout(() => { map.invalidateSize(); const bounds = getCurrentBounds(); if (bounds) onBoundsChange(bounds); }, 150);
    };
    if (window.L) { initMap(); } else {
      const script = document.createElement("script"); script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"; script.onload = initMap; document.head.appendChild(script);
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (leafletMapRef.current) { leafletMapRef.current.off("moveend zoomend", handleMapMoveEnd); clearMarkers(); leafletMapRef.current.remove(); leafletMapRef.current = null; }
    };
  }, [isActive, handleMapMoveEnd, getCurrentBounds, onBoundsChange]);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", zIndex: 1 }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%", borderRadius: 0 }} />
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, background: "rgba(10,10,10,0.88)", borderRadius: 18, border: "1px solid #222", padding: "7px 12px", fontSize: 12, color: "#ddd", whiteSpace: "nowrap", backdropFilter: "blur(8px)", fontWeight: 700 }}>
        {loadingPlaces ? "buscando rolês..." : `${mapPlaces.length} nesta área`}
      </div>
      <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", zIndex: 10, background: "rgba(10,10,10,0.85)", borderRadius: 20, border: "1px solid #222", padding: "6px 14px", fontSize: 12, color: "#777", whiteSpace: "nowrap", backdropFilter: "blur(8px)" }}>
        Arraste o mapa para descobrir lugares
      </div>
    </div>
  );
}


// ============================================================
// TELA DE PERFIL
// ============================================================
function ProfileScreen({ user, onClose, favPlaces, favEvents, onLogout }) {
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário";
  const email = user?.email || "";
  const avatar = user?.user_metadata?.avatar_url;

  return (
    <div style={{ position: "fixed", inset: 0, background: "#080808", zIndex: 700, display: "flex", flexDirection: "column", fontFamily: "system-ui, -apple-system, sans-serif", overflowY: "auto" }}>
      
      {/* Header com gradiente */}
      <div style={{ background: "linear-gradient(135deg, #A78BFA, #F472B6)", padding: "60px 20px 70px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 20, right: 20, background: "rgba(0,0,0,0.3)", border: "none", color: "#fff", width: 36, height: 36, borderRadius: "50%", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Avatar */}
          <div style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "3px solid #fff", marginBottom: 12 }}>
            {avatar ? (
              <img src={avatar} alt="perfil" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none">
                  <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.9)"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" fill="rgba(255,255,255,0.9)"/>
                </svg>
              </div>
            )}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{email}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, padding: "20px 20px 0", marginTop: -30 }}>
        <div style={{ background: "#111", borderRadius: 16, padding: "16px", border: "1px solid #222", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#A78BFA", marginBottom: 4 }}>{favPlaces.length}</div>
          <div style={{ fontSize: 12, color: "#666" }}>Lugares salvos</div>
        </div>
        <div style={{ background: "#111", borderRadius: 16, padding: "16px", border: "1px solid #222", textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#F472B6", marginBottom: 4 }}>{favEvents.length}</div>
          <div style={{ fontSize: 12, color: "#666" }}>Festas salvas</div>
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding: "20px 20px 100px", display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 4 }}>MINHA CONTA</div>

        <div style={{ background: "#111", borderRadius: 14, border: "1px solid #222", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderBottom: "1px solid #1a1a1a" }}>
            <span style={{ fontSize: 20 }}>❤️</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>Lugares salvos</div>
              <div style={{ fontSize: 11, color: "#555" }}>{favPlaces.length} lugares</div>
            </div>
            <span style={{ fontSize: 16, color: "#444" }}>›</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
            <span style={{ fontSize: 20 }}>🎉</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#f0f0f0" }}>Festas salvas</div>
              <div style={{ fontSize: 11, color: "#555" }}>{favEvents.length} festas</div>
            </div>
            <span style={{ fontSize: 16, color: "#444" }}>›</span>
          </div>
        </div>

        <div style={{ fontSize: 11, color: "#444", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 4, marginTop: 8 }}>EM BREVE</div>
        <div style={{ background: "#111", borderRadius: 14, border: "1px solid #1a1a1a", overflow: "hidden", opacity: 0.5 }}>
          {[
            { icon: "🏆", title: "Badges e conquistas", sub: "Desbloqueie recompensas" },
            { icon: "👥", title: "Amigos", sub: "Veja onde seus amigos estão" },
            { icon: "📍", title: "Histórico de visitas", sub: "Lugares que você foi" },
          ].map((item, i) => (
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

        {/* Logout */}
        <button onClick={onLogout} style={{ marginTop: 8, padding: 16, background: "#1a0a0a", border: "1px solid #EF444433", borderRadius: 14, color: "#EF4444", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          🚪 Sair da conta
        </button>

        <div style={{ textAlign: "center", fontSize: 11, color: "#333", marginTop: 8 }}>vybe. v1.0 · São José dos Campos</div>
      </div>
    </div>
  );
}

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function App() {
  const [user, setUser] = useState(undefined); // undefined = carregando, null = sem login
  const [guest, setGuest] = useState(false);
  const [showProfile, setShowProfile] = useState(false); // true = explorar sem conta
  const [showProfile, setShowProfile] = useState(false);
  const [tab, setTab] = useState("discover");
  const [selected, setSelected] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState(null);
  const [filterVibe, setFilterVibe] = useState("");
  const [filterType, setFilterType] = useState("Todos");
  const [filterEventType, setFilterEventType] = useState("Todos");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState(EVENTS);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [mapPlaces, setMapPlaces] = useState(PLACES);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setGuest(false);
    setShowProfile(false);
    setFavPlaces([]);
    setFavEvents([]);
  };

  // Favoritos
  const [favPlaces, setFavPlaces] = useState([]);
  const [favEvents, setFavEvents] = useState([]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setGuest(false);
    setShowProfile(false);
    setFavPlaces([]);
    setFavEvents([]);
  };

  const toggleFavPlace = (place) => {
    setFavPlaces(prev => prev.some(p => p.id === place.id) ? prev.filter(p => p.id !== place.id) : [...prev, place]);
  };
  const toggleFavEvent = (event) => {
    setFavEvents(prev => prev.some(e => e.id === event.id) ? prev.filter(e => e.id !== event.id) : [...prev, event]);
  };

  // Checar sessão do usuário
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Buscar eventos
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      if (error || !data || data.length === 0) { setEvents(EVENTS); } else {
        setEvents(data.map(e => ({ id: e.id, name: e.name, type: e.type, date: e.date, time: e.time, location: e.location, address: e.address, description: e.description, lineup: e.lineup || [], color: e.color || "#A78BFA", gradient: e.gradient || `linear-gradient(135deg, ${e.color || "#A78BFA"}, #60A5FA)`, emoji: e.emoji || "🎉", tickets: e.tickets || [], ticketLink: e.ticket_link || "#" })));
      }
      setLoadingEvents(false);
    };
    fetchEvents();
  }, []);

  const filterLocalPlacesByBounds = useCallback((bounds) => {
    return PLACES.filter(p => p.lat >= bounds.latMin && p.lat <= bounds.latMax && p.lng >= bounds.lngMin && p.lng <= bounds.lngMax);
  }, []);

  const fetchPlacesInBounds = useCallback(async (bounds) => {
    setLoadingPlaces(true);
    const localResults = filterLocalPlacesByBounds(bounds);
    setMapPlaces(localResults.length > 0 ? localResults : PLACES);
    setLoadingPlaces(false);
  }, [filterLocalPlacesByBounds]);

  const filteredMapPlaces = mapPlaces.filter(p => {
    if (filterVibe !== "" && p.vibe !== filterVibe) return false;
    if (filterType !== "Todos" && p.type !== filterType) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.tags || []).some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (prefs) {
      if (prefs.vibePrefs.length && !prefs.vibePrefs.includes(p.vibe)) return false;
      if (prefs.typePrefs.length && !prefs.typePrefs.includes(p.type)) return false;
      if (p.crowd > prefs.maxCrowd) return false;
    }
    return true;
  });

  const filteredEvents = events.filter(e => filterEventType === "Todos" || e.type === filterEventType);

  // Carregando sessão
  if (user === undefined) {
    return (
      <div style={{ height: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui" }}>
        <div style={{ fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg, #A78BFA, #F472B6, #FF6B6B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>vybe.</div>
      </div>
    );
  }

  // Tela de login — user===null E não é guest
  if (user === null && !guest) {
    return <LoginScreen onLogin={() => setUser(null)} onGuest={() => setGuest(true)} />;
  }

  return (
    <div style={{ height: "100vh", background: "#080808", color: "#f5f5f5", maxWidth: 480, margin: "0 auto", position: "relative", fontFamily: "system-ui, -apple-system, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* HEADER DISCOVER */}
      {tab === "discover" && (
        <div style={{ background: "linear-gradient(180deg, #080808 90%, transparent)", padding: "20px 20px 10px", flexShrink: 0, position: "relative", zIndex: 3 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, background: "linear-gradient(90deg, #A78BFA, #F472B6, #FF6B6B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>vybe.</h1>
              <div style={{ fontSize: 11, color: "#444", marginTop: 1 }}>📍 Explore pelo mapa</div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <button onClick={() => setShowProfile(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                {user && (user.user_metadata?.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="perfil" style={{ width: 36, height: 36, borderRadius: "50%", border: "2px solid #A78BFA55", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #A78BFA, #F472B6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#fff" }}>
                    {(user.user_metadata?.full_name || user.email || "?")[0].toUpperCase()}
                  </div>
                ))}
              </button>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 buscar bares, festas, música, tags..." style={{ width: "100%", background: "#111", border: "1px solid #222", borderRadius: 12, padding: "10px 14px", color: "#ddd", fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}>
            {TYPES.map(t => (<button key={t} onClick={() => setFilterType(t)} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 20, background: filterType === t ? "#f5f5f5" : "#111", color: filterType === t ? "#080808" : "#666", border: filterType === t ? "none" : "1px solid #222", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>))}
            <div style={{ width: 1, background: "#222", margin: "0 4px", flexShrink: 0 }} />
            {VIBES.map(v => (<button key={v} onClick={() => setFilterVibe(filterVibe === v ? "" : v)} style={{ flexShrink: 0, padding: "5px 12px", borderRadius: 20, background: filterVibe === v ? "#A78BFA22" : "transparent", color: filterVibe === v ? "#A78BFA" : "#555", border: filterVibe === v ? "1px solid #A78BFA44" : "1px solid #1a1a1a", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{v}</button>))}
          </div>
        </div>
      )}

      <div style={{ flex: 1, overflow: tab === "discover" ? "hidden" : "auto", position: "relative", display: "flex", flexDirection: "column" }}>

        {/* DISCOVER */}
        {tab === "discover" && (
          <>
            <div style={{ height: "42vh", minHeight: 300, width: "100%", position: "relative", flexShrink: 0, borderTop: "1px solid #111", borderBottom: "1px solid #111" }}>
              <MapView mapPlaces={filteredMapPlaces} loadingPlaces={loadingPlaces} onBoundsChange={fetchPlacesInBounds} onSelectPlace={setSelected} isActive={tab === "discover"} />
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px 100px", background: "#080808" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "0 4px" }}>
                <span style={{ fontSize: 13, color: "#aaa", fontWeight: 700 }}>{loadingPlaces ? "Buscando rolês..." : `${filteredMapPlaces.length} lugares nesta área`}</span>
                <div style={{ flex: 1, height: 1, background: "#1a1a1a" }} />
                <span style={{ fontSize: 11, color: "#444", fontFamily: "monospace" }}>{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
              {filteredMapPlaces.length === 0 && !loadingPlaces && (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#555" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🗺️</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Nenhum lugar nessa área</div>
                  <div style={{ fontSize: 13, marginTop: 6 }}>Arraste o mapa ou ajuste os filtros.</div>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredMapPlaces.map(place => (<PlaceCard key={place.id} place={place} onClick={setSelected} isFav={favPlaces.some(p => p.id === place.id)} onToggleFav={toggleFavPlace} />))}
              </div>
            </div>
          </>
        )}

        {/* FESTAS */}
        {tab === "festas" && (
          <div style={{ padding: "0 16px 100px", flex: 1, boxSizing: "border-box" }}>
            <div style={{ padding: "20px 0 12px" }}>
              <h2 style={{ margin: "0 0 2px", fontSize: 24, fontWeight: 800, color: "#f5f5f5" }}>Festas & Shows 🎉</h2>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#555" }}>Eventos próximos em São José dos Campos</p>
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none" }}>
                {EVENT_TYPES.map(t => (<button key={t} onClick={() => setFilterEventType(t)} style={{ flexShrink: 0, padding: "5px 14px", borderRadius: 20, background: filterEventType === t ? "#f5f5f5" : "#111", color: filterEventType === t ? "#080808" : "#666", border: filterEventType === t ? "none" : "1px solid #222", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t}</button>))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {loadingEvents ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}><div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div><div style={{ fontSize: 16, fontWeight: 600 }}>Carregando eventos...</div></div>
              ) : filteredEvents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#555" }}><div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div><div style={{ fontSize: 16, fontWeight: 600 }}>Nenhum evento nessa categoria</div></div>
              ) : (
                filteredEvents.map(event => (<EventCard key={event.id} event={event} onClick={setSelectedEvent} isFav={favEvents.some(e => e.id === event.id)} onToggleFav={toggleFavEvent} />))
              )}
            </div>
          </div>
        )}

        {/* AO VIVO */}
        {tab === "live" && (
          <div style={{ padding: "20px 16px 100px", flex: 1, boxSizing: "border-box", minHeight: "100vh" }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 22, fontWeight: 800, color: "#f5f5f5" }}>Ao Vivo 🔴</h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#555" }}>Updates em tempo real de quem está lá agora</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {PLACES.flatMap(p => (p.reports || []).map(r => ({ ...r, place: p }))).map((r, i) => (
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

        {/* SALVOS */}
        {tab === "saved" && (
          <div style={{ padding: "20px 16px 100px", flex: 1, boxSizing: "border-box", minHeight: "100vh" }}>
            <h2 style={{ margin: "0 0 20px", fontSize: 24, fontWeight: 800, color: "#f5f5f5" }}>Salvos ❤️</h2>

            {/* Lugares salvos */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#666", fontFamily: "monospace", letterSpacing: "0.08em" }}>LUGARES SALVOS · {favPlaces.length}</h3>
              {favPlaces.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px", background: "#111", borderRadius: 16, border: "1px solid #1a1a1a" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🤍</div>
                  <div style={{ fontSize: 14, color: "#555" }}>Nenhum lugar salvo ainda</div>
                  <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>Toca o ♡ nos cards para salvar</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {favPlaces.map(place => (<PlaceCard key={place.id} place={place} onClick={setSelected} isFav={true} onToggleFav={toggleFavPlace} />))}
                </div>
              )}
            </div>

            {/* Festas salvas */}
            <div>
              <h3 style={{ margin: "0 0 12px", fontSize: 14, color: "#666", fontFamily: "monospace", letterSpacing: "0.08em" }}>FESTAS SALVAS · {favEvents.length}</h3>
              {favEvents.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px", background: "#111", borderRadius: 16, border: "1px solid #1a1a1a" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🤍</div>
                  <div style={{ fontSize: 14, color: "#555" }}>Nenhuma festa salva ainda</div>
                  <div style={{ fontSize: 12, color: "#444", marginTop: 4 }}>Toca o ♡ nos cards de festas</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {favEvents.map(event => (<EventCard key={event.id} event={event} onClick={setSelectedEvent} isFav={true} onToggleFav={toggleFavEvent} />))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BARRA DE NAVEGAÇÃO */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(0deg, #080808 60%, transparent)", padding: "16px 20px 24px", zIndex: 400 }}>
        <div style={{ display: "flex", background: "#111", border: "1px solid #1e1e1e", borderRadius: 16, padding: 4, gap: 4 }}>
          {[
            { id: "discover", icon: "🗺", label: "Explorar" },
            { id: "festas", icon: "🎉", label: "Festas" },
            { id: "live", icon: "🔴", label: "Ao Vivo" },
            { id: "saved", icon: "❤️", label: "Salvos" }
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: "8px 0", background: tab === t.id ? "#1e1e1e" : "transparent", border: "none", borderRadius: 12, cursor: "pointer", color: tab === t.id ? "#f5f5f5" : "#555", fontSize: 11, fontWeight: 600, position: "relative", zIndex: 400 }}>
              <div style={{ fontSize: 16, marginBottom: 1 }}>{t.icon}</div>
              {t.label}

            </button>
          ))}
        </div>
      </div>

      {selected && <PlaceDetail place={selected} onClose={() => setSelected(null)} />}
      {showProfile && <ProfileScreen user={user} onClose={() => setShowProfile(false)} favPlaces={favPlaces} favEvents={favEvents} onLogout={handleLogout} />}
      {selectedEvent && <EventDetail event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {showPrefs && <PreferencesModal onClose={() => setShowPrefs(false)} onApply={setPrefs} />}
      {showProfile && user && <ProfileScreen user={user} favPlaces={favPlaces} favEvents={favEvents} onClose={() => setShowProfile(false)} onLogout={handleLogout} />}
    </div>
  );
}