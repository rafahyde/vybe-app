-- =====================================================================
-- VYBE — Suporte a Google Places import + endpoint público de eventos
-- Rode TUDO no Supabase → SQL Editor → New Query → Run
-- =====================================================================

-- ─── 1. PLACES: campos pra dedup do Google Places ─────────────────────
ALTER TABLE public.places
  ADD COLUMN IF NOT EXISTS google_place_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS imported_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_places_google_id ON public.places (google_place_id);
CREATE INDEX IF NOT EXISTS idx_places_source ON public.places (source);

-- ─── 2. API KEYS DE PARCEIROS (casas/produtoras que enviam eventos) ──
CREATE TABLE IF NOT EXISTS public.venue_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Hash da key (nunca guarda a key plaintext)
  key_hash text NOT NULL UNIQUE,
  -- Prefixo visível pra identificação (ex: 'vyk_honeyclub')
  key_prefix text NOT NULL,
  venue_name text NOT NULL,
  contact_email text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  last_used_at timestamptz,
  events_submitted integer NOT NULL DEFAULT 0,
  rate_limit_per_hour integer NOT NULL DEFAULT 30,
  -- Nível de confiança: trusted publica direto, untrusted vira 'draft'
  trusted boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_venue_keys_hash ON public.venue_api_keys (key_hash) WHERE revoked_at IS NULL;

ALTER TABLE public.venue_api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin manages venue keys" ON public.venue_api_keys;
CREATE POLICY "Admin manages venue keys" ON public.venue_api_keys
  FOR ALL
  USING ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com')
  WITH CHECK ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com');

-- ─── 3. EVENTS: adiciona campo pra rastrear venue que submeteu ───────
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS submitted_by_venue_key uuid REFERENCES public.venue_api_keys(id);

-- Permite que a Vercel function (autenticada via venue key, SEM JWT)
-- insira eventos. Usamos uma policy especial que só funciona via
-- service_role (que vai estar na função serverless protegida).
-- A inserção real é feita pela função, não pelo cliente — então a
-- policy padrão de admin continua válida pro painel.

-- ─── 4. RATE LIMITING SIMPLES PRA VENUE API ──────────────────────────
CREATE TABLE IF NOT EXISTS public.venue_api_log (
  id bigserial PRIMARY KEY,
  venue_key_id uuid REFERENCES public.venue_api_keys(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  ip_address text,
  status_code integer,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_venue_log_key_time ON public.venue_api_log (venue_key_id, occurred_at DESC);

ALTER TABLE public.venue_api_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin reads venue log" ON public.venue_api_log;
CREATE POLICY "Admin reads venue log" ON public.venue_api_log
  FOR SELECT
  USING ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com');
