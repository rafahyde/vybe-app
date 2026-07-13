// Vercel Function — LGPD Art. 18: usuário tem direito de portabilidade dos dados
// GET /api/account/export
// Auth: Bearer <user_jwt>
// Retorna: JSON com todos os dados pessoais do usuário

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Use GET" });

  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.VITE_SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Servidor mal configurado" });
  }

  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Não autenticado" });

  const supabaseAuth = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  );
  const { data: userData, error: authErr } = await supabaseAuth.auth.getUser(token);
  if (authErr || !userData?.user) return res.status(401).json({ error: "Token inválido" });
  const userId = userData.user.id;

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  const [profileRes, authRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.auth.admin.getUserById(userId),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    account: {
      id: userId,
      email: authRes.data?.user?.email || userData.user.email,
      created_at: authRes.data?.user?.created_at,
      email_confirmed_at: authRes.data?.user?.email_confirmed_at,
      last_sign_in_at: authRes.data?.user?.last_sign_in_at,
      metadata: authRes.data?.user?.user_metadata,
    },
    profile: profileRes.data || null,
    // Adicionar outras tabelas aqui conforme criarmos: check-ins, reports, etc.
  };

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="vybe-meus-dados-${userId.slice(0, 8)}.json"`);
  return res.status(200).json(exportData);
}
