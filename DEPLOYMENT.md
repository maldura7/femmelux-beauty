# FemmeLux Beauty - Deployment Guide (Vercel + Render)

## Architecture Overview

| Service | Platform | URL Pattern |
|---------|----------|-------------|
| Admin Panel | Vercel | admin.femmelux.com / femmelux-admin.vercel.app |
| Web Storefront | Vercel | femmelux.com / femmelux-web.vercel.app |
| Backend API | Render | api.femmelux.com / femmelux-backend.onrender.com |
| PostgreSQL | Render | (internal connection) |

## Estimated Monthly Costs

| Service | Platform | Cost |
|---------|----------|------|
| Admin Panel | Vercel (Hobby) | Free |
| Web Storefront | Vercel (Hobby) | Free |
| Backend API | Render (Free) | Free |
| PostgreSQL | Render (Free) | Free |
| **Total** | | **Free** |

*Note: Free tier has some limitations (spins down after 15 min inactivity). Paid plans start at $7/month for always-on.*

---

## Step 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub

### 1.2 Create New Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub account if not already connected
3. Select the `maldura7/femmelux-beauty` repository
4. Click "Connect"

### 1.3 Configure Service Settings
- **Name**: `femmelux-backend`
- **Region**: Oregon (US West) or closest to you
- **Branch**: `main`
- **Root Directory**: `backend`
- **Runtime**: Node
- **Build Command**: `npm install && npm run build && npx prisma generate`
- **Start Command**: `npx prisma migrate deploy && npm start`
- **Instance Type**: Free

### 1.4 Add PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `femmelux-db`
   - **Database**: `femmelux`
   - **User**: `femmelux_user`
   - **Region**: Same as backend (Oregon)
   - **Plan**: Free
3. Click "Create Database"
4. Copy the **Internal Database URL** (starts with `postgres://`)

### 1.5 Configure Environment Variables
Go to your backend service → "Environment" tab → Add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `PORT` | `4000` |
| `DATABASE_URL` | (paste Internal Database URL from step 1.4) |
| `JWT_ACCESS_SECRET` | (generate: see below) |
| `JWT_REFRESH_SECRET` | (generate: see below) |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CORS_ORIGINS` | `https://your-admin.vercel.app,https://your-web.vercel.app` |

To generate secure secrets, run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 1.6 Deploy
1. Click "Create Web Service"
2. Wait for the build to complete (first build takes ~5 min)
3. Note your Render URL (e.g., `https://femmelux-backend.onrender.com`)

### 1.7 Seed Database (First Time Only)
After successful deployment:
1. Go to your backend service
2. Click "Shell" tab
3. Run: `npx prisma db seed`

---

## Step 2: Deploy Admin Panel to Vercel

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 2.2 Import Project
1. Click "Add New" → "Project"
2. Import from GitHub: `maldura7/femmelux-beauty`
3. **IMPORTANT**: Set Root Directory to `admin`

### 2.3 Configure Build Settings
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `admin`
- **Build Command**: `npm run build`
- **Output Directory**: Leave default

### 2.4 Set Environment Variables
Click "Environment Variables" and add:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://femmelux-backend.onrender.com/api` |
| `NEXT_PUBLIC_SITE_NAME` | `FemmeLux Admin` |

### 2.5 Deploy
Click "Deploy" and wait for the build to complete.

### 2.6 Note Your URL
After deployment, note the URL (e.g., `femmelux-admin.vercel.app`)

---

## Step 3: Deploy Web Storefront to Vercel

### 3.1 Create Another Vercel Project
1. Click "Add New" → "Project"
2. Import the same GitHub repo again
3. **IMPORTANT**: Set Root Directory to `web`

### 3.2 Configure Build Settings
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `web`
- **Build Command**: `npm run build`
- **Output Directory**: Leave default

### 3.3 Set Environment Variables

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://femmelux-backend.onrender.com/api` |
| `NEXT_PUBLIC_SITE_NAME` | `FemmeLux Beauty` |

### 3.4 Deploy
Click "Deploy" and wait for the build to complete.

---

## Step 4: Update CORS Origins on Render

Now that you have your Vercel URLs, update the backend's CORS settings:

