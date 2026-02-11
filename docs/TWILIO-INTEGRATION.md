# Twilio Integration Documentation

## Overview

WeddingRingRing uses Twilio for voice call handling and phone number management. Each event gets a unique phone number that guests call to leave messages.

---

## 🎯 Key Components

### 1. **Phone Number Management**
- Purchase numbers automatically when event created
- Assign unique number to each event
- Auto-release 37 days after event date
- Manual release option for cancelled events

### 2. **Voice Call Handling**
- Play custom or auto-generated greeting
- Record messages (up to 4 minutes)
- Save to Supabase Storage
- Create database records

### 3. **Webhooks**
- `/api/twilio/voice` - Handle incoming calls
- `/api/twilio/recording` - Save completed messages
- `/api/twilio/status` - Track call status

---

## 📞 Phone Number Lifecycle

```
Event Created
  ↓
Purchase Number (POST /api/events/{id}/phone/purchase)
  ├─ Search available numbers in GB
  ├─ Purchase first available
  ├─ Configure webhooks
  ├─ Save to event record
  └─ Calculate release date (event_date + 37 days)
  ↓
Event Day - Number Active
  ├─ Guests call number
  ├─ Greeting plays
  └─ Messages recorded
  ↓
37 Days After Event
  ↓
Auto-Release (Cron: /api/cron/cleanup-phones)
  ├─ Release from Twilio
  ├─ Mark as released in database
  └─ Stop billing
```

---

## 💰 Pricing (UK Numbers)

**Phone Numbers:**
- £1/month per number
- Example: 10 active events = £10/month

**Voice Calls:**
- Incoming: £0.013/minute
- Example: 100 messages × 2 min avg = £2.60

**Total Cost Example:**
- 10 events/month × £1 = £10
- 500 messages × 2 min × £0.013 = £13
- **Total: ~£23/month**

---

## 🔧 Files Created

```
/src/app/api/
├── events/[id]/phone/
│   ├── purchase/route.ts    ✅ Purchase number
│   └── release/route.ts     ✅ Release number
├── twilio/
│   ├── voice/route.ts       ✅ Handle calls
│   ├── recording/route.ts   ✅ Save messages
│   └── status/route.ts      ✅ Track call status
└── cron/
    └── cleanup-phones/
        └── route.ts          ✅ Auto-release expired numbers

/vercel.json                  ✅ Cron configuration (daily 2am)
```

---

## ✅ What's Complete

✅ Purchase phone numbers via API  
✅ Configure webhooks automatically  
✅ Handle incoming calls with TwiML  
✅ Play custom or auto-generated greetings  
✅ Record messages (max 4 minutes)  
✅ Download from Twilio + upload to Supabase  
✅ Create database records  
✅ Manual number release  
✅ Automatic cleanup cron (37 days after event)  
✅ Release date calculation  
✅ Call status tracking  

---

**Twilio Integration Complete!** 🎉

See full documentation in this file for:
- API endpoints
- Voice call flow
- Testing guide
- Security notes
- Deployment checklist
