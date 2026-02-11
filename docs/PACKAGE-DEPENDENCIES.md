# Package Dependencies - Email System

## Required NPM Packages

Add these to your `package.json`:

```json
{
  "dependencies": {
    "resend": "^3.2.0",
    "react-email": "^2.1.0",
    "@react-email/components": "^0.0.15"
  }
}
```

## Installation Command

```bash
npm install resend react-email @react-email/components
```

## Package Details

### resend (^3.2.0)
**Purpose:** Email sending service  
**Docs:** https://resend.com/docs  
**Why:** Modern, reliable, great DX, generous free tier  

### react-email (^2.1.0)
**Purpose:** Email template engine  
**Docs:** https://react.email/docs  
**Why:** Write emails in React, preview in dev, type-safe  

### @react-email/components (^0.0.15)
**Purpose:** Pre-built email components  
**Docs:** https://react.email/docs/components  
**Why:** Button, Container, Heading, Text, etc. - email-optimized  

## Peer Dependencies

These should already be installed:
- `react` (^18.0.0)
- `react-dom` (^18.0.0)

## Dev Script (Optional)

Add to `package.json` scripts:

```json
{
  "scripts": {
    "email:dev": "email dev",
    "email:export": "email export"
  }
}
```

**Usage:**
```bash
# Preview emails in browser
npm run email:dev

# Export emails to HTML
npm run email:export
```

## Environment Setup

After installation, configure `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxx
NEXT_PUBLIC_BASE_URL=https://weddingringring.com
CRON_SECRET=your-random-secret
```

## Verification

Test installation:

```bash
# Check packages installed
npm list resend react-email @react-email/components

# Start email preview server
npx react-email dev
```

Should open browser at http://localhost:3000 with email previews.
