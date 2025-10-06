# ⚠️ UPDATE YOUR RAILWAY CREDENTIALS

Your `.env.production` currently has the INTERNAL Railway hostname which won't work from your local machine.

## Current (INCORRECT for local access):
```
PGHOST=postgres.railway.internal
```

## You need the EXTERNAL connection details:

1. Go to: https://railway.app/dashboard
2. Select your project
3. Click on the PostgreSQL service
4. Go to the "Connect" tab
5. Look for **"Public Networking"** section
6. Copy these values:

```env
# Example of correct external values:
PGHOST=containers-us-west-123.railway.app
PGPORT=5432 (or could be different like 6543)
PGDATABASE=railway
PGUSER=postgres
PGPASSWORD=your-actual-password-here
```

## Quick Check:
- ❌ WRONG: `postgres.railway.internal` (internal only)
- ✅ RIGHT: `containers-us-west-XXX.railway.app` (external)

## Alternative Option:
You can also use the full DATABASE_URL from Railway's Connect tab:
```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-XXX.railway.app:5432/railway
```

Then update your `.env.production` with the correct EXTERNAL values and try again!