# User Roles & Permissions Guide

## Overview

WeddingRingRing has three distinct user types, each with specific permissions and access levels.

## The Three User Types

### 1. Admin (You & WRR Staff)
**Role:** `admin`

**Who:** 
- You (the owner)
- WRR staff members
- Support team

**What they can do:**
- ✅ View ALL venues
- ✅ View ALL events
- ✅ View ALL messages
- ✅ Approve/reject events
- ✅ Manage Twilio numbers
- ✅ View analytics across all venues
- ✅ Create/edit/delete venues
- ✅ Manage subscriptions
- ✅ View financial data
- ✅ Access admin dashboard

**Dashboard Features:**
```
Admin Dashboard:
├── Venue Management
│   ├── All venues list
│   ├── Subscription status
│   ├── Revenue per venue
│   └── Add/edit venues
├── Event Oversight
│   ├── Pending approvals
│   ├── Active events
│   ├── Completed events
│   └── Event details
├── Financial Reports
│   ├── MRR/ARR
│   ├── Revenue by venue
│   ├── Churn rate
│   └── Payment status
├── Twilio Management
│   ├── Number inventory
│   ├── Number history
│   ├── Usage costs
│   └── Release scheduler
└── System Analytics
    ├── Total messages
    ├── User growth
    ├── Platform metrics
    └── Support tickets
```

---

### 2. Venue (Wedding Venue Staff)
**Role:** `venue`

**Who:**
- Venue owners
- Venue managers
- Wedding coordinators at venues
- Venue staff authorized to book events

**What they can do:**
- ✅ View THEIR venue details
- ✅ View THEIR venue's events only
- ✅ Create new events for their venue
- ✅ Edit their venue's events
- ✅ Manage their phone inventory
- ✅ View messages for their events (optional - might disable)
- ✅ Update venue contact info
- ✅ View their financial summary
- ❌ Cannot see other venues
- ❌ Cannot see platform-wide data
- ❌ Cannot approve their own events (if approval required)

**Dashboard Features:**
```
Venue Dashboard:
├── Events Calendar
│   ├── Upcoming events
│   ├── Today's events
│   ├── Past events
│   └── Create new event
├── Event Management
│   ├── Event details
│   ├── Couple contact info
│   ├── Status tracking
│   ├── Twilio number assigned
│   └── Access code for couple
├── Phone Inventory
│   ├── Available phones
│   ├── Phones in use
│   ├── Phone maintenance
│   └── SIM card numbers
├── Venue Settings
│   ├── Contact details
│   ├── Address
│   ├── Subscription status
│   └── Billing info
└── Reports
    ├── Events this month
    ├── Revenue summary
    ├── Message volume
    └── Customer feedback
```

---

### 3. Couple (End Users - Better Name Options Below)
**Role:** `couple`

**Better Name Options:**
- **"Guest"** - Generic, works for all event types
- **"Client"** - Professional but impersonal
- **"Couple"** - Specific to weddings (your main market)
- **"User"** - Too technical
- **"Member"** - Implies membership program

**Recommendation:** Keep **"couple"** in code, but use **"Guest"** in UI for non-wedding events.

**Who:**
- Couples getting married
- Anniversary celebrants
- Birthday party hosts
- Corporate event organizers

**What they can do:**
- ✅ View THEIR event only
- ✅ Listen to THEIR messages only
- ✅ Download their messages
- ✅ Add names to messages ("Uncle Bob")
- ✅ Add notes to messages
- ✅ Mark messages as favorite
- ✅ Filter/sort messages
- ✅ Share messages (email, social)
- ✅ View who called when
- ✅ See message statistics
- ❌ Cannot see other events
- ❌ Cannot see venue admin stuff
- ❌ Cannot edit event details
- ❌ Cannot see financial info

