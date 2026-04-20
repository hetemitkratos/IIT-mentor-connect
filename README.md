# CandidConversation

> **Talk to real students. Choose your next 4 years with clarity — not just your rank.**

CandidConversation connects JEE aspirants with verified IIT & NIT students for honest, experience-driven 1:1 conversations. Students browse real mentors, pay ₹150, and instantly schedule a focused 20-minute Google Meet session via Calendly.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 Google Sign-In | Secure OAuth via NextAuth.js |
| 🎓 Mentor Discovery | Filter by IIT, branch, language & rank |
| 💳 Razorpay Payments | Test & live mode, HMAC webhook-verified |
| 📅 Calendly Scheduling | Webhook-driven, auto-generates Meet links |
| 🔑 OTP Verification | Session verified within 15 min of generation |
| 📊 Role Dashboards | Separate UI for Students, Mentors & Admins |
| 🛡️ Role-Based Access | `ASPIRANT`, `MENTOR`, `ADMIN` enforced at middleware |
| ⏰ Cron Cleanup | Auto-cancels unpaid & no-show sessions |
| 🖼️ ID Verification | Mentor college ID stored via Supabase Storage |
| ⭐ Reviews & Ratings | Post-session reviews stored on Booking model |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Vanilla CSS |
| Auth | NextAuth.js v4 + Google OAuth |
| Database | PostgreSQL (Neon) via Prisma ORM |
| Payments | Razorpay |
| Scheduling | Calendly Webhooks |
| Storage | Supabase Storage (mentor ID uploads) |
| State Management | TanStack Query v5 |
| Animations | Framer Motion |
| Hosting | Vercel |
| Cron Jobs | Vercel Cron |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A **PostgreSQL** database (recommended: [Neon](https://neon.tech) — free tier works)
- A **Google Cloud** project for OAuth
- A **Razorpay** account (test mode is fine)
- A **Calendly** account (Professional plan required for webhooks)
- A **Supabase** project (free tier works)

---

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/candid-conversation.git
cd candid-conversation
npm install
```

---

### 2. Configure Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Open `.env` and set the following:

```env
# ── Auth ────────────────────────────────────────────────────────
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET=""           # Generate: openssl rand -base64 32

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# ── Database ─────────────────────────────────────────────────────
DATABASE_URL=""               # postgres://user:pass@host/dbname



# ── Payments ──────────────────────────────────────────────────────
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""

# ── Scheduling ────────────────────────────────────────────────────
CALENDLY_WEBHOOK_SECRET=""    # Found in Calendly → Integrations → Webhooks

# ── Cron ──────────────────────────────────────────────────────────
CRON_SECRET=""                # Any random string; used to auth cron routes
```

> See the [Full Setup Guide](#-full-setup-guide) below for where to obtain each value.

---

### 3. Set Up the Database

```bash
# Run all migrations (creates all tables)
npx prisma migrate deploy

# Or for development (creates a migration from schema)
npx prisma migrate dev --name init

# Regenerate Prisma client (auto-runs on npm install via postinstall)
npx prisma generate
```

---

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To inspect the database:
```bash
npx prisma studio
```

---

## 📁 Project Structure

```
candid-conversation/
├── app/
│   ├── (public)/
│   │   └── mentors/            # Mentor discovery page (no auth required)
│   ├── (auth)/
│   │   ├── dashboard/          # Student dashboard (bookings, sessions)
│   │   └── book/[mentorId]/    # Booking flow page
│   ├── (mentor)/
│   │   ├── dashboard/          # Mentor dashboard (upcoming sessions, OTP)
│   │   └── apply/              # Mentor application form
│   ├── (admin)/
│   │   └── admin/              # Admin panel (approve/reject applications)
│   └── api/
│       ├── auth/               # NextAuth route handler
│       ├── bookings/           # Create & manage bookings
│       ├── payments/           # Razorpay order creation & verification
│       ├── webhooks/           # Razorpay & Calendly webhook handlers
│       ├── cron/               # Scheduled cleanup jobs
│       ├── mentor/             # Mentor profile & OTP routes
│       └── user/               # User utility routes
├── components/
│   ├── layout/                 # Navbar, Footer, providers
│   ├── mentor/                 # Mentor card, modal, dashboard content
│   ├── student/                # Student dashboard content
│   └── admin/                  # Admin approval components
├── services/                   # Server-side business logic
│   ├── mentor.service.ts
│   ├── booking.service.ts
│   └── dashboard.service.ts
├── lib/
│   ├── auth.ts                 # NextAuth config
│   ├── prisma.ts               # Prisma client singleton
│   ├── razorpay.ts             # Razorpay client
│   └── hmac.ts                 # HMAC signature utils
├── hooks/                      # TanStack Query client hooks
├── types/                      # Shared TypeScript types
├── constants/                  # App-wide constants
├── prisma/
│   ├── schema.prisma           # Full DB schema
│   └── migrations/             # Migration history
├── middleware.ts               # Role-based route protection
└── vercel.json                 # Vercel cron config
```

---

## 📋 Full Setup Guide

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → **Create Project**
2. Navigate to **APIs & Services → OAuth consent screen** → External → Fill in app name
3. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (dev)
     - `https://yourdomain.com/api/auth/callback/google` (prod)
4. Copy **Client ID** and **Client Secret** into `.env`

---

### Razorpay

1. Sign up at [razorpay.com](https://razorpay.com) → Dashboard
2. **Settings → API Keys → Generate Test Key**
3. Copy **Key ID** and **Key Secret** into `.env`
4. For webhooks, go to **Settings → Webhooks → Add New Webhook**
   - URL: `https://YOUR_DOMAIN/api/webhooks/razorpay`
   - Events to subscribe: `payment.captured`, `payment.failed`
   - Set a **Webhook Secret** and copy it into `.env` as `RAZORPAY_WEBHOOK_SECRET`

---

### Calendly

1. Sign up at [calendly.com](https://calendly.com) — **Professional plan required** for webhooks
2. Create a **20-minute event type**
3. Go to **Integrations → Webhooks → New Webhook**
   - URL: `https://YOUR_DOMAIN/api/webhooks/calendly`
   - Events: `invitee.created`, `invitee.canceled`
4. Copy the **Signing Key** into `.env` as `CALENDLY_WEBHOOK_SECRET`

> **For mentors:** Each mentor must provide their own Calendly event URL when applying. This URL is embedded in their profile for students to schedule through.

---

### Supabase Storage

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Storage → Create Bucket** → Name it `mentor-ids`, set to **Private**
3. Go to **Settings → API**
   - Copy **Project URL** → `SUPABASE_URL`
   - Copy **`service_role`** key → `SUPABASE_SERVICE_ROLE_KEY`
   - Copy **`anon`** key → `SUPABASE_ANON_KEY`

---

### Local Webhook Testing (ngrok)

When developing locally, services like Razorpay and Calendly can't reach `localhost`. Use [ngrok](https://ngrok.com):

```bash
# Install ngrok from https://ngrok.com/download
# Then in a separate terminal:
ngrok http 3000

# You'll get a public URL like: https://abc123.ngrok.io
# Use this as the webhook URL in Razorpay and Calendly
```

---

## 💳 Test Payment Cards (Razorpay Sandbox)

| Card Number | Expiry | CVV | Result |
|---|---|---|---|
| `4111 1111 1111 1111` | Any future | Any | ✅ Success |
| `4000 0000 0000 0002` | Any future | Any | ❌ Failure |
| `5267 3181 8797 5449` | Any future | Any | ✅ Success (Mastercard) |

> Use any Indian phone number and valid OTP `1234` in test mode.

---

## 🔄 Booking State Machine

```
payment_pending
      │
      ├──(15 min no payment)──► cancelled  [CRON]
      │
      ▼
awaiting_payment
      │
      ├──(30 min no capture)──► cancelled  [CRON]
      │
      ▼ (Razorpay webhook: payment.captured)
payment_complete
      │
      ▼ (Calendly webhook: invitee.created)
scheduled
      │
      ├──(session ends, no OTP verified)──► cancelled  [CRON]
      │
      ▼ (OTP verified during session)
in_progress
      │
      ▼ (manual / future auto)
completed
```

---

## 🗃️ Database Schema Overview

| Model | Purpose |
|---|---|
| `User` | Students, mentors, admins — unified auth model |
| `Account` | OAuth accounts (NextAuth adapter) |
| `Session` | Active sessions (NextAuth adapter) |
| `Mentor` | Verified mentor profiles |
| `MentorApplication` | Pending/reviewed mentor applications |
| `Booking` | Full session lifecycle with OTP, status, review |
| `Payment` | Razorpay payment records (order + capture) |
| `WebhookEvent` | Idempotency log for all webhook events |

---

## ⏰ Cron Jobs

Cron routes are authenticated with `CRON_SECRET` header and scheduled via Vercel:

| Route | Schedule | Action |
|---|---|---|
| `/api/cron/expire-pending-bookings` | Every 15 min | Cancels unpaid & no-show sessions |
| `/api/cron/complete-bookings` | Every hour | Marks completed past sessions |

`vercel.json` already configures these:

```json
{
  "crons": [
    { "path": "/api/cron/expire-pending-bookings", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/complete-bookings", "schedule": "0 * * * *" }
  ]
}
```

---

## 🌐 Deploying to Vercel

1. Push your repo to GitHub
2. Import the project at [vercel.com/new](https://vercel.com/new)
3. Add all environment variables from `.env` in the **Vercel dashboard → Settings → Environment Variables**
4. Make sure to update `NEXTAUTH_URL` to your production domain (e.g. `https://yourapp.vercel.app`)
5. Update Google OAuth redirect URIs to include the production URL
6. Update Razorpay & Calendly webhook URLs to production
7. Deploy! Cron jobs run automatically via `vercel.json`

> **Database**: Recommend [Neon](https://neon.tech) for serverless PostgreSQL — has a generous free tier and works perfectly with Vercel.

---

## 🧑‍💻 Available Scripts

```bash
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run prisma:generate  # Regenerate Prisma client
npx prisma studio    # Open Prisma Studio (visual DB browser)
npx prisma migrate dev --name <name>  # Create new migration
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

MIT © CandidConversation
