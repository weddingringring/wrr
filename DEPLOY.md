# 🚀 WeddingRingRing - Quick Deployment Guide

**Status:** Ready to Deploy! ✅  
**Time Required:** ~1 hour  
**Date:** 2026-02-10

---

## ✅ CREDENTIALS CONFIGURED

All environment variables are ready in `.env.local`

**What's Configured:**
- ✅ Supabase (database & storage)
- ✅ Twilio (phone numbers & calls)
- ✅ Resend (email delivery)
- ✅ Admin email
- ✅ Cron job security
- ⏳ Regulatory bundle (add after approval)

---

## 📋 DEPLOYMENT CHECKLIST

### 1. Setup Supabase Database (15 minutes)

**Steps:**
1. Go to https://supabase.com/dashboard
2. Open your project: `bvdehtqzvaqkomjmmzjd`
3. Click **SQL Editor** in left sidebar
4. Click **New Query**
5. Copy the entire contents of `/docs/database-schema.sql`
6. Paste into SQL editor
7. Click **Run** (or press Ctrl/Cmd + Enter)
8. Wait for completion (should see "Success" messages)

**Verify:**
```sql
-- Run this to check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see: `analytics_events`, `contact_inquiries`, `error_logs`, `events`, `messages`, `phones`, `profiles`, `twilio_number_history`, `venues`

---

### 2. Create Storage Buckets (15 minutes)

**Go to:** Supabase Dashboard → Storage

#### Bucket 1: `message-recordings`
1. Click **New Bucket**
2. Name: `message-recordings`
3. Public: **NO** (keep private)
4. Click **Create**

**Apply Policies:**
- Go to SQL Editor → New Query
- Copy from `/docs/STORAGE-BUCKETS-SETUP.md` (message-recordings policies)
- Run

#### Bucket 2: `message-photos`
1. Click **New Bucket**
2. Name: `message-photos`
3. Public: **NO**
4. Click **Create**

**Apply Policies:**
- Same as above (message-photos policies)

#### Bucket 3: `event-greetings` ⚠️ MUST BE PUBLIC
1. Click **New Bucket**
2. Name: `event-greetings`
3. Public: **YES** ← IMPORTANT!
4. Click **Create**

**Apply Policies:**
- Same as above (event-greetings policies)

**Why Public?** Twilio needs to access greeting audio files to play them during calls.

---

### 3. Create First Admin User (5 minutes)

**Option A: Via Supabase Dashboard**
1. Go to Authentication → Users
2. Click **Add User**
3. Email: `weddingringring@gmail.com`
4. Password: [Choose a secure password]
5. Click **Create**
6. Copy the User ID (UUID)

**Option B: Invite Yourself**
1. Go to Authentication → Users
2. Click **Invite User**
3. Email: `weddingringring@gmail.com`
4. Check your email
5. Click the link and set password

**Then, make yourself admin:**
```sql
-- Go to SQL Editor, run this with your User ID
UPDATE profiles 
SET role = 'admin', is_active = true
WHERE id = 'paste-your-user-id-here';
```

**Verify:**
```sql
SELECT email, role FROM profiles WHERE role = 'admin';
```

---

### 4. Deploy to Vercel (20 minutes)

#### Step 1: Create GitHub Repository
1. Go to https://github.com
2. Click **New Repository**
3. Name: `weddingringring`
4. Visibility: **Private** (recommended)
5. Click **Create Repository**

#### Step 2: Upload Code to GitHub
**Option A: GitHub Web Interface (Easiest)**
1. Click **uploading an existing file**
2. Drag the entire `weddingringring` folder
3. Or upload files individually
4. Add commit message: "Initial deployment v1.0.0"
5. Click **Commit**

**Option B: Git Command Line**
```bash
cd weddingringring
git init
git add .
git commit -m "Initial deployment v1.0.0"
git branch -M main
git remote add origin https://github.com/yourusername/weddingringring.git
git push -u origin main
```

#### Step 3: Connect Vercel to GitHub
1. Go to https://vercel.com/dashboard
2. Click **New Project**
3. Click **Import Git Repository**
4. Select `weddingringring`
5. Click **Import**

#### Step 4: Configure Environment Variables
In Vercel project settings:

1. Go to **Settings → Environment Variables**
2. Add each variable from `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
RESEND_API_KEY
NEXT_PUBLIC_APP_URL (use your-project.vercel.app)
NEXT_PUBLIC_BASE_URL (same as above)
ADMIN_EMAIL
CRON_SECRET
```

**For each:**
- Name: [variable name]
- Value: [paste value from .env.local]
- Environments: **Production**, **Preview**, **Development**
- Click **Save**

#### Step 5: Deploy!
1. Click **Deploy**
2. Wait 2-3 minutes for build
3. Click on your deployment URL
4. You should see the WeddingRingRing homepage! 🎉

**Your URL will be:** `https://weddingringring-[random].vercel.app`

