# International Expansion Documentation

## Overview

WeddingRingRing supports venues in 16 countries across English-speaking markets, Western Europe, and Nordic regions. Each venue has a country code that determines which phone numbers are purchased for their events.

---

## 🌍 Supported Countries

### **Tier 1: English-Speaking Markets**
Primary markets with mature Twilio infrastructure:

- 🇬🇧 **United Kingdom** (`GB`) - Default
- 🇺🇸 **United States** (`US`)
- 🇨🇦 **Canada** (`CA`)
- 🇦🇺 **Australia** (`AU`)
- 🇳🇿 **New Zealand** (`NZ`)
- 🇮🇪 **Ireland** (`IE`)

### **Tier 2: Western Europe**
Major European markets:

- 🇫🇷 **France** (`FR`)
- 🇩🇪 **Germany** (`DE`)
- 🇪🇸 **Spain** (`ES`)
- 🇮🇹 **Italy** (`IT`)
- 🇳🇱 **Netherlands** (`NL`)
- 🇧🇪 **Belgium** (`BE`)

### **Tier 3: Nordic Countries**
Scandinavian markets:

- 🇸🇪 **Sweden** (`SE`)
- 🇳🇴 **Norway** (`NO`)
- 🇩🇰 **Denmark** (`DK`)
- 🇫🇮 **Finland** (`FI`)

---

## 🏗️ Database Schema

### Venues Table

```sql
ALTER TABLE venues 
ADD COLUMN country_code TEXT DEFAULT 'GB' 
CHECK (country_code IN (
  'GB', 'US', 'CA', 'AU', 'NZ', 'IE',  -- Tier 1
  'FR', 'DE', 'ES', 'IT', 'NL', 'BE',  -- Tier 2
  'SE', 'NO', 'DK', 'FI'               -- Tier 3
));
```

**Fields:**
- `country` - Display name (e.g., "UK") - legacy
- `country_code` - ISO 3166-1 alpha-2 code (e.g., "GB") - used by Twilio

---

## 🔄 How It Works

### 1. **Venue Creation**

Admin creates venue and selects country:

```typescript
// Form
<select name="countryCode">
  <option value="GB">🇬🇧 United Kingdom</option>
  <option value="US">🇺🇸 United States</option>
  ...
</select>

// Database
INSERT INTO venues (country_code) VALUES ('GB');
```

### 2. **Phone Number Purchase**

When purchasing a number for an event:

```typescript
// API automatically uses venue's country
const { data: event } = await supabase
  .from('events')
  .select('venues!inner(country_code)')
  .eq('id', eventId)
  .single()

const countryCode = event.venues.country_code || 'GB'

// Purchase from Twilio
const numbers = await twilioClient
  .availablePhoneNumbers(countryCode)  // 👈 Uses venue country
  .local
  .list({ limit: 5 })
```

### 3. **Number Assignment**

Event gets a local number in the venue's country:

```
UK Venue → +44 20 XXXX XXXX (GB)
US Venue → +1 555 XXX XXXX (US)
FR Venue → +33 1 XX XX XX XX (FR)
```

---

## 💰 Pricing by Country

### Approximate Twilio Costs (Per Number/Month)

**Tier 1 (English Markets):**
- UK: £1.00
- US: $1.15 (~£0.90)
- CA: CAD 1.00 (~£0.60)
- AU: AUD 2.50 (~£1.30)
- NZ: NZD 2.50 (~£1.20)
- IE: €1.00 (~£0.85)

**Tier 2 (Western Europe):**
- FR, DE, ES, IT, NL, BE: €1.00-2.00 (~£0.85-1.70)

**Tier 3 (Nordic):**
- SE, NO, DK, FI: €2.00-3.00 (~£1.70-2.55)

**Voice Call Minutes:**
- Incoming: £0.01-0.02 per minute (varies by country)

---

## 🧪 Testing

### Test Different Countries

```bash
# Create GB venue
POST /admin/venues
{
  "countryCode": "GB",
  ...
}

# Create US venue
POST /admin/venues
{
  "countryCode": "US",
  ...
}

# Purchase numbers for each
POST /api/events/{gb-event-id}/phone/purchase
→ Returns +44 number

POST /api/events/{us-event-id}/phone/purchase
→ Returns +1 number
```

---

## 📋 Admin Form Changes

### Before:
```
Postcode: [________]
```

### After:
```
Postcode: [________]  Country: [🇬🇧 United Kingdom ▼]
                               Determines phone number country
```

**Helper text:**
> "Determines phone number country for events"

---

## 🔐 Validation

### Database Level
```sql
CHECK (country_code IN ('GB', 'US', 'CA', ...))
```

### Application Level
```typescript
// Only allow supported countries
const SUPPORTED_COUNTRIES = ['GB', 'US', 'CA', ...]

if (!SUPPORTED_COUNTRIES.includes(countryCode)) {
  throw new Error('Country not supported')
}
```

---

## 🚀 Expanding to New Countries

### Adding a New Country

**Step 1: Check Twilio Support**
- Visit Twilio console
- Check if country has voice numbers available
- Note pricing

**Step 2: Update Database**
```sql
ALTER TABLE venues 
DROP CONSTRAINT venues_country_code_check;

ALTER TABLE venues 
ADD CONSTRAINT venues_country_code_check 
CHECK (country_code IN ('GB', 'US', ..., 'NEW_CODE'));
```

**Step 3: Update Countries List**
```typescript
// /src/lib/countries.ts
export const SUPPORTED_COUNTRIES = [
  ...
  { code: 'XX', name: 'New Country', flag: '🏳️', currency: 'EUR' },
]
```

**Step 4: Update Admin Form**
```typescript
<option value="XX">🏳️ New Country</option>
```

**Step 5: Test**
- Create venue in new country
- Purchase number
- Make test call
- Verify greeting/recording

---

## 📊 Files Modified

```
/docs/database-schema.sql
  ✅ Added country_code field to venues

/src/lib/countries.ts
  ✅ Created supported countries list
  ✅ Helper functions for country data

/src/app/admin/venues/create/page.tsx
  ✅ Added country dropdown to form
  ✅ Saves country_code to database

/src/app/api/events/[id]/phone/purchase/route.ts
  ✅ Reads venue's country_code
  ✅ Uses it for Twilio search
  ✅ Returns country in response
```

---

## ✅ What Works

✅ Select venue country during creation  
✅ Store ISO country code in database  
✅ Automatically use correct country for phone numbers  
✅ Purchase local numbers in venue's country  
✅ Validation of supported countries  
✅ 16 countries supported out of the box  
✅ Easy to add more countries  

---

## 🌐 Example Flow

```
1. Venue creates event
   ↓
2. Event saved to database
   ↓
3. Phone number purchased AUTOMATICALLY
   ├─ API reads: event.venues.country_code = 'FR'
   ├─ Twilio search: availablePhoneNumbers('FR')
   └─ Number purchased: +33 1 XX XX XX XX
   ↓
4. Number assigned to event immediately
   ↓
5. Success page shows confirmation
   ↓
6. Event day: Guests call local French number ✅
```

---

**International Expansion Complete!** 🌍

The platform now supports 16 countries with room to grow. Each venue gets phone numbers local to their market, improving guest experience and reducing call costs.
