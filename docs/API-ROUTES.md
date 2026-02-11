# WeddingRingRing API Routes Documentation

## Overview

All API routes are in `/src/app/api/` and follow Next.js App Router conventions.

---

## 🎙️ Twilio Webhooks

### `POST /api/twilio/voice`

**Purpose:** Handle incoming phone calls

**Called by:** Twilio (when someone calls an event's phone number)

**Request:** Twilio voice webhook parameters
```
To: +441234567890 (event's phone number)
From: +447123456789 (caller's number)
CallSid: CAxxxxxxxxxxxxxxxxxxxx
```

**Response:** TwiML XML
```xml
<Response>
  <Say voice="Polly.Amy">Welcome to Sarah and James's wedding...</Say>
  <Record maxLength="240" playBeep="true" />
  <Say>Thank you for your message. Goodbye.</Say>
  <Hangup/>
</Response>
```

**Logic:**
1. Find event by phone number
2. Check if custom greeting exists → Play it
3. Else use auto-generated text → Text-to-speech
4. Record message (up to max_message_duration)
5. Thank caller and hangup

---

### `POST /api/twilio/recording`

**Purpose:** Save completed voice message

**Called by:** Twilio (when recording completes)

**Request:** Twilio recording webhook parameters
```
RecordingSid: RExxxxxxxxxxxxxxxxxxxx
RecordingUrl: https://api.twilio.com/...
RecordingDuration: 45
CallSid: CAxxxxxxxxxxxxxxxxxxxx
To: +441234567890
From: +447123456789
```

**Response:**
```json
{
  "success": true,
  "message_id": "uuid"
}
```

**Logic:**
1. Find event by phone number
2. Download MP3 from Twilio (authenticated)
3. Upload to Supabase Storage: `message-recordings/{event_id}/{recording_sid}.mp3`
4. Create message record in database
5. Optionally notify customer

---

## 💬 Message Operations

### `PATCH /api/messages/[id]`

**Purpose:** Update message details

**Auth:** Customer only (via Supabase RLS)

**Request:**
```json
{
  "guest_name": "John Smith",
  "notes": "Beautiful message!",
  "tags": ["Emotional", "Family"],
  "is_favorite": true,
  "guest_photo_url": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "message": { ... }
}
```

**Allowed fields:**
- guest_name
- notes
- tags (array)
- is_favorite
- guest_photo_url

---

### `DELETE /api/messages/[id]`

**Purpose:** Delete a message

**Auth:** Customer only

**Response:**
```json
{
  "success": true
}
```

**Logic:**
1. Get message details
2. Delete audio file from storage
3. Delete photo from storage (if exists)
4. Delete database record

---

## 📅 Event Operations

### `POST /api/events/[id]/greeting`

**Purpose:** Upload custom greeting audio

**Auth:** Customer or Venue

**Request:** multipart/form-data
```
greeting: <audio file>
```

**Validation:**
- Must be audio/* mime type
- Max 10MB
- Supported: MP3, WAV, M4A, etc.

**Response:**
```json
{
  "success": true,
  "greeting_url": "https://..."
}
```

**Logic:**
1. Validate file type and size
2. Delete old greeting if exists
3. Upload to: `event-greetings/{event_id}/greeting.{ext}`
4. Update event.greeting_audio_url
5. Set greeting_uploaded_at timestamp

---

### `DELETE /api/events/[id]/greeting`

**Purpose:** Remove custom greeting (revert to auto-generated)

**Auth:** Customer or Venue

**Response:**
```json
{
  "success": true
}
```

**Logic:**
1. Delete file from storage
2. Set greeting_audio_url = null
3. Voice webhook will use greeting_text instead

---

### `POST /api/events/[id]/cancel`

**Purpose:** Cancel an event

**Auth:** Venue only

**Request:**
```json
{
  "reason": "Email typo - recreating event"
}
```

**Protection:** Returns 403 if event has messages

**Response:**
```json
{
  "success": true,
  "message": "Event cancelled successfully"
}
```

**Logic:**
1. Check message count
2. If messages > 0 → Reject with 403
3. Update event status to 'cancelled'
4. Set cancelled_at timestamp
5. TODO: Release phone number

---

## 🔐 Authentication

### Client-side (Browser)
Uses Supabase client with anon key + RLS policies

### Server-side (API Routes)
Uses Supabase service role key (bypasses RLS)

**Security:**
- API routes validate auth internally
- Supabase RLS protects direct database access
- Service role key only in server environment

---

## 📂 Storage Buckets

All buckets are **public** (read access):

### `message-recordings`
```
Path: {event_id}/{recording_sid}.mp3
Example: 123abc/RE456def.mp3
Access: Public read
```

### `message-photos`
```
Path: {event_id}/{message_id}.{ext}
Example: 123abc/msg789.jpg
Access: Public read
```

### `event-greetings`
```
Path: {event_id}/greeting.{ext}
Example: 123abc/greeting.mp3
Access: Public read
```

### `venue-logos`
```
Path: {venue_id}/logo.{ext}
Example: venue456/logo.png
Access: Public read
```

---

## 🔄 Webhook Flow

```
Guest calls phone number
  ↓
Twilio → POST /api/twilio/voice
  ↓
Returns TwiML (play greeting, record)
  ↓
Guest leaves message
  ↓
Twilio → POST /api/twilio/recording
  ↓
Downloads MP3 from Twilio
  ↓
Uploads to Supabase Storage
  ↓
Creates message in database
  ↓
Customer sees message in dashboard ✅
```

---

## 🧪 Testing Webhooks Locally

### 1. Install ngrok
```bash
npm install -g ngrok
```

### 2. Start your dev server
```bash
npm run dev
```

### 3. Start ngrok
```bash
ngrok http 3000
```

### 4. Configure Twilio
- Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
- In Twilio console, set webhook URL:
  - Voice: `https://abc123.ngrok.io/api/twilio/voice`
  - Recording: `https://abc123.ngrok.io/api/twilio/recording`

### 5. Test
- Call your Twilio number
- Check ngrok console for requests
- Check terminal for API logs

---

## 📊 Files Created

```
/src/app/api/
├── twilio/
│   ├── voice/route.ts           ✅ Handle incoming calls
│   └── recording/route.ts       ✅ Save completed messages
├── messages/
│   └── [id]/route.ts            ✅ Update/delete messages
└── events/
    └── [id]/
        ├── greeting/route.ts    ✅ Upload/delete custom greeting
        └── cancel/route.ts      ✅ Cancel event
```

---

**API Routes Complete!** 🎉

Next up: Twilio Integration (phone number management, configuration)
