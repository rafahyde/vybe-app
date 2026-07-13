// Vercel Function — LGPD Art. 18: direito ao esquecimento
// POST /api/account/delete
// Auth: Bearer <user_jwt>
// Body: { confirmation: "EXCLUIR MINHA CONTA" }
// Ação: deleta usuário do auth.users (CASCADE apaga profile e dados relacionados)

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

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

  // Confirmação obrigatória — dupla verificação anti-erro-acidental
  const { confirmation } = req.body || {};
  if (confirmation !== "EXCLUIR MINHA CONTA") {
    return res.status(400).json({ error: "Confirmação incorreta" });
  }

  const userId = userData.user.id;
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  // Deleta o usuário do auth. FK cascade apaga profile automaticamente.
  const { error: deleteErr } = await supabase.auth.admin.deleteUser(userId);
  if (deleteErr) {
    console.error("[account/delete] failed:", deleteErr);
    return res.status(500).json({ error: "Falha ao excluir conta. Contate suporte." });
  }

  return res.status(200).json({ success: true, message: "Conta excluída permanentemente" });
}
