// ═══════════════════════════════════════════════════════════════
// VYBE — Edge Function: import-events
// Deploy: supabase functions deploy import-events
// ═══════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { normalizeEvent } from "./utils/normalize.ts";
import { isInSJC } from "./utils/dedupe.ts";
import { fetchSymplaEvents } from "./sources/sympla.ts";
import { fetchEventbriteEvents } from "./sources/eventbrite.ts";
import { fetchPrefeituraEvents } from "./sources/prefeitura-sjc.ts";
import { fetchSescEvents } from "./sources/sesc-sjc.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Adicione novas fontes aqui
const SOURCES = [
  { name: "sympla",        fetch: fetchSymplaEvents },
  { name: "eventbrite",    fetch: fetchEventbriteEvents },
  { name: "prefeitura-sjc", fetch: fetchPrefeituraEvents },
  { name: "sesc-sjc",      fetch: fetchSescEvents },
];

Deno.serve(async (req) => {
  // Verifica secret para chamadas manuais
  const authHeader = req.headers.get("authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const summary: Record<string, any> = {};
  let totalImported = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const source of SOURCES) {
    const logId = await startLog(source.name);
    let imported = 0, updated = 0, skipped = 0;
    let errorMsg: string | null = null;

    try {
      console.log(`Fetching from ${source.name}...`);
      const rawEvents = await source.fetch();
      console.log(`${source.name}: ${rawEvents.length} raw events`);

      for (const raw of rawEvents) {
        try {
          // Verificar se é em SJC
          if (!isInSJC(raw.city || "", raw.address || "", raw.description || "")) {
            skipped++;
            continue;
          }

          // Normalizar
          const normalized = normalizeEvent(raw);
          if (!normalized) { skipped++; continue; }

          // Upsert por source_event_id se disponível
          if (normalized.source_event_id) {
            const { data: existing } = await supabase
              .from("events")
              .select("id, updated_at")
              .eq("source", normalized.source)
              .eq("source_event_id", normalized.source_event_id)
              .single();

            if (existing) {
              await supabase.from("events").update({
                ...normalized,
                updated_at: new Date().toISOString(),
              }).eq("id", existing.id);
              updated++;
              continue;
            }
          } else {
            // Dedup por fingerprint
            const { data: existing } = await supabase
              .from("events")
              .select("id")
              .eq("fingerprint", normalized.fingerprint)
              .single();

            if (existing) { skipped++; continue; }
          }

          // Insert novo evento
          const { error } = await supabase.from("events").insert(normalized);
          if (error) {
            console.error(`Insert error for ${normalized.name}:`, error.message);
            skipped++;
          } else {
            imported++;
          }
        } catch (innerErr) {
          console.error("Error processing event:", innerErr);
          skipped++;
        }
      }
    } catch (err: any) {
      errorMsg = err.message || String(err);
      console.error(`Source ${source.name} failed:`, errorMsg);
    }

    await finishLog(logId, imported, updated, skipped, errorMsg);
    summary[source.name] = { imported, updated, skipped, error: errorMsg };
    totalImported += imported;
    totalUpdated += updated;
    totalSkipped += skipped;
  }

  return new Response(JSON.stringify({
    success: true,
    total: { imported: totalImported, updated: totalUpdated, skipped: totalSkipped },
    by_source: summary,
    ran_at: new Date().toISOString(),
  }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function startLog(source: string): Promise<number> {
  const { data } = await supabase
    .from("event_import_logs")
    .insert({ source, status: "running", started_at: new Date().toISOString() })
    .select("id")
    .single();
  return data?.id || 0;
}

async function finishLog(
  id: number,
  imported: number,
  updated: number,
  skipped: number,
  errorMessage: string | null
) {
  await supabase.from("event_import_logs").update({
    status: errorMessage ? "error" : "success",
    imported_count: imported,
    updated_count: updated,
    skipped_count: skipped,
    error_message: errorMessage,
    finished_at: new Date().toISOString(),
  }).eq("id", id);
}
