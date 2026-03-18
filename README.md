# IIT Mentor Connect

> **1:1 mentorship sessions with IIT students — ₹150 for 20 minutes.**

A platform that connects JEE aspirants with IIT students for personalized guidance. Students browse verified IIT mentors, pay ₹150 via Razorpay, and instantly schedule a 20-minute 1:1 Google Meet session via Calendly.

---

## ✨ Features

- 🔐 **Google sign-in** via NextAuth.js
- 🎓 **Mentor discovery** — filter by IIT, branch, and language
- 💳 **Razorpay payments** — test & live mode, webhook-verified
- 📅 **Calendly scheduling** — auto-generates Google Meet links
- 📊 **Dashboards** — separate views for students and mentors
- 🛡️ **Role-based access** — `STUDENT`, `MENTOR`, `ADMIN`
- ⏰ **Cron-based cleanup** — auto-expires unpaid bookings after 15 min

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 14 (App Router)             |
| Auth        | NextAuth.js + Google OAuth          |
| Database    | PostgreSQL via Prisma ORM           |
| Payments    | Razorpay                            |
| Scheduling  | Calendly Webhooks                   |
| Storage     | Supabase Storage (mentor ID uploads)|
| Hosting     | Vercel (recommended)                |

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/iit-mentor-connect.git
cd iit-mentor-connect
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"   # openssl rand -base64 32

GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="your-razorpay-secret"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-webhook-secret"

CALENDLY_WEBHOOK_SECRET="your-calendly-signing-key"

SUPABASE_URL="https://yourproject.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

CRON_SECRET="any-random-string"
```

> See the [full setup guide](#full-setup-guide) below for how to obtain each value.

### 3. Set Up Database

```bash
# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Generate Prisma client
npx prisma generate
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to the sign-in page.

---

## 📁 Project Structure

```
iit-mentor-connect/
├── app/
│   ├── (public)/mentors/       # Mentor discovery (no auth)
│   ├── (auth)/dashboard/       # Student dashboard
│   ├── (auth)/bookings/        # Booking history
│   ├── (mentor)/               # Mentor-only pages
│   └── api/                    # API routes
│       ├── auth/               #   NextAuth
│       ├── bookings/           #   Booking CRUD
│       ├── payments/           #   Razorpay order + verify
│       ├── webhooks/           #   Razorpay + Calendly
│       └── cron/               #   Scheduled cleanup
├── services/                   # Business logic (server-only)
├── lib/                        # Auth, Prisma, Razorpay, HMAC utils
├── components/                 # React components
├── hooks/                      # TanStack Query hooks
└── prisma/schema.prisma        # Database schema
```

---

## 📋 Full Setup Guide

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com) → Create project
2. **APIs & Services → OAuth consent screen** → External
3. **APIs & Services → Credentials → Create OAuth Client ID**
   - Type: Web Application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret into `.env`

### Razorpay (Test Mode)

1. Sign up at [razorpay.com](https://razorpay.com)
2. **Settings → API Keys → Generate Test Key**
3. Copy Key ID and Secret into `.env`
4. For webhooks: **Settings → Webhooks → Add Webhook**
   - URL: `https://YOUR_NGROK_URL/api/webhooks/razorpay`
   - Events: `payment.captured`, `payment.failed`

### Calendly

1. Sign up at [calendly.com](https://calendly.com)
2. Create a 20-minute event type
3. **Integrations → Webhooks** (requires Professional plan)
   - URL: `https://YOUR_NGROK_URL/api/webhooks/calendly`
   - Events: `invitee.created`, `invitee.canceled`

### Supabase Storage

1. Create project at [supabase.com](https://supabase.com)
2. **Storage → New Bucket** → name it `mentor-ids` (private)
3. **Settings → API** → copy Project URL and `service_role` key

### Local Webhook Testing (ngrok)

```bash
# In a separate terminal
ngrok http 3000
# Use the generated https URL in Razorpay/Calendly webhook configs
```

---

## 💳 Test Payment Cards (Razorpay Sandbox)

| Card Number           | Expiry     | CVV | Result  |
|-----------------------|------------|-----|---------|
| `4111 1111 1111 1111` | Any future | Any | ✅ Success |
| `4000 0000 0000 0002` | Any future | Any | ❌ Failure |

---

## 🔄 Booking State Machine

```
payment_pending ──► payment_complete ──► scheduled ──► completed
      │                                                  │
      └──────────────────────────────────────────► cancelled
```

Unpaid bookings are auto-cancelled by cron after 15 minutes.

---

## 🌐 Deploying to Vercel

1. Push this repo to GitHub
2. Import project at [vercel.com](https://vercel.com)
3. Add all environment variables from `.env` in the Vercel dashboard
4. Add to `vercel.json` for cron jobs:

```json
{
  "crons": [
    { "path": "/api/cron/expire-pending-bookings", "schedule": "*/15 * * * *" },
    { "path": "/api/cron/complete-bookings", "schedule": "0 * * * *" }
  ]
}
```

---

## 📄 License

MIT
