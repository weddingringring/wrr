# Storage Buckets Implementation Checklist

## ✅ Complete Setup Guide

### Phase 1: Supabase Dashboard Setup (15 mins)

#### Step 1: Create Buckets

1. Go to Supabase Dashboard → **Storage**
2. Click **New Bucket**

**Create 3 buckets:**

#### Bucket 1: `recordings`
- ✅ Name: `recordings`
- ✅ Public: **NO** (uncheck)
- ✅ File size limit: `10485760` bytes (10 MB)
- ✅ Allowed MIME types: 
  ```
  audio/mpeg
  audio/wav
  audio/mp4
  audio/x-m4a
  ```

#### Bucket 2: `greetings`
- ✅ Name: `greetings`
- ✅ Public: **NO** (uncheck)
- ✅ File size limit: `5242880` bytes (5 MB)
- ✅ Allowed MIME types:
  ```
  audio/mpeg
  audio/wav
  audio/mp4
  audio/x-m4a
  ```

#### Bucket 3: `venue-logos`
- ✅ Name: `venue-logos`
- ✅ Public: **YES** (check)
- ✅ File size limit: `2097152` bytes (2 MB)
- ✅ Allowed MIME types:
  ```
  image/png
  image/jpeg
  image/svg+xml
  image/webp
  ```

---

### Phase 2: RLS Policies Setup (10 mins)

1. Go to Supabase Dashboard → **SQL Editor**
2. Click **New Query**
3. Copy entire contents of `/docs/storage-buckets-policies.sql`
4. Click **Run**
5. Verify no errors

**Expected result:** 16 policies created

---

### Phase 3: Environment Variables (2 mins)

Add to `.env.local`:

```env
# Already have these:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# ADD THIS (if not already present):
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Get service role key:**
Supabase Dashboard → Settings → API → `service_role` key (secret)

---

### Phase 4: Code Integration (Already Done! ✅)

Files created:
- ✅ `/src/lib/storage.ts` - All helper functions
- ✅ `/docs/STORAGE-BUCKETS-SETUP.md` - Full documentation
- ✅ `/docs/storage-buckets-policies.sql` - SQL policies

---

### Phase 5: Testing (5 mins)

#### Test 1: Upload Recording (Server-side)

Create `/src/app/api/test/upload-recording/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { uploadRecording } from '@/lib/storage'

export async function GET() {
  // Create a small test audio buffer
  const testBuffer = Buffer.from('test audio data')
  
  const result = await uploadRecording(
    'test-event-123',
    'test-message-456',
    testBuffer
  )
  
  return NextResponse.json(result)
}
```

Test: `curl http://localhost:3000/api/test/upload-recording`

Expected: `{ "url": "https://...", "error": null }`

---

#### Test 2: Upload Logo (Client-side)

Add to any admin page:

```tsx
import { uploadVenueLogo } from '@/lib/storage'

const testLogoUpload = async () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (file) {
      const result = await uploadVenueLogo('test-venue-123', file)
      console.log('Upload result:', result)
    }
  }
  
  input.click()
}
```

Expected: Logo uploaded and public URL returned

---

## 📊 File Structure Reference

```
/mnt/user-data/outputs/weddingringring/
├── src/
│   └── lib/
│       └── storage.ts ✅ (Helper functions)
│
├── docs/
│   ├── STORAGE-BUCKETS-SETUP.md ✅ (Full guide)
│   ├── storage-buckets-policies.sql ✅ (SQL script)
│   └── STORAGE-IMPLEMENTATION-CHECKLIST.md ✅ (This file)
│
└── public/ (No storage files here - all in Supabase)
```

---

## 🎯 Quick Reference: Function Usage

### Upload Recording (from Twilio webhook)

```typescript
import { uploadRecording } from '@/lib/storage'

const { url, error } = await uploadRecording(
  eventId,      // UUID
  messageId,    // UUID
  audioBuffer,  // Buffer from Twilio
  'audio/mpeg'  // MIME type
)
```

### Upload Custom Greeting (from customer dashboard)

```typescript
import { uploadGreeting } from '@/lib/storage'

const { url, error } = await uploadGreeting(
  eventId,   // UUID
  audioFile  // File from <input type="file">
)
```

### Upload Venue Logo (from venue settings)

```typescript
import { uploadVenueLogo } from '@/lib/storage'

const { url, error } = await uploadVenueLogo(
  venueId,  // UUID
  logoFile  // File from <input type="file">
)
```

### Get Recording URL (for playback)

```typescript
import { getRecordingUrl } from '@/lib/storage'

const { url, error } = await getRecordingUrl(
  eventId,    // UUID
  messageId,  // UUID
  3600        // Expires in 1 hour (optional)
)
```

### Delete Recording (admin only)

```typescript
import { deleteRecording } from '@/lib/storage'

const { success, error } = await deleteRecording(
  eventId,    // UUID
  messageId   // UUID
)
```

---

## 🔍 Troubleshooting

### Issue: "Access denied" when uploading

**Cause:** RLS policies not set up correctly

**Fix:** 
1. Go to SQL Editor
2. Run queries at bottom of `storage-buckets-policies.sql` to verify
3. Re-run the entire SQL script if policies are missing

---

### Issue: "File too large"

**Cause:** File exceeds bucket limit

**Fix:**
- Recordings: Max 10 MB (compress audio)
- Greetings: Max 5 MB (compress audio)
- Logos: Max 2 MB (optimize image)

---

### Issue: "Invalid MIME type"

**Cause:** File type not in bucket's allowed list

**Fix:** Convert file or add MIME type to bucket settings in Supabase UI

---

### Issue: Can't view uploaded file

**Cause:** Private bucket requires signed URL

**Fix:** Use `getRecordingUrl()` or `getGreetingUrl()` helper functions

---

## ✅ Final Checklist

**Supabase Dashboard:**
- [ ] Created `recordings` bucket (private, 10 MB)
- [ ] Created `greetings` bucket (private, 5 MB)
- [ ] Created `venue-logos` bucket (public, 2 MB)
- [ ] Set MIME type restrictions for each bucket
- [ ] Ran SQL script to create RLS policies
- [ ] Verified 16 policies created successfully

**Environment:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (NEW)

**Code:**
- [ ] `/src/lib/storage.ts` exists with all functions
- [ ] Tested recording upload (server-side)
- [ ] Tested logo upload (client-side)
- [ ] Tested greeting upload (client-side)

**Integration Points (Next Steps):**
- [ ] Twilio webhook → `uploadRecording()`
- [ ] Customer dashboard → `uploadGreeting()`
- [ ] Venue settings → `uploadVenueLogo()`
- [ ] Message playback → `getRecordingUrl()`

---

## 📈 Storage Capacity Planning

**Supabase Free Tier:** 1 GB

**Usage Estimates:**
- Recording (4 min): ~1 MB
- Greeting (30 sec): ~500 KB
- Logo: ~100 KB

**Capacity:**
- ~1,000 recordings
- ~2,000 greetings
- ~10,000 logos

**When to Upgrade:**
- Pro plan: 100 GB for $25/month
- Upgrade when approaching 800 MB

---

## 🎉 You're Done!

Storage buckets are ready to use. Next steps:

1. **Integrate with Twilio webhook** (upload recordings)
2. **Add greeting upload to customer dashboard**
3. **Add logo upload to venue settings**

---

**Estimated Total Time:** 30 minutes  
**Status:** ✅ Ready to implement