**Dashboard Features:**
```
Couple Dashboard:
├── Message Library
│   ├── All messages grid/list
│   ├── Play audio inline
│   ├── Download individual
│   ├── Download all (ZIP)
│   └── Share to email/social
├── Message Organization
│   ├── Add caller names
│   ├── Add personal notes
│   ├── Mark as favorite ❤️
│   ├── Tag messages
│   └── Search/filter
├── Event Details
│   ├── Event date
│   ├── Venue name
│   ├── Total messages
│   ├── Total duration
│   └── Most active time
├── Sharing Features
│   ├── Create highlight reel
│   ├── Email to friends/family
│   ├── Social media share
│   └── Generate QR code
└── Account
    ├── Contact info
    ├── Access code
    ├── Download history
    └── Storage usage
```

---

## User Registration Flows

### Admin Users
```
1. You manually create admin accounts
2. Send invitation email
3. Admin sets password
4. Gets full platform access
```

### Venue Users
```
1. Venue signs up via website (/venue page)
2. Fills in business details
3. Enters contact info
4. Chooses subscription plan
5. Email verification
6. Account pending approval (you approve)
7. Once approved, can create events
```

### Couple Users
```
Option A: Pre-Registration (Venue enters info)
1. Venue creates event
2. Enters couple's names, emails, phones
3. System generates access code
4. System emails couple the access code
5. Couple clicks link → Sets password
6. Can now access dashboard

Option B: Access Code Only (No registration)
1. Venue creates event
2. System generates access code
3. Venue gives code to couple
4. Couple goes to website
5. Enters access code → Sees dashboard
6. No account needed!
```

**Recommendation:** Start with Option B (simpler), add Option A later if couples want accounts.

---

## Contact Information Requirements

### Admin Profile
```sql
profiles (role='admin'):
├── email ✅ Required
├── full_name ✅ Required
├── phone ✅ Recommended
└── avatar_url ⚪ Optional
```

### Venue Profile + Business Info
```sql
profiles (role='venue'):
├── email ✅ Required (login)
├── full_name ✅ Required
├── phone ✅ Required (support contact)
└── avatar_url ⚪ Optional

venues:
├── name ✅ Required
├── address ✅ Required (full address fields)
├── primary_contact_name ✅ Required
├── primary_contact_email ✅ Required
├── primary_contact_phone ✅ Required
├── secondary_contact_name ⚪ Optional
├── secondary_contact_email ⚪ Optional
├── secondary_contact_phone ⚪ Optional
├── website ⚪ Optional
├── instagram_handle ⚪ Optional
├── company_number ⚪ Optional (for invoicing)
└── vat_number ⚪ Optional (for invoicing)
```

### Couple Profile (If They Register)
```sql
profiles (role='couple'):
├── email ✅ Required
├── full_name ✅ Required
├── phone ⚪ Optional
└── avatar_url ⚪ Optional

events (stores couple info even if not registered):
├── partner_1_name ✅ Required
├── partner_1_email ✅ Required
├── partner_1_phone ⚪ Recommended
├── partner_2_name ⚪ Optional
├── partner_2_email ⚪ Optional
└── partner_2_phone ⚪ Optional
```

---

## Permission Matrix

| Action | Admin | Venue | Couple |
|--------|-------|-------|--------|
| View all venues | ✅ | ❌ | ❌ |
| View own venue | ✅ | ✅ | ❌ |
| Edit venue details | ✅ | ✅ (own) | ❌ |
| View all events | ✅ | ❌ | ❌ |
| View venue's events | ✅ | ✅ | ❌ |
| View own event | ✅ | ✅ | ✅ |
| Create event | ✅ | ✅ | ❌ |
| Approve event | ✅ | ❌ | ❌ |
| Edit event | ✅ | ✅ (own) | ❌ |
| View all messages | ✅ | ❌ | ❌ |
| View venue's messages | ✅ | ✅ | ❌ |
| View own messages | ✅ | ✅ | ✅ |
| Download messages | ✅ | ⚪ | ✅ |
| Add message names/notes | ✅ | ⚪ | ✅ |
| Manage Twilio numbers | ✅ | ❌ | ❌ |
| View financials (all) | ✅ | ❌ | ❌ |
| View financials (own) | ✅ | ✅ | ❌ |
| Manage subscriptions | ✅ | ⚪ | ❌ |

