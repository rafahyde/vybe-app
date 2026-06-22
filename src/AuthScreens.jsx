import { useState } from "react";
import { supabase } from "./supabase";

// ─── CIDADES DISPONÍVEIS ─────────────────────────────────────────────────
const CITIES = [
  "São José dos Campos",
  "São Paulo",
  "Campinas",
  "Taubaté",
  "Jacareí",
  "Caraguatatuba",
  "Ubatuba",
  "Rio de Janeiro",
  "Belo Horizonte",
  "Curitiba",
];

const EVENT_TYPES = ["Universitária", "Eletrônico", "Funk", "Rock"];

// ─── ESTILOS COMPARTILHADOS ──────────────────────────────────────────────
const screenStyle = {
  position: "fixed", inset: 0, background: "#0a0a0a", zIndex: 1000,
  display: "flex", flexDirection: "column", overflowY: "auto",
  fontFamily: "'Inter Tight', -apple-system, system-ui, sans-serif", color: "#f5f5f5",
};
const containerStyle = { maxWidth: 440, width: "100%", margin: "0 auto", padding: "60px 24px 40px" };
const inputStyle = {
  width: "100%", padding: "14px 16px", background: "#141414",
  border: "1px solid #2a2a2a", borderRadius: 12, color: "#f5f5f5",
  fontSize: 15, marginBottom: 12, boxSizing: "border-box", fontFamily: "inherit",
  outline: "none",
};
const labelStyle = { display: "block", fontSize: 13, color: "#999", marginBottom: 8, fontWeight: 500 };
const primaryBtn = {
  width: "100%", padding: "16px", background: "linear-gradient(135deg, #A78BFA, #F472B6)",
  border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: 16,
  cursor: "pointer", marginTop: 16,
};
const secondaryBtn = {
  width: "100%", padding: "14px", background: "transparent",
  border: "1px solid #333", borderRadius: 12, color: "#999",
  fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 8,
};
const chipBtn = (active) => ({
  padding: "10px 18px", borderRadius: 24,
  background: active ? "#A78BFA22" : "#141414",
  border: active ? "1px solid #A78BFA" : "1px solid #2a2a2a",
  color: active ? "#A78BFA" : "#999",
  cursor: "pointer", fontSize: 14, fontWeight: 600,
});
const errBox = {
  padding: 12, marginTop: 12, borderRadius: 10,
  background: "#2a1010", color: "#ff6b6b", fontSize: 13, lineHeight: 1.5,
};

// ─── PROGRESS BAR ────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: 4, borderRadius: 2,
            background: i <= step ? "linear-gradient(90deg, #A78BFA, #F472B6)" : "#222",
            transition: "background 0.3s",
          }}
        />
      ))}
    </div>
  );
}

