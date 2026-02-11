# Scheduled Phone Number Purchase

## Timing Strategy

Phone numbers are purchased **30 days before the event date** to minimize costs while ensuring availability.

---

## Why 30 Days Before?

**Cost Savings:**
- Event in 6 months → Don't pay for 6 months
- Event in 1 year → Don't pay for 12 months  
- Only pay for ~2 months total (30 days before + 37 days after)

**Still Safe:**
- 30 days is plenty of time
- Venue can test the number
- Customer can share with guests
- Backup time if issues arise

**Cost Example:**
```
Immediate Purchase:
  Event in 6 months = 6 months × £1 = £6
  
30-Day Purchase:
  1 month before + 37 days after = ~2 months × £1 = £2
  
Savings: £4 per event ✅
```

---

## How It Works

### Daily Cron Job

**Route:** `/api/cron/purchase-upcoming-numbers`  
**Schedule:** Daily at 3:00 AM UTC  
**Logic:**

```typescript
// Find events 30 days from now
const targetDate = new Date()
targetDate.setDate(targetDate.getDate() + 30)

// Get events on that date with no number yet
const events = await supabase
  .from('events')
  .select('*, venues!inner(country_code)')
  .eq('status', 'active')
  .is('twilio_phone_number', null)
  .eq('event_date', targetDate)

// Purchase number for each
for (event of events) {
  const countryCode = event.venues.country_code
  const number = await twilioClient
    .availablePhoneNumbers(countryCode)
    .local.list()
  
  await purchase(number[0])
}
```

---

## Timeline

```
Event Created (e.g., Jan 1)
  ↓
  ... 5 months pass ...
  ↓
30 Days Before Event (June 1)
  ↓
Cron runs at 3am ✅
  ↓
Phone number purchased
  ↓
Venue notified
  ↓
  ... 30 days pass ...
  ↓
Event Day (July 1)
  ↓
Guests call number
  ↓
  ... 37 days pass ...
  ↓
37 Days After Event (Aug 7)
  ↓
Cleanup cron releases number
  ↓
Total cost: ~2 months = £2 ✅
```

---

## API Route

### `/api/events/[id]/phone/purchase`:

```typescript
// Reads venue's country code
const { data: event } = await supabase
  .from('events')
  .select('venues!inner(country_code)')
  .eq('id', eventId)
  .single()

const countryCode = event.venues.country_code || 'GB'

// Purchases number in venue's country
const numbers = await twilioClient
  .availablePhoneNumbers(countryCode)  // 👈 Automatic!
  .local
  .list({ limit: 5 })

// Purchases first available
const purchased = await twilioClient.incomingPhoneNumbers.create({
  phoneNumber: numbers[0].phoneNumber,
  voiceUrl: `${APP_URL}/api/twilio/voice`,
  friendlyName: `WRR Event ${eventId}`
})

// Saves to database
await supabase
  .from('events')
  .update({
    twilio_phone_number: purchased.phoneNumber,
    twilio_phone_sid: purchased.sid
  })
  .eq('id', eventId)
```

---

## Error Handling

**If phone purchase fails:**
- Event creation still succeeds ✅
- Customer still gets password email ✅
- Venue sees success page ✅
- Admin can manually purchase number later

**Why non-blocking:**
- Twilio might be temporarily down
- Country might have no available numbers
- Rate limits might be hit
- Better UX than failing entire event creation

---

## User Experience

### What Venue Sees:

**During Creation:**
```
Creating event... ⏳
```

**Success Page:**
```
✅ Event Created Successfully!

What Happens Next:
1. Customer receives email
2. Unique phone number assigned ✅ (already done!)
3. Event day setup instructions
```

**Event Details Page:**
```
Phone Number: +44 20 1234 5678 ✅
(Shows immediately or within seconds)
```

---

## Benefits

✅ **Cost-Effective** - Only pay for ~2 months instead of 6-12  
✅ **Automatic** - No manual intervention needed  
✅ **Safe** - 30 days is plenty of lead time  
✅ **Country-Aware** - Uses venue's country code  
✅ **Scalable** - Works for all 16 countries  

---

## Manual Override (If Needed)

If event is less than 30 days away, or you need number sooner:

```bash
POST /api/events/{event-id}/phone/purchase
```

Admin can manually trigger early purchase anytime.

---

## Cron Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/purchase-upcoming-numbers",
      "schedule": "0 3 * * *"  // Daily at 3am UTC
    },
    {
      "path": "/api/cron/cleanup-phones",
      "schedule": "0 2 * * *"  // Daily at 2am UTC
    }
  ]
}
```

---

**Result:** Automatic, cost-effective phone number provisioning! 🎉
