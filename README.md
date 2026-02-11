# WeddingRingRing - Audio Guestbook Platform

A Next.js + Supabase application for managing vintage phone audio guestbooks at wedding venues.

## 🎯 Business Model

- **B2B**: Venues purchase/rent phones and offer the service to couples
- **B2C**: Couples receive access to listen, download, and share voice messages

## 🛠 Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Telephony**: Twilio (call routing, recording)
- **Deployment**: Vercel (frontend), Supabase Cloud (backend)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables (see .env.local.example)
cp .env.local.example .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

See `/docs/database-schema.sql` for complete schema

## 🔐 Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
```

## 📱 Pages

- `/` - B2C Landing (couples)
- `/venue` - B2B Landing (venues)
- `/dashboard` - Couples dashboard
- `/admin` - Venue admin panel
- `/login` - Authentication

## 💰 Revenue

- **Rental**: £50/event → Charge £500+ (£450 profit)
- **Purchase**: £1,299 + £299/year

Built for sale on Acquire.com with 3-5x ARR multiple potential
