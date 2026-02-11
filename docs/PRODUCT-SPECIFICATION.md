# WeddingRingRing - Complete Product Specification
## Final Version - Post Review

---

## 🎯 Product Overview

**WeddingRingRing** is an audio guestbook platform for wedding venues. Venues offer vintage rotary phones that guests use to leave voice messages at events. Couples access their messages through a beautiful web dashboard.

**Business Model:**
- Rental: Venues pay £50/event, charge couples £500+
- Owned: Venues buy equipment (£1,299) + £299/year software

**Building to sell on Acquire.com** within 18 months at 3-5x ARR multiple.

---

## 👥 User Types & Permissions

### 1. Admin (You & WRR Staff)
**How they get access:**
- You manually create admin accounts
- Send setup email with password link

**What they can do:**
- ✅ Create venue accounts manually
- ✅ View/edit/deactivate all venues
- ✅ Create events on behalf of venues
- ✅ View/edit/cancel all events
- ✅ Manage phone inventory (CRUD)
- ✅ Basic search (venue name, customer name, date)
- ✅ Receive error alerts via email

**What they see:**
- Admin dashboard with:
  - Venue list (with search)
  - Event list (with search/filters)
  - Phone inventory table
  - Upcoming events requiring attention

---

### 2. Venue (Wedding Venue Staff)
**How they get access:**
- Admin creates their account via form
- Receive email to set password
- Multiple staff can have accounts per venue

**What they can do:**
- ✅ Create events for customers
- ✅ View their events (calendar + list view)
- ✅ Edit upcoming events (not past events)
- ✅ Cancel events
- ✅ View event details (customer names, date, Twilio number, message count)
- ✅ Change password
- ❌ Cannot see access codes
- ❌ Cannot listen to messages
- ❌ Cannot manage phone inventory
- ❌ Cannot edit venue details (must contact admin)

**What they see:**
- Venue dashboard with:
  - Calendar view of events
  - List view of events
  - Event details page
  - Settings (password change only)

**Emails they receive:**
- Event created confirmation
- 1 week before event: "Event approaching"
- 1 day before event: "Program your phone with number: +44..."
- Event completed notification

---

### 3. Customer (End Users - Couples/Hosts)
**How they get access:**
- Venue creates event → enters customer email
- System auto-creates account
- Customer receives email with "Set Password" link
- Can reset password anytime (standard flow)

**ONE account per event** (single email address)

**What they can do:**
- ✅ Login with email + password
- ✅ View their event
- ✅ Upload custom greeting (MP3 or record in browser)
- ✅ Listen to messages
- ✅ Add caller names ("Uncle Bob")
- ✅ Add notes to messages
- ✅ Mark messages as favorite ❤️
- ✅ Tag messages (family, friends, funny, emotional, etc.)
- ✅ Delete messages (soft delete to trash)
- ✅ Restore from trash
- ✅ Empty trash permanently
- ✅ Download individual messages
- ✅ Download all as ZIP
- ✅ Download all as one MP3
- ✅ Create highlight reel (favorites stitched together)
- ✅ Share messages via native share (WhatsApp, email, etc.)

**What they see:**
- Customer dashboard with:
  - Event title (e.g., "Sarah & James's Wedding")
  - Stats (total messages, new, favorites, duration)
  - Message library (grid/list view)
  - Filter options (all/new/favorites/trash)
  - Sort options (date/time, duration, caller name)
  - Greeting upload interface

**Emails they receive:**
- Account created (set password link)
- Greeting upload reminder (1 week + 3 days before event)
- Event day email ("Today's the big day!")
- Post-event email (1 day after: "You received X messages - listen here")

---

## 📋 Event Types & Display

### Event Types Available:
1. **Wedding**
   - Fields: Bride name, Groom name (or Partner 1/2)
   - Display: "Sarah & James's Wedding"
   - Greeting: "Welcome to Sarah and James's wedding..."

2. **Birthday**
   - Fields: Birthday person name, Age (optional)
   - Display: "Steve's 40th Birthday"
   - Greeting: "Welcome to Steve's birthday party..."

3. **Christening**
   - Fields: Child's name
   - Display: "Emma's Christening"
   - Greeting: "Welcome to Emma's christening..."

4. **Anniversary**
   - Fields: Couple names, Years together (optional)
   - Display: "John & Mary's 25th Anniversary"
   - Greeting: "Welcome to John and Mary's anniversary celebration..."

5. **Corporate**
   - Fields: Company name, Event purpose
   - Display: "[Company Name] Event"
   - Greeting: "Welcome to our event..."

