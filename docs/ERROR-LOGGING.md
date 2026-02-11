# Error Logging System

## Overview

Simple, robust error logging with no third-party dependencies. All errors stored in database, viewable in admin dashboard.

---

## 🎯 What Gets Logged

### **Critical Errors** (Immediate attention needed)
- Phone purchase failures (no number for event)
- Recording webhook failures (message lost)
- Payment processing failures (future)
- Cron job complete failures

### **Regular Errors** (Fix when convenient)
- Individual number release failures
- File upload issues
- Email send failures

### **Warnings** (Monitor, not urgent)
- Some purchases failed (but not all)
- Slow API responses
- Near rate limits

### **Info** (FYI, not errors)
- Cron job summaries
- Daily stats
- Successful operations

---

## 💻 Usage

### **Basic Error Logging**

```typescript
import { logError } from '@/lib/error-logging'

try {
  await dangerousOperation()
} catch (error) {
  await logError('api:my-route', error, {
    userId: '123',
    operation: 'update-profile'
  })
  throw error // Re-throw if needed
}
```

### **Critical Errors**

```typescript
import { logCritical } from '@/lib/error-logging'

try {
  await purchasePhoneNumber()
} catch (error) {
  // Logs AND sends email notification
  await logCritical('cron:purchase-numbers', error, {
    eventId: event.id,
    country: 'FR'
  })
}
```

### **Warnings & Info**

```typescript
import { logWarning, logInfo } from '@/lib/error-logging'

// Warning
await logWarning('api:upload', 'File size large', {
  fileSize: '10MB',
  userId: '123'
})

// Info
await logInfo('cron:cleanup', 'Released 5 numbers', {
  released: 5
})
```

---

## 📊 Database Schema

```sql
CREATE TABLE error_logs (
  id UUID PRIMARY KEY,
  source TEXT NOT NULL,        -- Where error occurred
  error_message TEXT NOT NULL,  -- Error message
  error_stack TEXT,             -- Stack trace (optional)
  context JSONB,                -- Additional data
  severity TEXT,                -- info/warning/error/critical
  resolved BOOLEAN,             -- Admin marked as fixed
  resolved_at TIMESTAMP,
  created_at TIMESTAMP
);
```

---

## 🖥️ Admin Dashboard

### **Access:**
`/admin/error-logs`

### **Features:**
- View all errors
- Filter by status (all/unresolved)
- Filter by severity
- See full context and stack traces
- Mark errors as resolved
- Auto-refresh

### **Example View:**
```
┌────────────────────────────────────────────────┐
│ [CRITICAL] cron:purchase-numbers               │
│ 2025-02-10 03:00:15                           │
│                                                │
│ No available phone numbers in FR               │
│                                                │
│ Context:                                       │
│ {                                              │
│   "eventId": "abc123",                        │
│   "country": "FR",                            │
│   "eventDate": "2025-03-15"                   │
│ }                                              │
│                                                │
│ [Mark Resolved]                                │
└────────────────────────────────────────────────┘
```

---

## 🔔 Notifications

### **Currently Implemented:**
- ✅ Database logging (all errors)
- ✅ Console logging (immediate visibility)
- ✅ Admin dashboard (view/resolve)

### **Critical Errors (TODO):**
```typescript
// In /lib/error-logging.ts
async function sendCriticalErrorEmail() {
  // TODO: Implement email sending
  // Options:
  // - Resend (recommended, free tier)
  // - SendGrid
  // - Supabase Edge Functions
  // - AWS SES
}
```

**Add when ready:**
1. Sign up for Resend (free)
2. Get API key
3. Uncomment email code in `error-logging.ts`
4. Deploy

---

## 📍 Error Sources

Format: `category:specific-location`

**Examples:**
- `cron:purchase-numbers` - Phone purchase cron
- `cron:cleanup-phones` - Phone release cron
- `webhook:recording` - Twilio recording webhook
- `webhook:voice` - Twilio voice webhook
- `api:messages` - Message CRUD operations
- `api:events` - Event operations

