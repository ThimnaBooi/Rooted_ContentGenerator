/*
# Storage bucket RLS policies

## Purpose
Secure the three storage buckets (photos, documents, voice) so each
authenticated user can only manage files under their own user-id prefix.

## Security
- photos bucket is public-read (so gallery images render), but only the owner
  can upload / update / delete their own files.
- documents and voice buckets are private — only the owner can read, upload,
  update, and delete their own files.
- All policies scope by the first path segment matching auth.uid()::text.
*/

-- photos: public read, owner write
DROP POLICY IF EXISTS "photos_public_read" ON storage.objects;
CREATE POLICY "photos_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'photos');

DROP POLICY IF EXISTS "photos_owner_insert" ON storage.objects;
CREATE POLICY "photos_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "photos_owner_update" ON storage.objects;
CREATE POLICY "photos_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "photos_owner_delete" ON storage.objects;
CREATE POLICY "photos_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'photos' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- documents: owner only
DROP POLICY IF EXISTS "documents_owner_read" ON storage.objects;
CREATE POLICY "documents_owner_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "documents_owner_insert" ON storage.objects;
CREATE POLICY "documents_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "documents_owner_update" ON storage.objects;
CREATE POLICY "documents_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "documents_owner_delete" ON storage.objects;
CREATE POLICY "documents_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text
);

-- voice: owner only
DROP POLICY IF EXISTS "voice_owner_read" ON storage.objects;
CREATE POLICY "voice_owner_read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'voice' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "voice_owner_insert" ON storage.objects;
CREATE POLICY "voice_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'voice' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "voice_owner_update" ON storage.objects;
CREATE POLICY "voice_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (
  bucket_id = 'voice' AND (storage.foldername(name))[1] = auth.uid()::text
) WITH CHECK (
  bucket_id = 'voice' AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "voice_owner_delete" ON storage.objects;
CREATE POLICY "voice_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'voice' AND (storage.foldername(name))[1] = auth.uid()::text
);
