# Quick Setup Guide

## Issues Fixed

### 1. ✅ Hydration Error (WalletMultiButton)
**Problem:** The Solana wallet button was causing SSR/client mismatch.

**Solution:** Created `ClientWalletButton` component that only renders on client-side.

**Files Changed:**
- Created: `src/components/client-wallet-button.tsx`
- Updated: `src/app/dashboard/page.tsx`

---

### 2. ⚠️ Database Connection Error

**Problem:** PostgreSQL is not running (connection refused on port 5432).

**Solution Options:**

#### Option A: Set up PostgreSQL (Recommended for full demo)

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql

# Create database
sudo -u postgres createdb trading_journal

# Create user
sudo -u postgres psql
CREATE USER your_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE trading_journal TO your_user;
\q

# Create .env.local
cp .env.example .env.local
# Edit .env.local with your database credentials

# Run migrations
npx drizzle-kit push
```

#### Option B: Use Mock Data (Quick demo without database)

For a quick demo without setting up PostgreSQL, you can modify the API routes to return mock data:

1. **Mock Analytics Data:**
   - Edit `src/app/api/analytics/route.ts`
   - Return hardcoded sample analytics instead of querying database

2. **Mock Auth:**
   - Edit `src/app/api/auth/verify/route.ts`
   - Skip database check, just verify signature

3. **Skip Sync:**
   - Sync button will be disabled

---

## Current Status

✅ **Hydration Error:** FIXED  
⚠️ **Database:** Needs setup (see options above)

## Next Steps

1. Choose Option A or B above
2. Restart dev server: `npm run dev`
3. Test wallet connection
4. If using Option A, run migrations
5. Test sign-in flow

---

## For Bounty Demo

If you want to demo without database setup:

1. I can create mock data endpoints
2. Dashboard will show sample analytics
3. All UI features will be visible
4. Just won't persist real user data

Let me know which approach you prefer!
