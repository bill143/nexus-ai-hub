# NEXUS AI Hub

AI asset management and SAM-A classification platform for enterprise organizations.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + CSS custom properties |
| Database | Supabase PostgreSQL (RLS on every table) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Deployment | Vercel (frontend) + Supabase cloud (backend) |

---

## Phase 1 Setup (30 minutes)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd nexus-ai-hub
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users
3. Save your database password

### 3. Run the database migration

In your Supabase project → SQL Editor → paste and run:

```
supabase/migrations/001_initial_schema.sql
```

This creates all 8 tables with RLS policies automatically.

### 4. Run seed data (optional)

```
supabase/seed.sql
```

Then link your account to the demo org:

```sql
update profiles
set org_id = 'a0000000-0000-0000-0000-000000000001', role = 'admin'
where id = '<your-auth-uid>';
```

Your auth UID is visible in Supabase → Authentication → Users.

### 5. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in these required values from your Supabase project settings:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6. Enable Google OAuth (optional)

In Supabase → Authentication → Providers → Google:
1. Enable Google provider
2. Add your Google Cloud OAuth credentials
3. Add `http://localhost:3000/auth/callback` to authorized redirect URIs

### 7. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy to Vercel

### One-click deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Manual deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard:
# Project → Settings → Environment Variables
# Add all variables from .env.example
```

### Required environment variables on Vercel

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL   ← set to your production URL
```

### Update Supabase Auth redirect URLs

In Supabase → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/auth/callback`

---

## Role permissions

| Action | Viewer | Editor | Admin |
|---|---|---|---|
| View assets | ✓ | ✓ | ✓ |
| Edit assets | — | ✓ | ✓ |
| Create assets | — | ✓ | ✓ |
| Delete assets | — | — | ✓ |
| Invite members | — | — | ✓ |
| Change member roles | — | — | ✓ |
| Remove members | — | — | ✓ |
| View audit log | — | — | ✓ |
| Edit org settings | — | — | ✓ |

---

## Project structure

```
src/
├── app/
│   ├── api/
│   │   ├── assets/         GET (list), POST (create)
│   │   ├── assets/[id]/    GET, PATCH, DELETE
│   │   ├── users/          GET (list), PATCH (role), DELETE (remove)
│   │   ├── orgs/invite/    POST (send), GET (accept)
│   │   └── audit/          GET (admin only)
│   ├── auth/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── reset-password/
│   │   └── callback/
│   ├── dashboard/
│   └── settings/
├── components/
│   ├── layout/DashboardShell.tsx
│   ├── assets/
│   │   ├── KpiStrip.tsx
│   │   └── AssetTable.tsx
│   └── settings/SettingsTabs.tsx
├── lib/
│   ├── supabase/server.ts   Server + Admin client
│   ├── supabase/client.ts   Browser client
│   ├── auth.ts              requireAuth(), requireRole(), getSession()
│   └── audit.ts             writeAuditLog()
├── types/database.ts
└── middleware.ts             Route protection
supabase/
├── migrations/001_initial_schema.sql
└── seed.sql
```

---

## Security notes

- `SUPABASE_SERVICE_ROLE_KEY` is server-side only — never exposed to browser
- All tables have Row Level Security — users only see their org's data
- Audit log has no client-side write policy — only the server can write via service role
- Middleware enforces authentication on all routes except `/auth/*`
- RBAC is enforced at the API route level — not just the UI

---

## Phase 2 (next session)

- Real-time collaboration (Supabase Realtime)
- Email notifications (Resend)
- Comment threads on assets
- Activity feed
- SAML / SSO enterprise auth
- Bulk actions on assets