6. **Other**
   - Fields: Custom event title
   - Display: Custom title
   - Greeting: "Welcome to [custom title]..."

---

## 🎤 Greeting System

### Two-Tier Greeting:

**Tier 1: Text-to-Speech (Default)**
- Auto-generated immediately when event is created
- Stored in `greeting_text` field
- Examples:
  - "Welcome to Sarah and James's wedding. Please leave a message after the beep!"
  - "Welcome to Steve's birthday party. Please leave a message after the beep!"
- Twilio Text-to-Speech reads this

**Tier 2: Custom Audio (Optional Override)**
- Customer can upload MP3 or record in browser
- Stored in `greeting_audio_url` field
- Requirements:
  - MP3 format only (for uploads)
  - Max 10 MB file size
  - Max 60 seconds duration
  - Browser recording auto-converts to MP3
- Features:
  - Preview player after upload
  - "Are you happy with quality?" confirmation
  - Can re-record/re-upload anytime before event
  - Reminder emails if not uploaded (1 week + 3 days before)

**Workflow:**
1. Event created → Text greeting active immediately
2. Customer logs in → Can upload audio greeting
3. Previews and confirms quality
4. Once uploaded → Audio overrides text
5. Encouraged to do test call before event (in reminder email)

---

## 📞 Twilio Number Architecture

### Purchase & Lifecycle:

**When:** Immediately when event is created

**How:**
1. Call Twilio API to search UK numbers
2. For each available number:
   - Check `was_number_previously_owned(number)`
   - If in history, skip
   - If clean, purchase it
3. Store in `events.twilio_phone_number`
4. Add to `twilio_number_history` table
5. Configure webhooks

**Active Period:**
- Purchased immediately
- Active through event
- Released 37 days after event date (1 month + 1 week buffer)

**Release:**
- Automated daily cron job
- Checks `twilio_number_release_scheduled_for`
- Releases numbers due for release
- Updates `twilio_number_released_at`

**Cancellation:**
- If event cancelled → Release immediately
- Updates release schedule to NOW()

**Costs:**
- $1/month per number (~£0.80)
- Event created 1 month before → $2 cost
- Acceptable for £50 revenue per event

---

## 💬 Message Recording Flow

### Guest at Venue:
1. Picks up pink phone
2. Presses speed dial button 1
3. Calls Twilio number (e.g., +441234567890)
4. Twilio webhook → POST /api/twilio/incoming
5. Looks up event by `To` number
6. Returns TwiML:
   ```xml
   <Response>
     <Play>https://supabase.../greeting.mp3</Play>
     <!-- OR if no audio: -->
     <Say voice="Polly.Amy">{greeting_text}</Say>
     <Record maxLength="240" recordingStatusCallback="/api/twilio/recording" />
   </Response>
   ```
7. Guest hears greeting
8. Leaves message (max 4 minutes)
9. Twilio saves recording

### Recording Complete:
1. Twilio webhook → POST /api/twilio/recording
2. Backend downloads MP3 from Twilio
3. Uploads to Supabase Storage
4. Saves to `messages` table:
   - `event_id` (from Twilio number lookup)
   - `recording_url` (Supabase URL)
   - `twilio_recording_url` (backup, expires after 90 days)
   - `duration`
   - `recorded_at`
5. Message appears in customer dashboard

### Remote Guest:
- Same flow, just calls from their own phone
- Uncle Bob dials +441234567890 from home
- Same experience as venue guests

---

## 🗂️ Message Organization

### Customer Features:

**Caller Names:**
- Click message → Type name (e.g., "Uncle Bob")
- Saves to `caller_name` field

**Notes:**
- Add personal notes (e.g., "He was so drunk 😂")
- Saves to `notes` field

**Tags (Multi-select):**
- Family
- Friends
- Funny
- Emotional
- Heartfelt
- Work colleagues
- Surprise
- Drunk 😂
- Kids

**Favorites:**
- Click ❤️ to mark favorite
- Used for highlight reel

**Delete/Trash:**
- Delete → Moved to trash (`is_deleted = true`)
- Can restore from trash anytime
- "Empty Trash" permanently deletes
- Trash persists until manually emptied

**Sorting:**
- Date/Time (newest first - default)
- Duration (longest first)
- Caller name (alphabetical)

**Filtering:**
- All messages
- New (unheard)
- Favorites
- Trash

---

## 📥 Download & Export Options

### 1. Download Individual
- Click download icon
- Gets single MP3 file

### 2. Download All (ZIP)
- All messages as separate MP3 files
- Zipped together
- Filename: `[event-name]-messages.zip`

