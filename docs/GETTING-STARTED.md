# Getting Started with WeddingRingRing

This guide will walk you through setting up the complete WeddingRingRing application from scratch. Perfect for learning Next.js and Supabase!

## Prerequisites

Before you begin, make sure you have:

- [ ] **Node.js 18+** installed ([download here](https://nodejs.org/))
- [ ] **Git** installed ([download here](https://git-scm.com/))
- [ ] A **code editor** (VS Code recommended)
- [ ] A **Supabase account** (free - [sign up here](https://supabase.com))
- [ ] A **Twilio account** (free trial - [sign up here](https://www.twilio.com/try-twilio))

## Step 1: Clone and Install

```bash
# Navigate to where you want the project
cd ~/projects

# If you have this in a git repo, clone it:
git clone your-repo-url
cd weddingringring

# Or if starting from scratch, just create the folder
mkdir weddingringring
cd weddingringring

# Install dependencies
npm install
```

**What this does:** Downloads all the required packages (Next.js, React, Supabase client, etc.)

## Step 2: Set Up Supabase (Your Database)

### 2.1 Create a New Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Name**: `weddingringring`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users (UK/EU)
4. Click "Create new project"
5. Wait 2-3 minutes for it to initialize ☕

### 2.2 Get Your API Keys

1. In your Supabase project, click **Settings** (gear icon)
2. Click **API** in the left sidebar
3. You'll see:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon public** key (long string starting with `eyJ...`)
   - **service_role** key (another long string - keep this SECRET!)

### 2.3 Set Up the Database

1. In Supabase, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `/docs/database-schema.sql` from this project
4. Copy ALL the SQL code
5. Paste it into the Supabase SQL editor
6. Click **RUN** (bottom right)
7. You should see "Success. No rows returned"

**What this does:** Creates all your tables (users, venues, weddings, messages, etc.)

### 2.4 Set Up Storage

1. In Supabase, click **Storage** in the left sidebar
2. Click **New bucket**
3. Name it `recordings`
4. Make it **Public** (so couples can listen to messages)
5. Click **Create bucket**

## Step 3: Set Up Twilio (Phone System)

### 3.1 Create Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up (free $15 credit)
3. Verify your email and phone number

### 3.2 Get a Phone Number

1. In Twilio console, go to **Phone Numbers** > **Manage** > **Buy a number**
2. Select your country (UK)
3. Check **Voice** capability
4. Click **Search**
5. Choose a number you like
6. Click **Buy** (uses ~$1 of your credit)

### 3.3 Get Your Credentials

1. Go to Twilio console homepage
2. You'll see:
   - **Account SID** (starts with `AC...`)
   - **Auth Token** (click to reveal - keep this SECRET!)
3. Save these somewhere safe

## Step 4: Configure Environment Variables

1. In your project folder, find `.env.local.example`
2. Copy it and rename to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
3. Open `.env.local` in your code editor
4. Fill in ALL the values:

```env
# From Supabase (Step 2.2)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (paste your anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (paste your service role key)

# From Twilio (Step 3.3)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+44XXXXXXXXXX (your Twilio number)

# Leave this as-is for local development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

5. Save the file

**IMPORTANT:** Never commit `.env.local` to git! It's already in `.gitignore`.

## Step 5: Run Your App

```bash
npm run dev
```

Open your browser to [http://localhost:3000](http://localhost:3000)

You should see the WeddingRingRing landing page! 🎉

## Step 6: Test the Demo Data

The database schema includes demo data. Try accessing:

- Demo couple dashboard: Use access code `DEMO1234`
- This shows a completed wedding with sample data

## Understanding the File Structure

```
weddingringring/
├── src/
│   ├── app/              # Your pages live here
│   │   ├── page.tsx      # Homepage (couples landing)
│   │   ├── venue/        # Venue landing page
│   │   ├── dashboard/    # Couples dashboard
│   │   └── api/          # Backend API routes
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Basic components (buttons, cards)
│   │   └── dashboard/   # Dashboard-specific components
│   └── lib/             # Utility functions
│       ├── supabase/    # Database connection
│       └── twilio/      # Phone integration
├── public/              # Images, logos go here
└── docs/                # Documentation
```

## Next Steps

Now that everything is set up, you can:

1. **Explore the code** - Start with `src/app/page.tsx` (homepage)
2. **Make changes** - Edit a file, save, see it update in the browser
3. **Learn Next.js** - Check out [nextjs.org/learn](https://nextjs.org/learn)
4. **Build features** - Follow the roadmap in README.md

## Common Issues

### "Module not found" errors
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### Supabase connection errors
- Double-check your `.env.local` has the correct URL and keys
- Make sure you ran the database schema SQL

### Twilio webhook errors
- For local testing, you'll need ngrok or similar
- See `/docs/twilio-webhooks.md` (coming soon)

## Getting Help

- **Next.js docs**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase docs**: [supabase.com/docs](https://supabase.com/docs)
- **Twilio docs**: [twilio.com/docs](https://www.twilio.com/docs)

## Learning Resources

### Next.js (React Framework)
- [Next.js Tutorial](https://nextjs.org/learn) - Official tutorial
- [React Dev Docs](https://react.dev) - Learn React basics

### Supabase (Database)
- [Supabase Quickstart](https://supabase.com/docs/guides/getting-started)
- [Understanding RLS](https://supabase.com/docs/guides/auth/row-level-security) - Security policies

### Tailwind CSS (Styling)
- [Tailwind Docs](https://tailwindcss.com/docs)
- Your colors are already configured! Check `tailwind.config.js`

### TypeScript
- [TypeScript in 5 Minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)

---

**You're all set!** Start building your audio guestbook platform. Remember: every expert was once a beginner. Take it one step at a time, and don't be afraid to experiment!
