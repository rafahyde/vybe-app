import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("events")
    .update({ status: "expired", updated_at: now })
    .eq("status", "active")
    .lt("starts_at", now)
    .select("id");

  if (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({
    success: true,
    archived: data?.length || 0,
    ran_at: now,
  }), { headers: { "Content-Type": "application/json" } });
});
