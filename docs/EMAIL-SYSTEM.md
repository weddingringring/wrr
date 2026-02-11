# Email System Documentation

## Overview

WeddingRingRing uses **Resend** + **React Email** for sending branded, transactional HTML emails.

**Email Service:** Resend  
**Template Engine:** React Email  
**Total Emails:** 8 templates  

---

## 📧 Email Inventory

### Customer Emails (4)

| # | Email | Trigger | Subject |
|---|-------|---------|---------|
| 1 | Customer Welcome | Event created | `Welcome to WeddingRingRing - Your {event_type} is Ready!` |
| 2 | Phone Assigned | Phone purchased (30 days before) | `Your WeddingRingRing Phone Number is Ready!` |
| 3 | Password Reset | User requests reset | `Reset Your WeddingRingRing Password` |
| 7 | Day-After Summary | 1 day after event | `{X} Messages from Your {event_type}! 🎉` |

### Venue Emails (3)

| # | Email | Trigger | Subject |
|---|-------|---------|---------|
| 4 | Event Notification | Event created | `Event Created - {names}'s {event_type}` |
| 5 | Event Reminder | 1 day before event | `Event Tomorrow - Setup Required` |
| 6 | Phone Ready | Phone purchased (30 days before) | `Phone Number Ready - Setup Required` |

### Admin Emails (1)

| # | Email | Trigger | Subject |
|---|-------|---------|---------|
| 8 | Critical Error | System error | `🚨 Critical Error - {error_type}` |

---

## 🎨 Brand Design

