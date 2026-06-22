-- =====================================================================
-- VYBE — HARDENING DE SEGURANÇA
-- Rode este arquivo INTEIRO no Supabase → SQL Editor → New Query → Run
-- Idempotente: pode rodar várias vezes sem problema.
-- =====================================================================

-- ─── 1. AUDITORIA: GARANTE RLS EM TODAS AS TABELAS PUBLIC ─────────────
-- Lista qualquer tabela do schema public sem RLS (deveria estar vazio)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND rowsecurity = false
  LOOP
    RAISE WARNING 'Tabela sem RLS: %.% — habilitando agora', r.schemaname, r.tablename;
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ─── 2. POLICIES PERFORMÁTICAS (padrão (select auth.uid())) ──────────
-- Recria policies usando o padrão recomendado pelo Supabase pra cache.

-- PLACES
DROP POLICY IF EXISTS "Public read places" ON public.places;
DROP POLICY IF EXISTS "Admin write places" ON public.places;
DROP POLICY IF EXISTS "Admin insert places" ON public.places;
DROP POLICY IF EXISTS "Admin update places" ON public.places;
DROP POLICY IF EXISTS "Admin delete places" ON public.places;

CREATE POLICY "Public read places" ON public.places
  FOR SELECT USING (true);

CREATE POLICY "Admin insert places" ON public.places
  FOR INSERT
  WITH CHECK ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com');

CREATE POLICY "Admin update places" ON public.places
  FOR UPDATE
  USING ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com')
  WITH CHECK ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com');

CREATE POLICY "Admin delete places" ON public.places
  FOR DELETE
  USING ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com');

-- EVENTS
DROP POLICY IF EXISTS "Public read events" ON public.events;
DROP POLICY IF EXISTS "Admin write events" ON public.events;
DROP POLICY IF EXISTS "Admin insert events" ON public.events;
DROP POLICY IF EXISTS "Admin update events" ON public.events;
DROP POLICY IF EXISTS "Admin delete events" ON public.events;

CREATE POLICY "Public read events" ON public.events
  FOR SELECT USING (true);

CREATE POLICY "Admin insert events" ON public.events
  FOR INSERT
  WITH CHECK ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com');

CREATE POLICY "Admin update events" ON public.events
  FOR UPDATE
  USING ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com')
  WITH CHECK ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com');

CREATE POLICY "Admin delete events" ON public.events
  FOR DELETE
  USING ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com');

-- PROFILES
DROP POLICY IF EXISTS "Users read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;

CREATE POLICY "Users read own profile" ON public.profiles
  FOR SELECT
  USING ((select auth.uid()) = id);

CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- ─── 3. CHECK CONSTRAINTS: VALIDAÇÃO NO BANCO ────────────────────────
-- Garante que valores absurdos não entrem mesmo se o frontend for burlado.

-- PLACES
DO $$ BEGIN
  ALTER TABLE public.places
    ADD CONSTRAINT places_type_check CHECK (type IN ('bar', 'club', 'restaurant'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.places
    ADD CONSTRAINT places_rating_range CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.places
    ADD CONSTRAINT places_crowd_range CHECK (crowd IS NULL OR (crowd >= 0 AND crowd <= 100));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.places
    ADD CONSTRAINT places_lat_range CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.places
    ADD CONSTRAINT places_lng_range CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.places
    ADD CONSTRAINT places_name_length CHECK (char_length(name) BETWEEN 1 AND 200);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- EVENTS
DO $$ BEGIN
  ALTER TABLE public.events
    ADD CONSTRAINT events_lat_range CHECK (lat IS NULL OR (lat >= -90 AND lat <= 90));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.events
    ADD CONSTRAINT events_lng_range CHECK (lng IS NULL OR (lng >= -180 AND lng <= 180));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.events
    ADD CONSTRAINT events_name_length CHECK (char_length(name) BETWEEN 1 AND 200);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.events
    ADD CONSTRAINT events_status_check CHECK (status IN ('active', 'cancelled', 'finished', 'draft'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- PROFILES
DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_age_range CHECK (age IS NULL OR (age >= 13 AND age <= 120));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_name_length CHECK (name IS NULL OR char_length(name) BETWEEN 1 AND 100);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'moderator'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── 4. AUDIT LOG ─────────────────────────────────────────────────────
-- Registra eventos críticos: criação/deleção de lugar, evento, mudança de role.
-- Tabela separada, só admin lê, ninguém edita/deleta direto.

CREATE TABLE IF NOT EXISTS public.audit_log (
  id bigserial PRIMARY KEY,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,           -- ex: 'place.insert', 'event.delete', 'auth.signin'
  resource_type text,             -- 'places', 'events', 'profiles'
  resource_id text,
  metadata jsonb,
  ip_address text,
  user_agent text
);

CREATE INDEX IF NOT EXISTS idx_audit_log_occurred_at ON public.audit_log (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log (action);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin read audit log" ON public.audit_log;
CREATE POLICY "Admin read audit log" ON public.audit_log
  FOR SELECT
  USING ((select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com');

-- Inserção feita por triggers (security definer), não por usuários — nenhuma INSERT policy

-- Função do trigger (SECURITY DEFINER pra bypass RLS na inserção do log)
CREATE OR REPLACE FUNCTION public.log_table_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_log (actor_id, actor_email, action, resource_type, resource_id, metadata)
  VALUES (
    auth.uid(),
    auth.jwt() ->> 'email',
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('name', NEW.name)
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('name', OLD.name)
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('name', NEW.name)
    END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers
DROP TRIGGER IF EXISTS places_audit ON public.places;
CREATE TRIGGER places_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.places
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

DROP TRIGGER IF EXISTS events_audit ON public.events;
CREATE TRIGGER events_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.log_table_change();

-- ─── 5. VERIFICAÇÃO FINAL ─────────────────────────────────────────────
-- Roda esses SELECTs separadamente pra conferir que tudo está OK:

-- Tabelas sem RLS (deve retornar 0 linhas):
-- SELECT schemaname, tablename FROM pg_tables
--   WHERE schemaname = 'public' AND rowsecurity = false;

-- Tabelas com RLS mas sem nenhuma policy (também deve retornar 0):
-- SELECT t.schemaname, t.tablename FROM pg_tables t
--   LEFT JOIN pg_policies p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
--   WHERE t.schemaname = 'public' AND t.rowsecurity = true AND p.policyname IS NULL;

-- Todas as policies ativas:
-- SELECT schemaname, tablename, policyname, cmd FROM pg_policies
--   WHERE schemaname = 'public' ORDER BY tablename, cmd;
