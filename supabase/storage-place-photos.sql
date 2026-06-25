-- =====================================================================
-- VYBE — Bucket de Storage pras fotos de lugares
-- Rode no Supabase → SQL Editor → New Query → Run
-- =====================================================================

-- Cria o bucket público (idempotente)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'place-photos',
  'place-photos',
  true,
  2097152,  -- 2 MB por arquivo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- Policy: qualquer um lê fotos (bucket público)
DROP POLICY IF EXISTS "Public read place photos" ON storage.objects;
CREATE POLICY "Public read place photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'place-photos');

-- Policy: só admin escreve (insere/atualiza)
-- A função import-places.js usa service_role, que bypassa RLS — esta policy
-- é uma camada extra caso alguém tente subir foto via JWT comum
DROP POLICY IF EXISTS "Admin upload place photos" ON storage.objects;
CREATE POLICY "Admin upload place photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'place-photos'
    AND (select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com'
  );

DROP POLICY IF EXISTS "Admin update place photos" ON storage.objects;
CREATE POLICY "Admin update place photos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'place-photos'
    AND (select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com'
  );

DROP POLICY IF EXISTS "Admin delete place photos" ON storage.objects;
CREATE POLICY "Admin delete place photos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'place-photos'
    AND (select auth.jwt() ->> 'email') = 'rafahyde9@hotmail.com'
  );
