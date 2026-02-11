-- =============================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- =============================================================================
-- Run this script in your Supabase SQL Editor
-- This creates all storage buckets and RLS policies for WeddingRingRing

-- =============================================================================
-- CREATE BUCKETS
-- =============================================================================

-- Note: Buckets are created via Supabase UI, but here's the reference:
-- 1. recordings (private, 10 MB limit, audio files only)
-- 2. greetings (private, 5 MB limit, audio files only)
-- 3. venue-logos (public, 2 MB limit, image files only)

-- =============================================================================
-- RLS POLICIES FOR 'recordings' BUCKET
-- =============================================================================

-- Policy 1: Customers can view their own event recordings
CREATE POLICY "Customers can view their own event recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recordings' AND
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id::text = (storage.foldername(name))[1]
    AND events.customer_id = auth.uid()
  )
);

-- Policy 2: Admins can view all recordings
CREATE POLICY "Admins can view all recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'recordings' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 3: Service role can insert recordings (from Twilio webhooks)
CREATE POLICY "Service role can insert recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'recordings' AND
  (auth.jwt() ->> 'role' = 'service_role' OR
   EXISTS (
     SELECT 1 FROM profiles
     WHERE profiles.id = auth.uid()
     AND profiles.role = 'admin'
   ))
);

-- Policy 4: Admins can delete recordings
CREATE POLICY "Admins can delete recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'recordings' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- RLS POLICIES FOR 'greetings' BUCKET
-- =============================================================================

-- Policy 1: Customers can upload/update their own event greeting
CREATE POLICY "Customers can manage their event greeting"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'greetings' AND
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id::text = (storage.foldername(name))[1]
    AND events.customer_id = auth.uid()
  )
);

CREATE POLICY "Customers can update their event greeting"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'greetings' AND
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id::text = (storage.foldername(name))[1]
    AND events.customer_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'greetings' AND
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id::text = (storage.foldername(name))[1]
    AND events.customer_id = auth.uid()
  )
);

-- Policy 2: Customers can view their own event greeting
CREATE POLICY "Customers can view their event greeting"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'greetings' AND
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id::text = (storage.foldername(name))[1]
    AND events.customer_id = auth.uid()
  )
);

-- Policy 3: Admins can view all greetings
CREATE POLICY "Admins can view all greetings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'greetings' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 4: Service role can read greetings (for Twilio playback)
CREATE POLICY "Service role can read greetings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'greetings' AND
  (auth.jwt() ->> 'role' = 'service_role' OR
   EXISTS (
     SELECT 1 FROM profiles
     WHERE profiles.id = auth.uid()
     AND profiles.role = 'admin'
   ))
);

-- Policy 5: Customers can delete their own greeting
CREATE POLICY "Customers can delete their event greeting"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'greetings' AND
  EXISTS (
    SELECT 1 FROM events
    WHERE events.id::text = (storage.foldername(name))[1]
    AND events.customer_id = auth.uid()
  )
);

-- Policy 6: Admins can delete any greeting
CREATE POLICY "Admins can delete greetings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'greetings' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- RLS POLICIES FOR 'venue-logos' BUCKET
-- =============================================================================

-- Policy 1: Public read access (anyone can view logos)
CREATE POLICY "Anyone can view venue logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'venue-logos');

-- Policy 2: Venues can upload/update their own logo
CREATE POLICY "Venues can upload their logo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'venue-logos' AND
  EXISTS (
    SELECT 1 FROM venues
    WHERE venues.id::text = split_part(name, '.', 1)
    AND venues.owner_id = auth.uid()
  )
);

CREATE POLICY "Venues can update their logo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'venue-logos' AND
  EXISTS (
    SELECT 1 FROM venues
    WHERE venues.id::text = split_part(name, '.', 1)
    AND venues.owner_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'venue-logos' AND
  EXISTS (
    SELECT 1 FROM venues
    WHERE venues.id::text = split_part(name, '.', 1)
    AND venues.owner_id = auth.uid()
  )
);

-- Policy 3: Admins can upload/update any logo
CREATE POLICY "Admins can upload venue logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'venue-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admins can update venue logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'venue-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  bucket_id = 'venue-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy 4: Venues and Admins can delete logos
CREATE POLICY "Venues can delete their logo"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'venue-logos' AND
  EXISTS (
    SELECT 1 FROM venues
    WHERE venues.id::text = split_part(name, '.', 1)
    AND venues.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete venue logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'venue-logos' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Run these to verify policies are correctly set up:

-- Check recordings policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects' 
AND policyname LIKE '%recording%';

-- Check greetings policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects' 
AND policyname LIKE '%greeting%';

-- Check venue-logos policies
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'objects' 
AND policyname LIKE '%logo%';

-- =============================================================================
-- NOTES
-- =============================================================================

/*
IMPORTANT: Before running this script:

1. Create the buckets manually in Supabase UI:
   - Storage → New Bucket → recordings (private, 10MB limit)
   - Storage → New Bucket → greetings (private, 5MB limit)
   - Storage → New Bucket → venue-logos (public, 2MB limit)

2. Set bucket MIME type restrictions:
   recordings: audio/mpeg, audio/wav, audio/mp4, audio/x-m4a
   greetings: audio/mpeg, audio/wav, audio/mp4, audio/x-m4a
   venue-logos: image/png, image/jpeg, image/svg+xml, image/webp

3. Ensure SUPABASE_SERVICE_ROLE_KEY is set in environment variables

4. Test uploads using the helper functions in /src/lib/storage.ts
*/
