import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { geocodeAddress } from "./admin";

// ─── ESTILOS COMPARTILHADOS ──────────────────────────────────────────────
const overlayStyle = {
  position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 9999,
  overflowY: "auto", color: "#f5f5f5", fontFamily: "system-ui, -apple-system, sans-serif",
};
const containerStyle = { maxWidth: 600, margin: "0 auto", padding: "20px 16px 80px" };
const headerStyle = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: "16px 0 24px", borderBottom: "1px solid #222", marginBottom: 24,
};
const tabBtn = (active) => ({
  flex: 1, padding: "12px", background: active ? "#1e1e1e" : "transparent",
  border: "1px solid #222", borderRadius: 12, color: active ? "#f5f5f5" : "#666",
  cursor: "pointer", fontSize: 14, fontWeight: 600,
});
const inputStyle = {
  width: "100%", padding: "12px 14px", background: "#1a1a1a", border: "1px solid #2a2a2a",
  borderRadius: 10, color: "#f5f5f5", fontSize: 14, marginBottom: 12, boxSizing: "border-box",
  fontFamily: "inherit",
};
const labelStyle = { display: "block", fontSize: 12, color: "#888", marginBottom: 6, marginTop: 8 };
const primaryBtn = {
  width: "100%", padding: "14px", background: "#A78BFA", border: "none",
  borderRadius: 10, color: "#0a0a0a", fontWeight: 700, fontSize: 15, cursor: "pointer",
  marginTop: 16,
};
const dangerBtn = {
  padding: "8px 12px", background: "#3a1010", border: "1px solid #5a1818",
  borderRadius: 8, color: "#ff6b6b", cursor: "pointer", fontSize: 13,
};
const listItem = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  padding: 12, background: "#141414", border: "1px solid #222", borderRadius: 10,
  marginBottom: 8,
};
const sectionTitle = { fontSize: 16, fontWeight: 700, margin: "24px 0 12px", color: "#ddd" };

// ─── FORMULÁRIO DE LUGAR ─────────────────────────────────────────────────
function PlaceForm({ onSaved }) {
  const [form, setForm] = useState({
    name: "", type: "bar", address: "", tags: "", music: "",
    cover: "Grátis", color: "#A78BFA", image_url: "",
  });
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleGeocode = async () => {
    if (!form.address) {
      setMsg({ type: "err", text: "Digite o endereço primeiro" });
      return;
    }
    setGeocoding(true);
    setMsg(null);
    try {
      const result = await geocodeAddress(form.address);
      setLat(result.lat);
      setLng(result.lng);
      setMsg({ type: "ok", text: `Localizado: ${result.displayName.slice(0, 60)}...` });
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.address) {
      setMsg({ type: "err", text: "Nome e endereço são obrigatórios" });
      return;
    }
    if (lat == null || lng == null) {
      setMsg({ type: "err", text: "Geocodifique o endereço primeiro (botão Localizar)" });
      return;
    }
    setSaving(true);
    setMsg(null);
    const payload = {
      name: form.name,
      type: form.type,
      address: form.address,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      music: form.music || null,
      cover: form.cover || "Consultar",
      color: form.color,
      image_url: form.image_url || null,
      lat, lng,
      rating: 0, crowd: 0, checkins: 0, reports: [],
    };
    const { error } = await supabase.from("places").insert(payload);
    setSaving(false);
    if (error) {
      setMsg({ type: "err", text: "Erro: " + error.message });
      return;
    }
    setMsg({ type: "ok", text: "✅ Lugar adicionado!" });
    setForm({ name: "", type: "bar", address: "", tags: "", music: "", cover: "Grátis", color: "#A78BFA", image_url: "" });
    setLat(null);
    setLng(null);
    onSaved?.();
  };

  return (
    <div>
      <label style={labelStyle}>Nome *</label>
      <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Bar Coronel" />

      <label style={labelStyle}>Tipo *</label>
      <select style={inputStyle} value={form.type} onChange={(e) => set("type", e.target.value)}>
        <option value="bar">Bar</option>
        <option value="club">Balada</option>
        <option value="restaurant">Restaurante</option>
      </select>

      <label style={labelStyle}>Endereço *</label>
      <input style={inputStyle} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="R. Tal, 123 - Bairro" />
      <button
        type="button"
        onClick={handleGeocode}
        disabled={geocoding}
        style={{ ...inputStyle, background: "#1e1e2e", cursor: "pointer", marginBottom: 4, fontWeight: 600 }}
      >
        {geocoding ? "Buscando..." : "📍 Localizar no mapa"}
      </button>
      {lat && lng && <div style={{ fontSize: 11, color: "#22C55E", marginBottom: 12 }}>✓ {lat.toFixed(5)}, {lng.toFixed(5)}</div>}

      <label style={labelStyle}>Tags (separadas por vírgula)</label>
      <input style={inputStyle} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="petiscos, chopp, tradicional" />

      <label style={labelStyle}>Música</label>
      <input style={inputStyle} value={form.music} onChange={(e) => set("music", e.target.value)} placeholder="Sertanejo / Pagode" />

      <label style={labelStyle}>Cover</label>
      <input style={inputStyle} value={form.cover} onChange={(e) => set("cover", e.target.value)} placeholder="Grátis / R$25" />

      <label style={labelStyle}>Cor (hex)</label>
      <input style={inputStyle} value={form.color} onChange={(e) => set("color", e.target.value)} placeholder="#A78BFA" />

      <label style={labelStyle}>Imagem (URL)</label>
      <input style={inputStyle} value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." />

      {msg && (
        <div style={{ padding: 10, marginTop: 8, borderRadius: 8, fontSize: 13, background: msg.type === "ok" ? "#0a2818" : "#2a1010", color: msg.type === "ok" ? "#22C55E" : "#ff6b6b" }}>
          {msg.text}
        </div>
      )}

      <button onClick={handleSave} disabled={saving} style={primaryBtn}>
        {saving ? "Salvando..." : "Adicionar lugar"}
      </button>
    </div>
  );
}