**Legend:** ✅ Yes | ❌ No | ⚪ Optional/Configurable

---

## Row Level Security (RLS) Implementation

The database automatically enforces these rules:

### Venues Table
```sql
-- Venue owners can only see their venue
WHERE auth.uid() = venue.owner_id

-- Admins can see all venues
OR user.role = 'admin'
```

### Events Table
```sql
-- Couples see their event
WHERE auth.uid() = event.couple_id

-- Venues see their events
OR auth.uid() IN (
  SELECT owner_id FROM venues WHERE id = event.venue_id
)

-- Admins see all
OR user.role = 'admin'
```

### Messages Table
```sql
-- Couples see their messages
WHERE event_id IN (
  SELECT id FROM events WHERE couple_id = auth.uid()
)

-- Venues see their event messages
OR event_id IN (
  SELECT e.id FROM events e
  JOIN venues v ON v.id = e.venue_id
  WHERE v.owner_id = auth.uid()
)

-- Admins see all
OR user.role = 'admin'
```

This means the database automatically filters data based on who's logged in. No manual permission checks needed in your code!

---

## Authentication Flows

### Admin Login
```
1. Go to /admin/login
2. Enter email + password
3. Supabase checks credentials
4. Redirect to /admin/dashboard
```

### Venue Login
```
1. Go to /venue/login
2. Enter email + password
3. Supabase checks credentials
4. Check role = 'venue'
5. Redirect to /venue/dashboard
```

### Couple Login (Two Options)

**Option 1: Access Code Only**
```
1. Go to /dashboard
2. Enter 8-character access code
3. System looks up: SELECT * FROM events WHERE access_code = 'ABC12345'
4. Show dashboard (no login required)
5. Store code in session/cookie
```

**Option 2: Full Account**
```
1. Go to /login
2. Enter email + password
3. Supabase checks credentials
4. Load events: WHERE couple_id = user.id
5. Redirect to /dashboard
```

---

## Contact Info Collection Points

### Venue Signup
```
Form fields:
├── Business name
├── Your name
├── Email (becomes login)
├── Phone
├── Address (autocomplete)
├── Website (optional)
├── How many weddings/year?
└── Subscription preference
```

### Event Creation (Venue Creates)
```
Couple Details:
├── Partner 1 name ✅
├── Partner 1 email ✅
├── Partner 1 phone (recommended)
├── Partner 2 name
├── Partner 2 email
├── Partner 2 phone

Event Details:
├── Event date ✅
├── Event time
├── Location at venue
├── Expected guest count
├── Special requirements
```

### Couple Registration (Optional)
```
If couple wants account:
├── Email (pre-filled from event)
├── Create password
├── Phone (optional)
└── Profile photo (optional)
```

---

## Notifications & Communications

### Admin Notifications
- New venue signup (email)
- Event pending approval (email + dashboard)
- Payment received (email)
- Twilio number release errors (email)

### Venue Notifications
- Account approved (email)
- New event created (email confirmation)
- Event approaching (email 1 week before)
- Event completed (email + request feedback)
- Subscription renewal (email)

### Couple Notifications
- Access code sent (email)
- New message recorded (email/SMS optional)
- Event completed (email with download link)
- Feedback request (email 1 week after)

---

## Summary

**Three user types:**
1. **Admin** - Full platform access (you & staff)
2. **Venue** - Manage their venue & events only
3. **Couple** - View their event & messages only

**Key principle:** Each user sees ONLY their data, enforced by database-level security.

**Contact info strategy:** Collect minimum required info at signup, can update later. Couples don't need accounts - access codes work great for simplicity.

**Recommendation for naming:** Use **"couple"** in database/code, but display as **"Guest Access"** or **"Client Portal"** in UI for flexibility with non-wedding events.
