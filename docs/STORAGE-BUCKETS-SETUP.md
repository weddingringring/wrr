# Supabase Storage Buckets Setup Guide

## Overview

WeddingRingRing uses Supabase Storage for storing binary files:
1. **Audio recordings** - Voice messages from guests
2. **Custom greetings** - Customer-uploaded audio greetings
3. **Venue logos** - Venue branding images

---

## 🪣 Required Buckets

### 1. `recordings`
**Purpose:** Store voice message recordings from guests  
**Access:** Private (authenticated users only)  
**File Types:** Audio (MP3, WAV, M4A)  
**Max File Size:** 10 MB  
**Path Structure:** `{event_id}/{message_id}.mp3`

### 2. `event-greetings`
**Purpose:** Store customer-uploaded custom greeting audio  
**Access:** Public (Twilio needs to access)  
**File Types:** Audio (MP3, WAV)  
**Max File Size:** 10 MB  
**Path Structure:** `{event_id}/greeting.mp3`

### 3. `venue-logos`
**Purpose:** Store venue logo images  
**Access:** Public (anyone can view)  
**File Types:** Images (PNG, JPG, SVG, WEBP)  
**Max File Size:** 2 MB  
**Path Structure:** `{venue_id}.png`

---

## 📋 Step-by-Step Setup

### Step 1: Create Buckets in Supabase

1. Go to your Supabase project dashboard
2. Click **Storage** in the left sidebar
3. Click **New Bucket**

**For each bucket:**

#### Bucket: `recordings`
- Name: `recordings`
- Public: ❌ **NO** (Private)
- File size limit: `10485760` (10 MB)
- Allowed MIME types: `audio/mpeg, audio/wav, audio/mp4, audio/x-m4a`

#### Bucket: `event-greetings`
- Name: `event-greetings`
- Public: ✅ **YES** (Twilio needs access)
- File size limit: `10485760` (10 MB)
- Allowed MIME types: `audio/mpeg, audio/wav`

#### Bucket: `venue-logos`
- Name: `venue-logos`
- Public: ✅ **YES** (Public)
- File size limit: `2097152` (2 MB)
- Allowed MIME types: `image/png, image/jpeg, image/svg+xml, image/webp`

---

### Step 2: Set Up RLS (Row Level Security) Policies

For **private buckets** (`recordings` and `greetings`), we need RLS policies to control access.

#### Navigate to Storage Policies

1. In Supabase dashboard: **Storage** → **Policies**
2. Select the bucket
3. Click **New Policy**

---

#### RLS Policies for `recordings` Bucket

**Policy 1: Customers can view their own recordings**
```sql
-- Policy Name: Customers can view their own event recordings
-- Operation: SELECT
-- Target: authenticated
-- WITH CHECK: false
-- USING:
SELECT EXISTS (
  SELECT 1 FROM events
  WHERE events.id::text = (storage.foldername(name))[1]
  AND events.customer_id = auth.uid()
);
```

**Policy 2: Admins can view all recordings**
```sql
-- Policy Name: Admins can view all recordings
-- Operation: SELECT
-- Target: authenticated
-- WITH CHECK: false
-- USING:
SELECT EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
);
```

**Policy 3: System can insert recordings (via service role)**
```sql
-- Policy Name: Service role can insert recordings
-- Operation: INSERT
-- Target: authenticated
-- USING: false
-- WITH CHECK:
SELECT auth.jwt() ->> 'role' = 'service_role';
```

**Policy 4: Admins can delete recordings**
```sql
-- Policy Name: Admins can delete recordings
-- Operation: DELETE
-- Target: authenticated
-- USING:
SELECT EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
);
```

---

#### RLS Policies for `greetings` Bucket

**Policy 1: Customers can upload/update their own greeting**
```sql
-- Policy Name: Customers can manage their event greeting
-- Operations: INSERT, UPDATE
-- Target: authenticated
-- USING:
SELECT EXISTS (
  SELECT 1 FROM events
  WHERE events.id::text = (storage.foldername(name))[1]
  AND events.customer_id = auth.uid()
);
-- WITH CHECK: (same as USING)
```