**Benefits:**
- Easy to filter
- Quick to identify patterns
- Clear ownership

---

## 🔍 Querying Errors

### **Via Admin Dashboard:**
Just visit `/admin/error-logs`

### **Via SQL (Supabase Dashboard):**

```sql
-- Critical errors in last 24 hours
SELECT source, error_message, context
FROM error_logs
WHERE severity = 'critical'
AND created_at > NOW() - INTERVAL '24 hours';

-- Most common errors
SELECT source, error_message, COUNT(*) as count
FROM error_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY source, error_message
ORDER BY count DESC;

-- Unresolved errors
SELECT * FROM error_logs
WHERE resolved = false
ORDER BY created_at DESC;
```

---

## 🎯 Real-World Examples

### **Example 1: Phone Purchase Fails**

```
Error Log:
  Source: cron:purchase-numbers
  Severity: critical
  Message: No available phone numbers in FR
  Context: {
    eventId: "abc123",
    country: "FR",
    eventDate: "2025-03-15"
  }

What you do:
  1. See alert in admin dashboard
  2. Check Twilio console
  3. Try different number type (mobile vs local)
  4. Or manually purchase via API
  5. Mark error as resolved
```

### **Example 2: Recording Webhook Fails**

```
Error Log:
  Source: webhook:recording
  Severity: critical
  Message: Failed to upload to Supabase Storage
  Context: {
    recordingSid: "RE123",
    callSid: "CA456",
    twilioUrl: "https://..."
  }

What you do:
  1. Recording is still in Twilio (7 days)
  2. Manually download from Twilio
  3. Upload to Supabase
  4. Create message record
  5. Investigate storage permissions
  6. Mark resolved
```

---

## ⚙️ Configuration

### **Environment Variables:**

```bash
# Optional: For email notifications (future)
RESEND_API_KEY=re_xxxxxxxxxxxx
ERROR_NOTIFICATION_EMAIL=admin@weddingringring.com
```

### **Severity Levels:**

```typescript
'info'     // FYI, not an error
'warning'  // Potential issue
'error'    // Something failed
'critical' // Immediate attention needed
```

---

## 📈 Monitoring Strategy

### **Daily:**
- Check `/admin/error-logs` for critical/unresolved
- Review any cron failures
- Monitor patterns

### **Weekly:**
- Review warning-level errors
- Look for trends
- Clean up resolved errors

### **Monthly:**
- Analyze error frequency
- Identify improvements
- Update error handling

---

## ✅ Best Practices

### **DO:**
- ✅ Log with context (event ID, user ID, etc.)
- ✅ Use appropriate severity levels
- ✅ Include actionable information
- ✅ Mark errors as resolved when fixed

### **DON'T:**
- ❌ Log sensitive data (passwords, tokens)
- ❌ Log expected errors (404s from users)
- ❌ Over-log (every single operation)
- ❌ Ignore critical errors

---

## 🚀 Future Enhancements

**When Scaling:**
1. Add email notifications (Resend)
2. Add Slack webhooks
3. Set up error aggregation
4. Add performance monitoring
5. Consider Sentry for advanced features

**For Now:**
- Database logging is sufficient
- Admin dashboard covers basics
- No additional costs
- Simple to maintain

---

## 📊 Files Created

```
/docs/database-schema.sql
  ✅ error_logs table

/src/lib/error-logging.ts
  ✅ logError(), logCritical(), logWarning(), logInfo()

/src/app/admin/error-logs/page.tsx
  ✅ Admin dashboard

/src/app/api/cron/purchase-upcoming-numbers/route.ts
  ✅ Updated with error logging

/src/app/api/cron/cleanup-phones/route.ts
  ✅ Updated with error logging

/src/app/api/twilio/recording/route.ts
  ✅ Updated with critical error logging
```

---

**Simple, Professional, No Third-Party Dependencies** ✅

You now have complete visibility into errors without adding external services. Add Sentry later if needed!