// ─── TELA DE SIGNUP (com onboarding) ─────────────────────────────────────
export function SignupScreen({ onClose, onSuccess }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [eventTypes, setEventTypes] = useState([]);
  const [city, setCity] = useState("São José dos Campos");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const toggleType = (t) =>
    setEventTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const validateStep = () => {
    setErr(null);
    if (step === 0) {
      if (!name.trim() || name.trim().length < 2) return "Nome muito curto";
      if (!email.includes("@") || email.length < 5) return "Email inválido";
      if (password.length < 6) return "Senha precisa ter no mínimo 6 caracteres";
      if (password !== confirmPassword) return "As senhas não coincidem";
    }
    if (step === 1) {
      const n = parseInt(age, 10);
      if (!n || n < 13 || n > 120) return "Idade inválida";
    }
    if (step === 2) {
      if (eventTypes.length === 0) return "Selecione pelo menos um tipo de rolê";
    }
    if (step === 3) {
      if (!city) return "Selecione uma cidade";
    }
    return null;
  };

  const handleNext = () => {
    const e = validateStep();
    if (e) {
      setErr(e);
      return;
    }
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSignup();
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });
      if (error) throw error;

      const userId = data.user?.id;
      const hasSession = !!data.session;

      // Guarda dados de onboarding pra inserir em profiles após login
      // (necessário quando "Confirm email" está ligado e ainda não há sessão)
      const onboardingData = {
        name,
        email,
        age: parseInt(age, 10),
        city,
        fav_event_types: eventTypes,
      };
      localStorage.setItem("vybe_pending_profile", JSON.stringify(onboardingData));

      if (hasSession && userId) {
        // Tem sessão ativa — pode inserir profile direto
        const { error: profileErr } = await supabase.from("profiles").upsert({
          id: userId,
          ...onboardingData,
        });
        if (profileErr) {
          console.error("Erro ao salvar profile:", profileErr);
          // Não bloqueia o signup — profile será criado no próximo login
        } else {
          localStorage.removeItem("vybe_pending_profile");
        }
        onSuccess?.();
      } else {
        // Sem sessão — email precisa ser confirmado primeiro
        setErr(null);
        alert(`✉️ Conta criada! Enviamos um email de confirmação para ${email}. Verifique sua caixa de entrada (e a pasta de spam) e clique no link antes de fazer login.`);
        onClose?.();
      }
    } catch (e) {
      const msg = traduzErro(e.message);
      setErr(msg);
      console.error("Signup error:", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={screenStyle}>
      <div style={containerStyle}>
        <button
          onClick={step === 0 ? onClose : () => { setErr(null); setStep(step - 1); }}
          style={{ background: "transparent", border: "none", color: "#666", fontSize: 14, cursor: "pointer", marginBottom: 24, padding: 0 }}
        >
          ← Voltar
        </button>

        <ProgressBar step={step} total={4} />

        {step === 0 && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, margin: 0 }}>Criar conta</h1>
            <p style={{ color: "#777", fontSize: 14, marginBottom: 32, marginTop: 8 }}>Vamos começar com seu email</p>

            <label style={labelStyle}>Nome</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos te chamar?" />

            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" />

            <label style={labelStyle}>Senha</label>
            <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />

            <label style={labelStyle}>Confirmar senha</label>
            <input style={inputStyle} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Digite a senha novamente" autoComplete="new-password" />
          </>
        )}

        {step === 1 && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, margin: 0 }}>Qual sua idade?</h1>
            <p style={{ color: "#777", fontSize: 14, marginBottom: 32, marginTop: 8 }}>Pra recomendar rolês adequados pra você</p>

            <input
              style={{ ...inputStyle, fontSize: 32, textAlign: "center", padding: "24px", fontWeight: 700 }}
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="--"
              min="13"
              max="120"
              inputMode="numeric"
            />
          </>
        )}

        {step === 2 && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, margin: 0 }}>Que tipo de rolê você gosta?</h1>
            <p style={{ color: "#777", fontSize: 14, marginBottom: 32, marginTop: 8 }}>Pode escolher mais de um</p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {EVENT_TYPES.map((t) => (
                <button key={t} type="button" onClick={() => toggleType(t)} style={chipBtn(eventTypes.includes(t))}>
                  {t}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, margin: 0 }}>Qual cidade você frequenta?</h1>
            <p style={{ color: "#777", fontSize: 14, marginBottom: 32, marginTop: 8 }}>Mostraremos rolês perto de você</p>

            <select style={inputStyle} value={city} onChange={(e) => setCity(e.target.value)}>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </>
        )}

        {err && <div style={errBox}>{err}</div>}

        <button onClick={handleNext} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Criando conta..." : step === 3 ? "Criar conta ✨" : "Continuar →"}
        </button>
      </div>
    </div>
  );
}

// ─── TELA DE LOGIN COM EMAIL ─────────────────────────────────────────────
export function LoginEmailScreen({ onClose, onSuccess, onForgotPassword }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [resetMsg, setResetMsg] = useState(null);

  const handleLogin = async () => {
    setErr(null);
    setResetMsg(null);
    if (!email.includes("@") || password.length < 6) {
      setErr("Preencha email e senha corretamente");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setErr(traduzErro(error.message));
      return;
    }
    onSuccess?.();
  };

  const handleForgot = async () => {
    setErr(null);
    setResetMsg(null);
    if (!email.includes("@")) {
      setErr("Digite seu email primeiro");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (error) {
      setErr(error.message);
      return;
    }
    setResetMsg("✉️ Enviamos um link de redefinição pro seu email");
  };

  return (
    <div style={screenStyle}>
      <div style={containerStyle}>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "#666", fontSize: 14, cursor: "pointer", marginBottom: 24, padding: 0 }}
        >
          ← Voltar
        </button>

        <h1 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8, margin: 0 }}>Entrar</h1>
        <p style={{ color: "#777", fontSize: 14, marginBottom: 32, marginTop: 8 }}>Bem-vindo de volta ao vybe.</p>

        <label style={labelStyle}>Email</label>
        <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" />

        <label style={labelStyle}>Senha</label>
        <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Sua senha" autoComplete="current-password" />

        {err && <div style={errBox}>{err}</div>}
        {resetMsg && <div style={{ ...errBox, background: "#0a2818", color: "#22C55E" }}>{resetMsg}</div>}

        <button onClick={handleLogin} disabled={loading} style={{ ...primaryBtn, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        <button onClick={handleForgot} disabled={loading} style={secondaryBtn}>
          Esqueci minha senha
        </button>
      </div>
    </div>
  );
}

function traduzErro(msg) {
  if (!msg) return "Erro desconhecido";
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos";
  if (m.includes("email not confirmed")) return "Confirme seu email primeiro (verifique sua caixa de entrada)";
  if (m.includes("user already registered") || m.includes("already been registered")) return "Esse email já está cadastrado. Use 'Já tem conta? Entrar'.";
  if (m.includes("rate limit") || m.includes("too many requests") || m.includes("429")) return "Muitas tentativas. Aguarde alguns minutos.";
  if (m.includes("weak password") || m.includes("password should be")) return "Senha muito fraca. Use ao menos 6 caracteres.";
  if (m.includes("invalid email")) return "Email inválido";
  return "Erro: " + msg;
}