All emails feature:
- **WeddingRingRing logo** (text-based heading)
- **Color palette:** Deep Green (#2D5016), Sage (#87A878), Cream (#FAF8F3)
- **Typography:** Crimson Text serif for headings, sans-serif for body
- **Mobile responsive** layout
- **Inline CSS** for email client compatibility

**Layout Structure:**
```
┌────────────────────┐
│  Logo (Header)     │
├────────────────────┤
│                    │
│  Content           │
│  - Greeting        │
│  - Details         │
│  - CTA Button      │
│                    │
├────────────────────┤
│  Footer            │
│  - Support info    │
└────────────────────┘
```

---

## 📂 File Structure

```
/src
├── emails/
│   ├── components/
│   │   └── EmailLayout.tsx          # Base layout + shared styles
│   ├── customer-welcome.tsx         # Email #1
│   ├── phone-assigned.tsx           # Email #2
│   ├── password-reset.tsx           # Email #3
│   ├── venue-notification.tsx       # Email #4
│   ├── venue-reminder.tsx           # Email #5
│   ├── venue-phone-ready.tsx        # Email #6
│   ├── day-after-summary.tsx        # Email #7
│   └── critical-error.tsx           # Email #8
├── lib/
│   ├── email.ts                     # Resend utility (sendEmail)
│   └── email-helpers.ts             # Helper functions
└── app/api/cron/
    ├── purchase-upcoming-numbers/   # Sends #2, #6
    ├── send-event-reminders/        # Sends #5
    └── send-day-after-summary/      # Sends #7
```

---

## 🔧 Setup Instructions

### 1. Install Dependencies

```bash
npm install resend react-email @react-email/components
```

### 2. Environment Variables

Add to `.env.local`:

```env
# Resend API Key (get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxx

# Base URL for links in emails
NEXT_PUBLIC_BASE_URL=https://weddingringring.com

# Cron job secret (for securing cron endpoints)
CRON_SECRET=your-random-secret-here
```

### 3. Resend Account Setup

1. Sign up at https://resend.com
2. Verify your sending domain
3. Generate API key
4. Add to environment variables

**Free Tier:**
- 3,000 emails/month
- 100 emails/day
- Perfect for MVP

---

## 🚀 Usage

### Sending Emails Directly

```typescript
import { sendEmail } from '@/lib/email'
import CustomerWelcomeEmail from '@/emails/customer-welcome'

await sendEmail({
  to: 'customer@example.com',
  subject: 'Welcome to WeddingRingRing',
  react: CustomerWelcomeEmail({
    customerName: 'John Doe',
    // ... other props
  })
})
```

### Using Helper Functions

```typescript
import { sendCustomerWelcomeEmail } from '@/lib/email-helpers'

await sendCustomerWelcomeEmail(event, temporaryPassword)
```

---

## ⏰ Automated Email Flows

### Event Creation Flow
```
Event Created
    ↓
Email #1 → Customer (Welcome)
Email #4 → Venue (Notification)
```

**Code Location:** Admin create event endpoint

---

### 30 Days Before Event
```
Cron: purchase-upcoming-numbers (3:00 AM)
    ↓
Purchase phone number
    ↓
Email #2 → Customer (Phone Assigned)
Email #6 → Venue (Phone Ready)
```

**Code Location:** `/api/cron/purchase-upcoming-numbers/route.ts`

---

### 1 Day Before Event
```
Cron: send-event-reminders (8:00 AM)
    ↓
Email #5 → Venue (Reminder - Event Tomorrow)
```

**Code Location:** `/api/cron/send-event-reminders/route.ts`

---

### 1 Day After Event
```
Cron: send-day-after-summary (10:00 AM)
    ↓
Count messages
    ↓
Email #7 → Customer (Summary + Message Count)
```

**Code Location:** `/api/cron/send-day-after-summary/route.ts`

---

## 🔒 Security

### Cron Job Protection

All cron endpoints require authorization:

```typescript
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Vercel Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/purchase-upcoming-numbers",
      "schedule": "0 3 * * *"
    },
    {
      "path": "/api/cron/send-event-reminders",
      "schedule": "0 8 * * *"
    },
    {
      "path": "/api/cron/send-day-after-summary",
      "schedule": "0 10 * * *"
    }
  ]
}
```

Vercel automatically adds `CRON_SECRET` to requests.

---

## 📊 Email Delivery Monitoring

### Via Resend Dashboard

1. Go to https://resend.com/emails
2. View real-time delivery status
3. Check opens, clicks, bounces

### Via Error Logging

Critical email failures are logged to the error_logs table:

```typescript
await logError('cron:purchase-numbers', emailError, {
  eventId: event.id,
  phoneNumber: purchased.phoneNumber,
  errorType: 'email_notification_failed'
}, 'warning')
```

View in admin dashboard: `/admin/error-logs`

---

## 🧪 Testing Emails

### Development Preview

React Email provides dev server:

```bash
npx react-email dev
```

Opens preview at http://localhost:3000

### Manual Testing

```typescript
// In any API route or page
import { sendEmail } from '@/lib/email'
import CustomerWelcomeEmail from '@/emails/customer-welcome'

await sendEmail({
  to: 'your-email@example.com',
  subject: 'Test Email',
  react: CustomerWelcomeEmail({
    // Test props
  })
})
```

---

## 📝 Email Content Guidelines

### Subject Lines
- Keep under 50 characters
- Include event name when relevant
- Use emoji sparingly (✓ for summaries, ⚠️ for urgent)

### Body Content
- Start with personalized greeting
- Clear call-to-action button
- Relevant event details in boxes
- Support contact info in every email

### Tone
- **Customer emails:** Warm, congratulatory, helpful
- **Venue emails:** Professional, instructional, clear
- **Admin emails:** Technical, urgent, actionable

---

## 🐛 Troubleshooting

### Emails Not Sending

1. **Check Resend API key:**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Check domain verification:**
   - Go to Resend dashboard
   - Verify DNS records are configured

3. **Check error logs:**
   ```
   /admin/error-logs
   Filter: source = "cron:purchase-numbers"
   ```

### Emails Going to Spam

1. Set up SPF, DKIM, DMARC records
2. Use verified sending domain
3. Avoid spam trigger words
4. Include unsubscribe link (for marketing emails)

### Cron Jobs Not Running

1. **Check Vercel deployment:**
   ```bash
   vercel env pull
   ```

2. **Verify cron secret:**
   - Must be set in Vercel environment variables
   - Must match `CRON_SECRET` in `.env.local`

3. **Check cron logs:**
   - Vercel Dashboard → Project → Logs
   - Filter by cron path

---

## 📈 Future Enhancements

### Potential Additions:
- [ ] Email open tracking
- [ ] Click tracking for CTAs
- [ ] A/B testing for subject lines
- [ ] Unsubscribe management
- [ ] Email preferences (frequency, type)
- [ ] Custom greeting upload reminder (7 days before)
- [ ] Message milestone emails (10, 25, 50 messages)
- [ ] Post-event thank you (1 week after)

---

## 💡 Best Practices

1. **Always use `sendEmailSafe`** for non-critical emails
2. **Log email failures** to error_logs table
3. **Test on multiple email clients** (Gmail, Outlook, Apple Mail)
4. **Keep templates under 102KB** (Gmail clipping limit)
5. **Use inline CSS only** (external stylesheets don't work in email)
6. **Provide plain text alternative** (handled by React Email)
7. **Include preview text** for email inbox previews

---

## 📞 Support

**Email Issues:**
- Check Resend dashboard: https://resend.com/emails
- View error logs: `/admin/error-logs`
- Contact: support@weddingringring.com

**Resend Support:**
- Docs: https://resend.com/docs
- Discord: https://resend.com/discord
- Email: support@resend.com