// ─── FORMULÁRIO DE EVENTO ────────────────────────────────────────────────
function EventForm({ onSaved, initialValues }) {
  const [form, setForm] = useState(() => ({
    name: initialValues?.name || "",
    type: initialValues?.type || "Universitária",
    date: initialValues?.date || "",
    time: initialValues?.time || "",
    location: initialValues?.location || "",
    address: initialValues?.address || "",
    description: initialValues?.description || "",
    lineup: Array.isArray(initialValues?.lineup) ? initialValues.lineup.join(", ") : (initialValues?.lineup || ""),
    color: initialValues?.color || "#A78BFA",
    emoji: initialValues?.emoji || "🎉",
    ticket_link: initialValues?.ticket_link || "",
    image_url: initialValues?.image_url || "",
    price_text: initialValues?.price_text || "",
    is_free: initialValues?.is_free || false,
  }));
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleGeocode = async () => {
    if (!form.address) {
      setMsg({ type: "err", text: "Digite o endereço primeiro" });
      return;
    }
    setGeocoding(true);
    setMsg(null);
    try {
      const result = await geocodeAddress(form.address);
      setLat(result.lat);
      setLng(result.lng);
      setMsg({ type: "ok", text: `Localizado: ${result.displayName.slice(0, 60)}...` });
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setGeocoding(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.date || !form.time || !form.location || !form.address) {
      setMsg({ type: "err", text: "Preencha nome, data, hora, local e endereço" });
      return;
    }
    setSaving(true);
    setMsg(null);

    // Monta starts_at combinando date + time (formato yyyy-mm-ddTHH:mm:ss-03:00)
    let starts_at = null;
    try {
      starts_at = new Date(`${form.date}T${form.time}:00-03:00`).toISOString();
    } catch { /* ignora */ }

    const payload = {
      name: form.name,
      type: form.type,
      date: form.date,
      time: form.time,
      location: form.location,
      address: form.address,
      description: form.description || null,
      lineup: form.lineup ? form.lineup.split(",").map((t) => t.trim()).filter(Boolean) : null,
      color: form.color,
      emoji: form.emoji,
      ticket_link: form.ticket_link || null,
      image_url: form.image_url || null,
      price_text: form.price_text || null,
      is_free: form.is_free,
      starts_at,
      lat, lng,
      venue_name: form.location,
      status: "active",
      source: "manual",
    };
    const { error } = await supabase.from("events").insert(payload);
    setSaving(false);
    if (error) {
      setMsg({ type: "err", text: "Erro: " + error.message });
      return;
    }
    setMsg({ type: "ok", text: "✅ Evento adicionado!" });
    setForm({
      name: "", type: "Universitária", date: "", time: "", location: "", address: "",
      description: "", lineup: "", color: "#A78BFA", emoji: "🎉",
      ticket_link: "", image_url: "", price_text: "", is_free: false,
    });
    setLat(null);
    setLng(null);
    onSaved?.();
  };

  return (
    <div>
      <label style={labelStyle}>Nome *</label>
      <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex: Festa de Calouros" />

      <label style={labelStyle}>Tipo *</label>
      <select style={inputStyle} value={form.type} onChange={(e) => set("type", e.target.value)}>
        <option>Universitária</option>
        <option>Eletrônico</option>
        <option>Funk</option>
        <option>Rock</option>
        <option>Outros</option>
      </select>

      <label style={labelStyle}>Data *</label>
      <input type="date" style={inputStyle} value={form.date} onChange={(e) => set("date", e.target.value)} />

      <label style={labelStyle}>Hora *</label>
      <input type="time" style={inputStyle} value={form.time} onChange={(e) => set("time", e.target.value)} />

      <label style={labelStyle}>Local (nome) *</label>
      <input style={inputStyle} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Honey Club" />

      <label style={labelStyle}>Endereço *</label>
      <input style={inputStyle} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Av. Tal, 100" />
      <button
        type="button"
        onClick={handleGeocode}
        disabled={geocoding}
        style={{ ...inputStyle, background: "#1e1e2e", cursor: "pointer", marginBottom: 4, fontWeight: 600 }}
      >
        {geocoding ? "Buscando..." : "📍 Localizar no mapa"}
      </button>
      {lat && lng && <div style={{ fontSize: 11, color: "#22C55E", marginBottom: 12 }}>✓ {lat.toFixed(5)}, {lng.toFixed(5)}</div>}

      <label style={labelStyle}>Descrição</label>
      <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description} onChange={(e) => set("description", e.target.value)} />

      <label style={labelStyle}>Line-up (separado por vírgula)</label>
      <input style={inputStyle} value={form.lineup} onChange={(e) => set("lineup", e.target.value)} placeholder="DJ X, MC Y" />

      <label style={labelStyle}>Emoji</label>
      <input style={inputStyle} value={form.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={4} />

      <label style={labelStyle}>Cor (hex)</label>
      <input style={inputStyle} value={form.color} onChange={(e) => set("color", e.target.value)} />

      <label style={labelStyle}>Preço (texto)</label>
      <input style={inputStyle} value={form.price_text} onChange={(e) => set("price_text", e.target.value)} placeholder="R$30 antecipado" />

      <label style={{ ...labelStyle, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <input type="checkbox" checked={form.is_free} onChange={(e) => set("is_free", e.target.checked)} />
        Evento gratuito
      </label>

      <label style={labelStyle}>Link de ingresso</label>
      <input style={inputStyle} value={form.ticket_link} onChange={(e) => set("ticket_link", e.target.value)} placeholder="https://..." />

      <label style={labelStyle}>Imagem (URL)</label>
      <input style={inputStyle} value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="https://..." />

      {msg && (
        <div style={{ padding: 10, marginTop: 8, borderRadius: 8, fontSize: 13, background: msg.type === "ok" ? "#0a2818" : "#2a1010", color: msg.type === "ok" ? "#22C55E" : "#ff6b6b" }}>
          {msg.text}
        </div>
      )}

      <button onClick={handleSave} disabled={saving} style={primaryBtn}>
        {saving ? "Salvando..." : "Adicionar evento"}
      </button>
    </div>
  );
}

// ─── LISTA COM BOTÃO DELETAR ─────────────────────────────────────────────
function ItemList({ table, items, onDeleted, getLabel, getSubtitle }) {
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (id, name) => {
    if (!confirm(`Apagar "${name}"? Isso não pode ser desfeito.`)) return;
    setDeleting(id);
    const { error } = await supabase.from(table).delete().eq("id", id);
    setDeleting(null);
    if (error) {
      alert("Erro ao apagar: " + error.message);
      return;
    }
    onDeleted();
  };

  if (items.length === 0) {
    return <div style={{ color: "#666", fontSize: 13, textAlign: "center", padding: 20 }}>Nenhum item</div>;
  }

  return (
    <div>
      {items.map((it) => (
        <div key={it.id} style={listItem}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {getLabel(it)}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{getSubtitle(it)}</div>
          </div>
          <button
            onClick={() => handleDelete(it.id, getLabel(it))}
            disabled={deleting === it.id}
            style={dangerBtn}
          >
            {deleting === it.id ? "..." : "🗑️"}
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── IMPORTADOR DE LUGARES (Google Places) ───────────────────────────────
function PlacesImporter({ onImported }) {
  // Presets de áreas em SJC
  const PRESETS = [
    { label: "Centro", lat: -23.1825, lng: -45.8859, radius: 1500 },
    { label: "Vila Adyana / Esplanada", lat: -23.1955, lng: -45.8907, radius: 2000 },
    { label: "Jd das Indústrias", lat: -23.2295, lng: -45.8636, radius: 2000 },
    { label: "Urbanova", lat: -23.2127, lng: -45.9522, radius: 2500 },
    { label: "Cidade inteira (10km)", lat: -23.190, lng: -45.885, radius: 10000 },
  ];
  const [lat, setLat] = useState(-23.1825);
  const [lng, setLng] = useState(-45.8859);
  const [radius, setRadius] = useState(1500);
  const [type, setType] = useState("");
  const [withPhotos, setWithPhotos] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleImport = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada");
      const res = await fetch("/api/import-places", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ lat, lng, radius, type: type || undefined, withPhotos }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha");
      const photoTxt = json.photos_downloaded ? ` · ${json.photos_downloaded} fotos baixadas` : "";
      setMsg({
        type: "ok",
        text: `✅ ${json.inserted} novos / ${json.skipped} já existiam (de ${json.total_found} encontrados)${photoTxt}`,
      });
      onImported?.();
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 14, background: "#0f0f1a", border: "1px solid #2a1e3e", borderRadius: 12, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA", marginBottom: 8 }}>🗺️ Importar lugares (Google Places)</div>
      <div style={{ fontSize: 11, color: "#777", marginBottom: 10 }}>Busca bares/baladas/restaurantes numa área. Idempotente (não duplica).</div>

      <label style={labelStyle}>Área pré-definida</label>
      <select
        style={inputStyle}
        onChange={(e) => {
          const p = PRESETS[parseInt(e.target.value, 10)];
          if (p) {
            setLat(p.lat);
            setLng(p.lng);
            setRadius(p.radius);
          }
        }}
      >
        {PRESETS.map((p, i) => (
          <option key={p.label} value={i}>{p.label} ({(p.radius / 1000).toFixed(1)}km)</option>
        ))}
      </select>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <div>
          <label style={labelStyle}>Lat</label>
          <input style={inputStyle} type="number" step="0.0001" value={lat} onChange={(e) => setLat(parseFloat(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle}>Lng</label>
          <input style={inputStyle} type="number" step="0.0001" value={lng} onChange={(e) => setLng(parseFloat(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle}>Raio (m)</label>
          <input style={inputStyle} type="number" value={radius} onChange={(e) => setRadius(parseInt(e.target.value, 10))} />
        </div>
      </div>

      <label style={labelStyle}>Tipo (vazio = todos)</label>
      <select style={inputStyle} value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">Todos (bar + club + restaurant)</option>
        <option value="bar">Só bares</option>
        <option value="night_club">Só baladas</option>
        <option value="restaurant">Só restaurantes</option>
      </select>

      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#999", marginBottom: 12, cursor: "pointer" }}>
        <input type="checkbox" checked={withPhotos} onChange={(e) => setWithPhotos(e.target.checked)} />
        Baixar fotos automaticamente (+$0.007 por foto)
      </label>

      <button
        onClick={handleImport}
        disabled={loading}
        style={{ ...primaryBtn, opacity: loading ? 0.5 : 1 }}
      >
        {loading ? (withPhotos ? "Importando + baixando fotos..." : "Buscando no Google...") : "🗺️ Importar agora"}
      </button>

      {msg && (
        <div style={{ padding: 10, marginTop: 8, borderRadius: 8, fontSize: 13, background: msg.type === "ok" ? "#0a2818" : "#2a1010", color: msg.type === "ok" ? "#22C55E" : "#ff6b6b" }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

// ─── IMPORTADOR DE URL ───────────────────────────────────────────────────
function UrlImporter({ onImported }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleImport = async () => {
    if (!url.startsWith("http")) {
      setMsg({ type: "err", text: "URL deve começar com http:// ou https://" });
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }
      const res = await fetch("/api/import-event", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao importar");
      onImported(json.data);
      setMsg({ type: "ok", text: `✅ Importado! Revise os campos abaixo antes de salvar.` });
      setUrl("");
    } catch (e) {
      setMsg({ type: "err", text: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 14, background: "#0f0f1a", border: "1px solid #2a1e3e", borderRadius: 12, marginBottom: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: "#A78BFA", marginBottom: 8 }}>🔗 Importar evento de URL</div>
      <div style={{ fontSize: 11, color: "#777", marginBottom: 10 }}>Cole o link de uma página de evento (Ingressos10, Sympla, etc.)</div>
      <input
        style={inputStyle}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://..."
        disabled={loading}
      />
      <button
        onClick={handleImport}
        disabled={loading || !url}
        style={{ ...primaryBtn, marginTop: 4, opacity: loading || !url ? 0.5 : 1 }}
      >
        {loading ? "Buscando dados..." : "🪄 Importar"}
      </button>
      {msg && (
        <div style={{ padding: 10, marginTop: 8, borderRadius: 8, fontSize: 13, background: msg.type === "ok" ? "#0a2818" : "#2a1010", color: msg.type === "ok" ? "#22C55E" : "#ff6b6b" }}>
          {msg.text}
        </div>
      )}
    </div>
  );
}

// ─── PAINEL PRINCIPAL ────────────────────────────────────────────────────
export default function AdminPanel({ onClose }) {
  const [section, setSection] = useState("places");
  const [places, setPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [importedEvent, setImportedEvent] = useState(null);
  const [eventFormKey, setEventFormKey] = useState(0);

  useEffect(() => {
    supabase.from("places").select("id,name,type,address").order("id", { ascending: false }).then(({ data }) => setPlaces(data || []));
    supabase.from("events").select("id,name,type,date,time,location").order("starts_at", { ascending: false }).then(({ data }) => setEvents(data || []));
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleImported = (data) => {
    setImportedEvent(data);
    setEventFormKey((k) => k + 1); // força remount do form com novos initialValues
  };

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>⚙️ Admin</h2>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "1px solid #333", color: "#f5f5f5", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}
          >
            Fechar
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          <button style={tabBtn(section === "places")} onClick={() => setSection("places")}>📍 Lugares ({places.length})</button>
          <button style={tabBtn(section === "events")} onClick={() => setSection("events")}>🎉 Eventos ({events.length})</button>
        </div>

        {section === "places" && (
          <>
            <PlacesImporter onImported={reload} />
            <div style={sectionTitle}>➕ Adicionar lugar</div>
            <PlaceForm onSaved={reload} />
            <div style={sectionTitle}>📍 Lugares existentes</div>
            <ItemList
              table="places"
              items={places}
              onDeleted={reload}
              getLabel={(p) => p.name}
              getSubtitle={(p) => `${p.type} · ${p.address || "sem endereço"}`}
            />
          </>
        )}

        {section === "events" && (
          <>
            <UrlImporter onImported={handleImported} />
            <div style={sectionTitle}>➕ Adicionar evento</div>
            <EventForm key={eventFormKey} onSaved={() => { reload(); setImportedEvent(null); }} initialValues={importedEvent} />
            <div style={sectionTitle}>🎉 Eventos existentes</div>
            <ItemList
              table="events"
              items={events}
              onDeleted={reload}
              getLabel={(e) => e.name}
              getSubtitle={(e) => `${e.type} · ${e.date} ${e.time} · ${e.location}`}
            />
          </>
        )}
      </div>
    </div>
  );
}
