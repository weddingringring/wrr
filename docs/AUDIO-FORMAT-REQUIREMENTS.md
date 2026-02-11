# Audio Format Requirements & Solutions

## 🎯 The Problem

**Browser Recording:** MediaRecorder API creates WebM/Opus format  
**Twilio Playback:** Only supports MP3, WAV, and GSM formats  
**Result:** Recorded greetings won't play over the phone ❌

---

## ✅ Solution Options

### **Option 1: Server-Side Conversion (Recommended)**

Convert WebM to MP3 on the server when uploaded:

**Pros:**
- Works on all browsers
- Best quality control
- User doesn't need to wait

**Cons:**
- Requires FFmpeg on server
- Extra processing time
- Storage of original + converted file

**Implementation:**
```typescript
// In /api/events/[id]/greeting/route.ts
import ffmpeg from 'fluent-ffmpeg'

// After receiving the file
if (file.type.includes('webm')) {
  // Convert to MP3
  const mp3Buffer = await convertToMP3(fileBuffer)
  fileName = `${eventId}/greeting.mp3`
  contentType = 'audio/mpeg'
}
```

### **Option 2: Client-Side Conversion**

Use a library like `lamejs` to convert in the browser:

**Pros:**
- No server processing needed
- Instant conversion

**Cons:**
- Larger JavaScript bundle
- Slower on mobile devices
- Uses client's battery/CPU

**Implementation:**
```typescript
import lamejs from 'lamejs'

// After recording stops
const mp3Blob = await convertWebMToMP3(recordedBlob)
```

### **Option 3: Force WAV Recording**

Configure MediaRecorder to output WAV instead of WebM:

**Pros:**
- Twilio supports WAV
- No conversion needed

**Cons:**
- Not all browsers support WAV output
- Larger file sizes
- May not work on Safari/iOS

**Implementation:**
```javascript
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/wav' // May fail on some browsers
})
```

### **Option 4: Hybrid Approach (BEST)**

1. Try to record as MP3 if browser supports it
2. Fall back to WebM if not
3. Convert WebM to MP3 on server
4. Accept uploaded MP3/WAV files directly

---

## 🔧 Recommended Implementation

### **Step 1: Update React Component**

```typescript
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    
    // Try MP3 first, fall back to browser default
    let options = {}
    if (MediaRecorder.isTypeSupported('audio/mpeg')) {
      options = { mimeType: 'audio/mpeg' }
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      options = { mimeType: 'audio/webm;codecs=opus' }
    }
    
    const mediaRecorder = new MediaRecorder(stream, options)
    // ... rest of recording logic
  }
}
```

### **Step 2: Add Server-Side Conversion**

Install FFmpeg:
```bash
npm install fluent-ffmpeg @types/fluent-ffmpeg
```

Create conversion utility:
```typescript
// /src/lib/audio-converter.ts
import ffmpeg from 'fluent-ffmpeg'

export async function convertToMP3(
  inputBuffer: Buffer,
  inputFormat: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    
    ffmpeg()
      .input(Readable.from(inputBuffer))
      .inputFormat(inputFormat)
      .audioCodec('libmp3lame')
      .audioBitrate('128k')
      .format('mp3')
      .on('end', () => resolve(Buffer.concat(chunks)))
      .on('error', reject)
      .pipe()
      .on('data', (chunk) => chunks.push(chunk))
  })
}
```

Update API route:
```typescript
// In greeting/route.ts
let finalBuffer = fileBuffer
let finalExt = fileExt
let finalType = file.type

// Convert WebM to MP3
if (file.type.includes('webm') || file.type.includes('ogg')) {
  finalBuffer = await convertToMP3(
    Buffer.from(fileBuffer),
    file.type.includes('webm') ? 'webm' : 'ogg'
  )
  finalExt = 'mp3'
  finalType = 'audio/mpeg'
}

const fileName = `${eventId}/greeting.${finalExt}`
```

### **Step 3: Update Validation**

Allow WebM uploads (will be converted):
```typescript
const allowedTypes = [
  'audio/mpeg',      // MP3
  'audio/wav',       // WAV
  'audio/webm',      // Browser recording
  'audio/ogg',       // Some browsers
  'audio/mp4',       // M4A
]

if (!allowedTypes.some(type => file.type.includes(type))) {
  return NextResponse.json({ 
    error: 'Unsupported format. Please upload MP3, WAV, or M4A.' 
  }, { status: 400 })
}
```

---

## 📋 Twilio Supported Formats

According to Twilio documentation, `<Play>` supports:

✅ **MP3** - Best for quality and size  
✅ **WAV** - Uncompressed, large files  
✅ **GSM** - Phone quality, smallest files  
❌ **WebM** - NOT supported  
❌ **OGG** - NOT supported  
❌ **FLAC** - NOT supported  

---

## 🚀 Quick Fix (No Conversion)

**If you don't want to implement conversion:**

Change the recording button text:
```
"Record Your Voice" → "Upload MP3 File"
```

And remove the recording feature entirely, only allow uploads.

**Pros:**
- Works immediately
- No conversion needed
- Users can record on their phone and upload

**Cons:**
- Less convenient for users
- Extra step required
- May reduce usage

---

## ✅ Current Status

**What works:**
- ✅ Browser recording (creates WebM)
- ✅ File upload
- ✅ Storage in Supabase
- ✅ Database updates

**What needs fixing:**
- ❌ WebM → MP3 conversion
- ❌ Twilio playback compatibility

**Impact:**
- Users CAN record greetings
- Greetings WILL upload successfully
- But they WON'T play over the phone

---

## 🎯 Recommendation

**Implement Option 4 (Hybrid):**

1. Keep recording feature as-is
2. Add server-side conversion with FFmpeg
3. Show user a warning if conversion fails
4. Test with real Twilio call to verify playback

**Timeline:**
- FFmpeg setup: 30 minutes
- Conversion code: 1 hour
- Testing: 30 minutes
- **Total: ~2 hours**

**Alternative (Fast):**
- Disable recording button until conversion is implemented
- Only allow MP3/WAV uploads
- Add back recording later
- **Total: 5 minutes**