---

### 5. Update URLs (5 minutes)

After deployment, update these URLs:

**In Vercel Environment Variables:**
1. Edit `NEXT_PUBLIC_APP_URL`
2. Change to: `https://your-actual-vercel-url.vercel.app`
3. Edit `NEXT_PUBLIC_BASE_URL`
4. Change to: `https://your-actual-vercel-url.vercel.app`
5. Click **Save**
6. Redeploy (Deployments → click ⋯ → Redeploy)

**In `.env.local` (for local development):**
- Update the same URLs
- Keep this file safe!

---

### 6. Configure Twilio Webhooks (10 minutes)

1. Go to https://console.twilio.com
2. Go to **Phone Numbers → Manage → Active Numbers**
3. You won't have numbers yet (they'll be purchased automatically)
4. For now, just note these webhook URLs:

**When you get your first number, configure:**
```
Voice URL: https://your-vercel-url.vercel.app/api/twilio/voice
Voice Method: POST

Status Callback: https://your-vercel-url.vercel.app/api/twilio/status
Status Callback Method: POST
```

**Note:** The app automatically configures these when purchasing numbers, but good to know!

---

### 7. Test the Deployment (30 minutes)

#### Test 1: Homepage
- Visit your Vercel URL
- Should see WeddingRingRing homepage
- Check all pages load (About, How it Works, FAQs, etc.)

#### Test 2: Admin Login
- Go to `/admin/login`
- Login with `weddingringring@gmail.com`
- Should see admin dashboard

#### Test 3: Venue Signup
- Go to `/venue/signup`
- Create a test venue account
- Should receive welcome email

#### Test 4: Customer Login
- Go to `/customer/login`
- Try logging in (won't work until event created)

#### Test 5: Create Event (As Venue)
- Login as venue
- Create a test event
- Set event date 30+ days in future
- Should create successfully

#### Test 6: Cron Job (Manual Test)
```bash
curl -X GET \
  https://your-vercel-url.vercel.app/api/cron/purchase-upcoming-numbers \
  -H "Authorization: Bearer zfs3BBeUMxlhVwtQzq3LI9jB0VvCEaspwHbpUoIhcGY="
```

Should return JSON response (might say "no events found" - that's OK!)

---

## ⚠️ KNOWN ISSUES & SOLUTIONS

### "Build Failed" in Vercel
- Check environment variables are all set
- Make sure all files uploaded to GitHub
- Check build logs for specific error

### "Database Connection Failed"
- Verify Supabase URL is correct
- Check keys are copied completely (no spaces)
- Verify database schema was executed

### "Email Not Sending"
- Check Resend API key is valid
- Verify admin email is correct
- Check Resend dashboard for delivery status

### "Can't Purchase Numbers"
- This is expected until regulatory bundle approved
- Bundle takes 1-3 business days
- Everything else should work fine

---

## 📊 WHAT'S WORKING NOW

After deployment, these should work:
- ✅ Website (all pages)
- ✅ User authentication (admin, venue, customer)
- ✅ Event creation
- ✅ Database operations
- ✅ Email delivery
- ✅ File uploads (greetings, photos)
- ✅ Admin dashboard
- ✅ Venue dashboard
- ✅ Customer dashboard
- ⏳ Phone number purchasing (after regulatory bundle)
- ⏳ Incoming calls (after first number purchased)

---

## 🔄 NEXT STEPS

1. **Start Regulatory Bundle Process** (1-3 days approval)
   - See `/docs/TWILIO-REGULATORY-BUNDLE.md`
   - Do this ASAP so it's ready when you need it

2. **Test Everything Thoroughly**
   - Create test events
   - Try all user flows
   - Check email delivery
   - Test error handling

3. **Once Bundle Approved:**
   - Add `TWILIO_REGULATORY_BUNDLE_SID` to Vercel
   - Redeploy
   - Test phone number purchase
   - Test incoming call flow

4. **Add Custom Domain** (Optional)
   - Buy domain (GoDaddy, Namecheap, etc.)
   - Add to Vercel project
   - Update DNS records
   - Update environment URLs

---

## 🎯 SUCCESS CRITERIA

You'll know deployment was successful when:
- ✅ Website loads at Vercel URL
- ✅ Can login as admin
- ✅ Can create venue account
- ✅ Can create events
- ✅ Emails are received
- ✅ No console errors in browser
- ✅ Database queries work
- ✅ File uploads work

---

## 📞 NEED HELP?

**Common Issues:**
- See `/docs/FINAL-AUDIT-COMPLETE.md` for troubleshooting
- Check Vercel build logs for errors
- Check Supabase logs for database issues
- Check Resend dashboard for email issues

**Everything is ready to go! Start with Step 1 (Database Setup).** 🚀