### 3. Download All as One MP3
- All messages stitched chronologically
- Single MP3 file
- Filename: `[event-name]-complete.mp3`

### 4. Create Highlight Reel
- Only favorited messages
- Stitched chronologically
- No music, no pauses
- Just raw audio combined
- Filename: `[event-name]-highlights.mp3`

### 5. Share Individual
- Native device share sheet
- Customer picks: WhatsApp, Email, Messages, etc.
- Shares MP3 file directly
- No link generation, no expiry

---

## 🔔 Notification System

### Admin Notifications (Errors Only):
- **Email:** admin@weddingringring.com
- **Triggers:**
  - Twilio number purchase failed
  - Greeting upload to Twilio failed (after 3 retries)
  - Message recording webhook failed (after 3 retries)
  - Email sending failed (after 3 retries)

### Venue Notifications:
- **Event created:** Confirmation with details
- **1 week before:** "Event approaching" reminder
- **1 day before:** "Program your phone with: +44..." + instructions
- **Event completed:** "Event finished, messages available"

### Customer Notifications:
- **Account created:** Set password link + event details
- **Greeting reminder #1:** 1 week before event
- **Greeting reminder #2:** 3 days before event
- **Event day:** "Today's the big day!"
- **Post-event:** "You received X messages - listen here [link]"

---

## ⚙️ Error Handling

### 1. Twilio Number Purchase Fails
- **Action:** Create event anyway (text greeting active)
- **Retry:** Background job retries purchase
- **Alert:** Email admin immediately

### 2. Greeting Upload to Twilio Fails
- **Action:** Text greeting remains active as backup
- **Retry:** 3 attempts with delays
- **Alert:** Email customer + admin after retries fail
- **Customer Action:** Can try re-uploading

### 3. Message Recording Webhook Fails
- **Action:** Recording exists on Twilio but not in system
- **Retry:** 3 attempts
- **Alert:** Email admin with recording details
- **Admin Action:** Manually recover from Twilio

### 4. Email Sending Fails
- **Action:** Account created but email bounced
- **Retry:** 3 attempts
- **Alert:** Email admin, flag account
- **Admin Action:** Manually contact customer or resend

---

## 🛡️ Data & Privacy

### Data Retention:
- **Messages:** Keep forever (never auto-delete)
- **Customer accounts:** Keep forever (even if never activated)
- **Deactivated venues:** Keep data forever (historical records)

### GDPR Right to be Forgotten:
- Customer requests deletion
- Delete account + all messages from Supabase
- Twilio recordings auto-expire after 90 days
- Document this in privacy policy

### Account Deactivation:
- **Venues:** Deactivate, don't delete
  - Set `is_active = false`
  - Cancel future events
  - Past events + customer access preserved
- **Customers:** Auto-deactivate when event cancelled before event date
  - Can be reactivated if venue uses email again

---

## 📊 Phone Inventory

### Simple Admin-Only Tracking:

**Fields:**
- Serial number
- IMEI
- SIM number
- SIM provider (EE, Vodafone, O2, Three)
- Color
- Model (default: Opis 60s Mobile)
- Status (available, in_use, maintenance, retired)
- Assigned to venue
- Purchase date
- Notes

**Purpose:** Boring inventory management only
- Not integrated into event creation
- Admin tracks: "Thornbury has 1 pink phone"
- No complex logic needed

---

## 🌐 Technical Architecture

### Domain:
- weddingringring.com

### Hosting:
- **Frontend/Backend:** Vercel (Next.js 14)
- **Database/Auth/Storage:** Supabase
- **Telephony:** Twilio
- **Email:** Resend

### File Storage:
- **Greeting audio:** Supabase Storage
- **Message recordings:** Supabase Storage (permanent)
- **Backup:** Twilio (90 days)

### Timezone:
- **Database:** UTC (all timestamps)
- **Display:** UK timezone (GMT/BST auto-switching)
- **Scope:** UK-only for now

### Email Addresses:
- **From:** hello@weddingringring.com
- **Reply-to:** support@weddingringring.com
- **Admin alerts:** admin@weddingringring.com

---

## 🚨 Risk Mitigations

### 1. Twilio Cost Management
- **Risk:** Numbers purchased months in advance waste money
- **Accepted:** Purchase immediately for simplicity
- **Monitor:** Admin can manually check costs

### 2. Duplicate Event Detection
- **Risk:** Venue creates same event twice
- **Solution:** Warning if same date exists: "You already have an event on this date. Continue anyway?"

