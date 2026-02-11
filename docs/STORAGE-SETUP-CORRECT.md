# Storage Buckets - Correct Setup Guide

**IMPORTANT:** The code uses these 3 exact bucket names. Use these names, not alternatives!

---

## 📦 BUCKETS YOU NEED TO CREATE

### **Bucket 1: `message-recordings`**
**Purpose:** Guest voice message audio files  
**Public:** NO (Private)  
**Used by:** `/api/twilio/recording` (stores recordings), `/api/messages/[id]` (deletes recordings)

### **Bucket 2: `message-photos`**
**Purpose:** Guest photo uploads  
**Public:** NO (Private)  
**Used by:** `/api/messages/[id]` (deletes photos)

### **Bucket 3: `event-greetings`**
**Purpose:** Customer-uploaded custom audio greetings  
**Public:** YES (Twilio needs to play these)  
**Used by:** `/api/events/[id]/greeting` (upload/delete greetings)

---

## 🔧 HOW TO CREATE BUCKETS IN SUPABASE

### Step 1: Go to Storage
1. Open Supabase Dashboard
2. Click **Storage** in left sidebar
3. Click **New Bucket**

### Step 2: Create Each Bucket

#### Bucket 1: `message-recordings`
```
Name: message-recordings
Public: NO (keep unchecked)
File size limit: 10485760 (10 MB)
Allowed MIME types: audio/mpeg, audio/wav, audio/mp4
```
Click **Create Bucket**

#### Bucket 2: `message-photos`
```
Name: message-photos
Public: NO (keep unchecked)
File size limit: 5242880 (5 MB)
Allowed MIME types: image/jpeg, image/png, image/webp
```
Click **Create Bucket**

#### Bucket 3: `event-greetings`
```
Name: event-greetings
Public: YES (check this box) ⚠️ MUST BE PUBLIC
File size limit: 10485760 (10 MB)
Allowed MIME types: audio/mpeg, audio/wav
```
Click **Create Bucket**

---

## 🔐 STEP 3: APPLY STORAGE POLICIES

After creating buckets, go to **SQL Editor** and run this:

```sql
-- =============================================================================
-- BUCKET 1: message-recordings (PRIVATE)
-- =============================================================================

-- Twilio can upload recordings (via service role)
CREATE POLICY "Service role can upload recordings"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'message-recordings');

-- Customers can read their event's recordings
CREATE POLICY "Customers can read their recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-recordings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM events WHERE customer_user_id = auth.uid()
  )
);

-- Customers can delete their recordings
CREATE POLICY "Customers can delete recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-recordings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM events WHERE customer_user_id = auth.uid()
  )
);

-- Admins can view all recordings
CREATE POLICY "Admins can view recordings"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-recordings'
  AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =============================================================================
-- BUCKET 2: message-photos (PRIVATE)
-- =============================================================================

-- Customers can upload photos
CREATE POLICY "Customers can upload photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM events WHERE customer_user_id = auth.uid()
  )
);

-- Customers can read their photos
CREATE POLICY "Customers can read their photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM events WHERE customer_user_id = auth.uid()
  )
);

-- Customers can delete their photos
CREATE POLICY "Customers can delete photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-photos'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM events WHERE customer_user_id = auth.uid()
  )
);

-- Admins can view all photos
CREATE POLICY "Admins can view photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-photos'
  AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- =============================================================================
-- BUCKET 3: event-greetings (PUBLIC - Twilio needs access)
-- =============================================================================

-- Customers can upload greetings
CREATE POLICY "Customers can upload greetings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-greetings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM events WHERE customer_user_id = auth.uid()
  )
);

-- Public can read (for Twilio)
CREATE POLICY "Public can read greetings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'event-greetings');

-- Customers can update their greetings
CREATE POLICY "Customers can update greetings"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-greetings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM events WHERE customer_user_id = auth.uid()
  )
);

-- Customers can delete their greetings
CREATE POLICY "Customers can delete greetings"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-greetings'
  AND (storage.foldername(name))[1] IN (
    SELECT id::text FROM events WHERE customer_user_id = auth.uid()
  )
);
```

---

## ✅ VERIFICATION

After creating buckets and applying policies, verify:

```sql
-- Check buckets exist
SELECT name, public 
FROM storage.buckets 
ORDER BY name;
```

**Expected:**
```
event-greetings    | true
message-photos     | false
message-recordings | false
```

```sql
-- Check policies
SELECT bucket_id, COUNT(*) as policy_count
FROM (
  SELECT DISTINCT bucket_id, policyname 
  FROM storage.policies
) AS policies
GROUP BY bucket_id
ORDER BY bucket_id;
```

**Expected:**
```
event-greetings    | 4
message-photos     | 4
message-recordings | 4
```

---

## 🚨 CRITICAL NOTES

1. **Exact Names Required:**
   - ✅ `message-recordings` (NOT `recordings`)
   - ✅ `message-photos` (NOT `photos`)
   - ✅ `event-greetings` (NOT `greetings`)

2. **Public Status:**
   - ❌ `message-recordings` = PRIVATE
   - ❌ `message-photos` = PRIVATE
   - ✅ `event-greetings` = PUBLIC (Twilio needs this!)

3. **File Structure:**
   - Recordings: `message-recordings/{event_id}/{message_id}.mp3`
   - Photos: `message-photos/{event_id}/{message_id}.jpg`
   - Greetings: `event-greetings/{event_id}/greeting.mp3`

---

## 📝 SUMMARY

**Total Buckets:** 3  
**Public Buckets:** 1 (`event-greetings`)  
**Private Buckets:** 2 (`message-recordings`, `message-photos`)  
**Total Policies:** 12 (4 per bucket)

---

**Follow these exact names and you're good to go!** ✅