**Policy 2: Customers can view their own greeting**
```sql
-- Policy Name: Customers can view their event greeting
-- Operation: SELECT
-- Target: authenticated
-- WITH CHECK: false
-- USING:
SELECT EXISTS (
  SELECT 1 FROM events
  WHERE events.id::text = (storage.foldername(name))[1]
  AND events.customer_id = auth.uid()
);
```

**Policy 3: Admins can view all greetings**
```sql
-- Policy Name: Admins can view all greetings
-- Operation: SELECT
-- Target: authenticated
-- WITH CHECK: false
-- USING:
SELECT EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
);
```

**Policy 4: System can read greetings (for Twilio playback)**
```sql
-- Policy Name: Service role can read greetings
-- Operation: SELECT
-- Target: authenticated
-- WITH CHECK: false
-- USING:
SELECT auth.jwt() ->> 'role' = 'service_role';
```

---

#### RLS Policies for `venue-logos` Bucket

**Policy 1: Public read access**
```sql
-- Policy Name: Anyone can view venue logos
-- Operation: SELECT
-- Target: public
-- WITH CHECK: false
-- USING: true
```

**Policy 2: Venues can upload their own logo**
```sql
-- Policy Name: Venues can manage their logo
-- Operations: INSERT, UPDATE
-- Target: authenticated
-- USING:
SELECT EXISTS (
  SELECT 1 FROM venues
  WHERE venues.id::text = (storage.foldername(name))[1]
  AND venues.owner_id = auth.uid()
);
-- WITH CHECK: (same as USING)
```

**Policy 3: Admins can manage all logos**
```sql
-- Policy Name: Admins can manage all venue logos
-- Operations: INSERT, UPDATE, DELETE
-- Target: authenticated
-- USING:
SELECT EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = auth.uid()
  AND profiles.role = 'admin'
);
-- WITH CHECK: (same as USING)
```

---

## 📝 Helper Functions for Storage

Create these utility functions in your codebase:

### Upload Recording (from Twilio webhook)

```typescript
// /src/lib/storage.ts

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for Twilio webhooks
)

export async function uploadRecording(
  eventId: string,
  messageId: string,
  audioBuffer: Buffer,
  contentType: string = 'audio/mpeg'
): Promise<string | null> {
  try {
    const fileName = `${eventId}/${messageId}.mp3`
    
    const { data, error } = await supabase.storage
      .from('recordings')
      .upload(fileName, audioBuffer, {
        contentType,
        upsert: false
      })

    if (error) throw error

    // Return public URL (signed URL for private buckets)
    const { data: urlData } = await supabase.storage
      .from('recordings')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

    return urlData?.signedUrl || null
  } catch (error) {
    console.error('Failed to upload recording:', error)
    return null
  }
}
```

### Upload Custom Greeting

```typescript
export async function uploadGreeting(
  eventId: string,
  audioFile: File
): Promise<string | null> {
  try {
    const fileName = `${eventId}/greeting.mp3`
    
    const { data, error } = await supabase.storage
      .from('greetings')
      .upload(fileName, audioFile, {
        contentType: audioFile.type,
        upsert: true // Allow updating existing greeting
      })

    if (error) throw error

    // Return public URL
    const { data: urlData } = await supabase.storage
      .from('greetings')
      .createSignedUrl(fileName, 60 * 60 * 24 * 365) // 1 year

    return urlData?.signedUrl || null
  } catch (error) {
    console.error('Failed to upload greeting:', error)
    return null
  }
}
```

### Upload Venue Logo