### 3. Venue Deactivation with Upcoming Events
- **Risk:** Venue deactivated, but has events next week
- **Solution:** Admin sees list of upcoming events before confirming deactivation
- **Decision:** Admin manually decides what to do with them

### 4. Number Release Buffer
- **Risk:** Number released too early, guests can't call
- **Solution:** 37-day buffer instead of 30 days (1 month + 1 week)

### 5. Customer Greeting Quality
- **Risk:** Poor quality upload, bad guest experience
- **Solution:** 
  - Preview player after upload
  - Confirmation: "Are you happy with this quality?"
  - Encourage test call in reminder email

### 6. Browser Recording Support
- **Risk:** Old browsers don't support MediaRecorder API
- **Solution:**
  - Feature detection before showing record button
  - Fallback to "Upload MP3 instead"
  - Clear error messages

---

## 🎨 Brand & Design

### Colors (Tailwind Config):
- `cream`: #FFF8F0 (backgrounds)
- `sage`: #8B9B8E (secondary)
- `sage-light`: Lighter sage variant
- `sage-dark`: Darker sage variant
- `deep-green`: #3D5A4C (primary, buttons)
- `deep-green-dark`: Darker variant
- `rose`: #D4A5A5 (accents)
- `rose-light`: Lighter rose
- `rose-dark`: Darker rose
- `gold`: #C9A961 (highlights)
- `gold-light`: Lighter gold
- `charcoal`: #2C2C2C (text)

### Typography:
- Headings: Playfair Display (serif)
- Body: DM Sans (sans-serif)

### Logo:
- Green sage color palette
- Transparent background
- Rotary phone illustration

---

## 📝 Database Summary

### Core Tables:
1. **profiles** - All users (admin, venue, customer)
2. **venues** - Wedding venue businesses
3. **phones** - Physical phone inventory
4. **events** - Individual event bookings
5. **messages** - Voice recordings
6. **twilio_number_history** - Numbers to avoid repurchasing
7. **analytics_events** - Usage tracking

### Key Relationships:
```
profiles (admin) → creates → venues
profiles (venue) → creates → events
profiles (customer) ← linked ← events
events → has many → messages
venues → has many → phones (inventory only)
```

### Security:
- Row Level Security (RLS) on all tables
- Customers see only their data
- Venues see only their data
- Admins see everything
- Enforced at database level

---

## ✅ MVP Scope

### Phase 1 (Launch):
**Must Have:**
- ✅ Admin dashboard (create venues, create events, manage phones)
- ✅ Venue dashboard (create events, view events calendar/list)
- ✅ Customer dashboard (listen, organize, download messages)
- ✅ Twilio integration (purchase numbers, record messages)
- ✅ Email system (all notifications)
- ✅ Greeting upload (MP3 + browser recording)
- ✅ Message organization (names, notes, tags, favorites)
- ✅ Trash/restore system
- ✅ Download options (individual, ZIP, all-as-one, highlight reel)
- ✅ Native share

**Nice to Have (Phase 2):**
- Analytics dashboard
- Financial reporting
- Automated invoicing
- Customer feedback system
- A/B testing greetings
- Message transcription (AI)
- Highlight reel with music

---

## 🎯 Success Metrics

### For Sale on Acquire.com:
- **Target:** 3-5x ARR multiple
- **Timeline:** 18 months
- **Revenue Goal:** £100k-200k ARR = £300k-1M sale price

### Key Metrics to Track:
- MRR/ARR
- Number of active venues
- Events per month
- Messages recorded (total)
- Customer retention (do couples download their messages?)
- Venue churn rate
- Twilio costs vs. revenue

---

## 🚀 Implementation Priority

### Week 1-2: Core Infrastructure
1. Database setup (run schema)
2. Supabase authentication
3. Twilio account + test number
4. Resend email setup
5. Basic admin dashboard

### Week 3-4: Event Flow
1. Admin creates venue accounts
2. Venue creates events
3. Twilio number purchase API
4. Customer account creation
5. Welcome emails

### Week 5-6: Recording & Playback
1. Twilio incoming call webhook
2. Twilio recording webhook
3. Download → Upload → Save pipeline
4. Customer dashboard
5. Audio player

### Week 7-8: Features & Polish
1. Greeting upload system
2. Message organization (tags, notes, favorites)
3. Download/export options
4. Trash system
5. Email reminders

### Week 9-10: Testing & Launch
1. End-to-end testing
2. Error handling
3. Email templates
4. Deploy to production
5. First test event

---

This specification represents the complete, finalized design based on comprehensive review. All decisions are locked in and ready for implementation.
