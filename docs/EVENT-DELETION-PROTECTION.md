# Event Deletion Protection

## 🔒 Core Rule:
**Events with messages CANNOT be cancelled by venues.**

---

## Protection Implementation:

### **Edit Event Page** (`/venue/events/[id]/edit`)

This is the ONLY place where cancellation is available.

```typescript
{!hasMessages && (
  <div>
    <p>Need to change the email address?...</p>
    <button>Cancel Event</button>
  </div>
)}
```

**Shows:** Cancel button ONLY if `hasMessages === false`

**Why here?**
- ✅ Edit page = where you make changes
- ✅ Details page = view-only information  
- ✅ Logical grouping of all modifications
- ✅ Single place to control access

---

### **Event Details Page** (`/venue/events/[id]`)

**NO cancellation option.**

Only shows:
```
[Edit Event Details] ← Link to edit page
```

Users go to Edit page if they want to cancel.

---

## Visual Examples:

### Event WITH Messages (Protected):
```
┌─────────────────────────────────────────┐
│ Actions                                 │
├─────────────────────────────────────────┤
│ [Edit Event Details]                    │
│                                         │
│ ℹ️ Event cannot be cancelled: This     │
│    event has 23 messages. Contact      │
│    support if you need to cancel.      │
└─────────────────────────────────────────┘
```

### Event WITHOUT Messages (Can Cancel):
```
┌─────────────────────────────────────────┐
│ Actions                                 │
├─────────────────────────────────────────┤
│ [Edit Event Details]                    │
│                                         │
│ [Cancel Event ⚠️]                       │
└─────────────────────────────────────────┘
```

---

## Why This Protection?

**Scenario: Event with 50 messages**
- ❌ Without protection: Venue clicks cancel → All messages LOST
- ✅ With protection: Cancel button HIDDEN → Data safe

**Scenario: Typo in email, no messages yet**
- ✅ Venue can cancel and recreate with correct email
- ✅ No data loss (no messages existed)

---

## Edge Cases:

### What if venue REALLY needs to cancel?
**Answer:** Contact support
- Admin can manually cancel
- Can archive messages first
- Can notify customer
- Proper audit trail

### What if event has 1 message that's spam?
**Answer:** Still protected
- Message could be legitimate
- Better safe than sorry
- Support can verify and handle

### What if customer wants event cancelled?
**Answer:** Customer contacts venue → Venue contacts support
- Ensures proper communication
- Prevents accidents
- Maintains data integrity

---

## Database Status:

Events are never DELETED, just marked as cancelled:

```sql
UPDATE events 
SET 
  status = 'cancelled',
  cancelled_at = NOW(),
  cancelled_reason = 'Reason here'
WHERE id = 'event-id'
```

**Benefits:**
- Audit trail maintained
- Messages preserved
- Can be reviewed later
- Billing records intact

---

## Summary:

✅ **Event with 0 messages:** Can be cancelled by venue  
❌ **Event with 1+ messages:** Cannot be cancelled by venue (contact support)  
✅ **All events:** Never deleted, only marked cancelled  
✅ **Protection:** Implemented on Edit page AND Details page  