```typescript
export async function uploadVenueLogo(
  venueId: string,
  logoFile: File
): Promise<string | null> {
  try {
    const fileExt = logoFile.name.split('.').pop()
    const fileName = `${venueId}.${fileExt}`
    
    const { data, error } = await supabase.storage
      .from('venue-logos')
      .upload(fileName, logoFile, {
        contentType: logoFile.type,
        upsert: true // Allow updating logo
      })

    if (error) throw error

    // Get public URL (no signed URL needed for public bucket)
    const { data: urlData } = supabase.storage
      .from('venue-logos')
      .getPublicUrl(fileName)

    return urlData?.publicUrl || null
  } catch (error) {
    console.error('Failed to upload venue logo:', error)
    return null
  }
}
```

### Get Recording URL (for playback)

```typescript
export async function getRecordingUrl(
  eventId: string,
  messageId: string
): Promise<string | null> {
  try {
    const fileName = `${eventId}/${messageId}.mp3`
    
    const { data, error } = await supabase.storage
      .from('recordings')
      .createSignedUrl(fileName, 60 * 60) // 1 hour access

    if (error) throw error

    return data?.signedUrl || null
  } catch (error) {
    console.error('Failed to get recording URL:', error)
    return null
  }
}
```

---

## 🔐 Environment Variables

Make sure these are set:

```env
# Supabase URLs and Keys
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Important:** 
- Use `SUPABASE_SERVICE_ROLE_KEY` for server-side uploads (Twilio webhooks)
- Use `NEXT_PUBLIC_SUPABASE_ANON_KEY` for client-side uploads (customer greeting)

---

## 🧪 Testing the Buckets

### Test Recording Upload

```typescript
// In API route or server function
import { uploadRecording } from '@/lib/storage'

const testBuffer = Buffer.from('fake audio data')
const url = await uploadRecording('test-event-id', 'test-message-id', testBuffer)
console.log('Recording URL:', url)
```

### Test Greeting Upload

```typescript
// In client-side component
import { uploadGreeting } from '@/lib/storage'

const handleFileUpload = async (file: File) => {
  const url = await uploadGreeting('test-event-id', file)
  console.log('Greeting URL:', url)
}
```

### Test Logo Upload

```typescript
// In venue settings page
import { uploadVenueLogo } from '@/lib/storage'

const handleLogoUpload = async (file: File) => {
  const url = await uploadVenueLogo('test-venue-id', file)
  console.log('Logo URL:', url)
}
```

---

## 📊 Bucket Size Monitoring

**Supabase Free Tier:** 1 GB storage

**Estimated Usage:**
- Recording: ~1 MB per 4-minute message
- Greeting: ~500 KB per custom greeting
- Logo: ~100 KB per venue

**Capacity:**
- ~1,000 recordings (4,000 minutes of audio)
- ~2,000 greetings
- ~10,000 logos

**Upgrade Path:**
- Pro plan: 100 GB storage ($25/month)

---

## 🔍 Troubleshooting

### Issue: Upload fails with "Access denied"
**Solution:** Check RLS policies are correctly set up

### Issue: Cannot view file after upload
**Solution:** Use signed URLs for private buckets

### Issue: File size limit exceeded
**Solution:** Compress audio before upload or increase bucket limit

### Issue: MIME type not allowed
**Solution:** Add MIME type to bucket allowed types

---

## ✅ Checklist

- [ ] Create `recordings` bucket (private, 10 MB limit)
- [ ] Create `greetings` bucket (private, 5 MB limit)
- [ ] Create `venue-logos` bucket (public, 2 MB limit)
- [ ] Set up RLS policies for `recordings`
- [ ] Set up RLS policies for `greetings`
- [ ] Set up RLS policies for `venue-logos`
- [ ] Create `/src/lib/storage.ts` with helper functions
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` to environment variables
- [ ] Test recording upload
- [ ] Test greeting upload
- [ ] Test logo upload
- [ ] Integrate with Twilio webhook (recordings)
- [ ] Integrate with customer dashboard (greetings)
- [ ] Integrate with venue settings (logos)

---

**Estimated Setup Time:** 30 minutes  
**Status:** Ready to implement