1. Go to Render Dashboard → `femmelux-backend` → Environment
2. Update `CORS_ORIGINS`:
```
https://femmelux-admin.vercel.app,https://femmelux-web.vercel.app
```
3. Click "Save Changes" - Render will auto-redeploy

---

## Step 5: Verify Deployment

### Test Backend API
```bash
curl https://femmelux-backend.onrender.com/api/health
```

### Test Admin Login
1. Go to your admin Vercel URL
2. Login with the seeded admin credentials:
   - Email: `admin@femmelux.com`
   - Password: `admin123`

### Test Web Storefront
1. Go to your web Vercel URL
2. Browse products and test functionality

---

## Custom Domains (Optional)

### Vercel Custom Domains
1. Go to Project Settings → Domains
2. Add your domain (e.g., `admin.femmelux.com`)
3. Add DNS records as instructed:
   - CNAME record pointing to `cname.vercel-dns.com`

### Render Custom Domains
1. Go to your service → Settings → Custom Domains
2. Add your domain (e.g., `api.femmelux.com`)
3. Add DNS records as instructed

### Update CORS After Adding Custom Domains
Remember to update `CORS_ORIGINS` to include custom domains:
```
https://admin.femmelux.com,https://femmelux.com
```

---

## Environment Variables Reference

### Backend (Render)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection | Internal Render URL |
| `JWT_ACCESS_SECRET` | Access token signing key | 64-char random string |
| `JWT_REFRESH_SECRET` | Refresh token signing key | 64-char random string |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `https://admin.vercel.app,https://web.vercel.app` |

### Admin Panel (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL with /api | `https://femmelux-backend.onrender.com/api` |
| `NEXT_PUBLIC_SITE_NAME` | Site display name | `FemmeLux Admin` |

### Web Storefront (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL with /api | `https://femmelux-backend.onrender.com/api` |
| `NEXT_PUBLIC_SITE_NAME` | Site display name | `FemmeLux Beauty` |

---

## Important Notes about Render Free Tier

### Cold Starts
- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- Subsequent requests are fast

### To Keep Service Active (Optional)
Use a free monitoring service to ping your API every 14 minutes:
- UptimeRobot (free): https://uptimerobot.com
- Cron-job.org (free): https://cron-job.org

Set up a monitor to ping: `https://femmelux-backend.onrender.com/api/health`

### Upgrading to Paid
If cold starts are an issue:
- Render Starter: $7/month (always on)
- PostgreSQL Starter: $7/month

---

## Troubleshooting

### API Not Responding
1. Check Render dashboard for deployment status
2. View logs in Render → Events/Logs tab
3. Verify DATABASE_URL is correctly set
4. Check if free tier has spun down (wait 30-60 sec)

### CORS Errors
1. Open browser DevTools → Network tab
2. Verify the error shows your frontend domain
3. Ensure CORS_ORIGINS includes the exact domain (with https://)
4. No trailing slashes in URLs
5. Wait for Render to redeploy after changing env vars

### Build Failures on Vercel
1. Check that Root Directory is set correctly (`admin` or `web`)
2. Verify all dependencies are in package.json
3. Check build logs for specific TypeScript errors
4. Ensure NEXT_PUBLIC_API_URL is set

### Database Connection Issues
1. Use **Internal Database URL** (not External)
2. Make sure database and backend are in same region
3. Check database is not paused (free tier pauses after 90 days of inactivity)

### 401 Unauthorized on Admin
1. Check if JWT secrets are set correctly
2. Verify tokens are being sent in headers
3. Check if CORS is allowing credentials

---

## Useful Commands

### Render CLI (optional)
```bash
# Install
npm i -g render-cli

# Login
render login

# List services
render services list
```

### Vercel CLI (optional)
```bash
# Install
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# View logs
vercel logs
```

---

## Security Checklist

- [ ] Use strong, unique JWT secrets (64+ characters)
- [ ] HTTPS enabled (automatic on both platforms)
- [ ] Set restrictive CORS origins (no wildcards)
- [ ] Database uses SSL (automatic on Render)
- [ ] Enable 2FA on Vercel and Render accounts
- [ ] Regularly rotate JWT secrets
- [ ] Monitor for unusual activity in logs
