# FemmeLux Beauty - Deployment Guide (Vercel + Railway)

## Architecture Overview

| Service | Platform | URL Pattern |
|---------|----------|-------------|
| Admin Panel | Vercel | admin.femmelux.com / femmelux-admin.vercel.app |
| Web Storefront | Vercel | femmelux.com / femmelux-web.vercel.app |
| Backend API | Railway | api.femmelux.com / femmelux-api.up.railway.app |
| PostgreSQL | Railway | (internal connection) |

## Estimated Monthly Costs

| Service | Platform | Cost |
|---------|----------|------|
| Admin Panel | Vercel (Hobby) | Free |
| Web Storefront | Vercel (Hobby) | Free |
| Backend API | Railway | ~$5/month |
| PostgreSQL | Railway | ~$5/month |
| **Total** | | **~$10/month** |

*Note: Vercel Hobby is free for personal projects. Pro plan is $20/month if needed.*

---

## Step 1: Deploy Backend to Railway

### 1.1 Create Railway Account
1. Go to https://railway.app
2. Sign up with GitHub

### 1.2 Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Connect your GitHub account if not already connected
4. Select the `maldura7/femmelux-beauty` repository

### 1.3 Configure Backend Service
1. After the repo is connected, click on the created service
2. Go to "Settings" tab
3. Set **Root Directory** to `backend`
4. Railway will auto-detect it's a Node.js app

### 1.4 Add PostgreSQL Database
1. Click "+ New" in your project
2. Select "Database" > "Add PostgreSQL"
3. Railway will create a database and provide a `DATABASE_URL`

### 1.5 Configure Environment Variables
Click on your backend service, go to "Variables" tab, and add:

```
NODE_ENV=production
PORT=4000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_ACCESS_SECRET=<generate-a-secure-random-string>
JWT_REFRESH_SECRET=<generate-a-different-secure-random-string>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=https://your-admin.vercel.app,https://your-web.vercel.app
```

To generate secure secrets, run in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

### 1.6 Deploy
1. Push to GitHub - Railway auto-deploys
2. Or click "Deploy" manually
3. Wait for the build to complete
4. Note the Railway URL (click "Settings" > "Domain")

### 1.7 Run Database Migrations
After deploy, click on your service and open the "Shell" tab:
```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## Step 2: Deploy Admin Panel to Vercel

### 2.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub

### 2.2 Import Project
1. Click "Add New" > "Project"
2. Import from GitHub: `maldura7/femmelux-beauty`
3. **IMPORTANT**: Set Root Directory to `admin`

### 2.3 Configure Build Settings
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `admin`
- **Build Command**: `npm run build`
- **Output Directory**: Leave default

### 2.4 Set Environment Variables
Click "Environment Variables" and add:
```
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api
NEXT_PUBLIC_SITE_NAME=FemmeLux Admin
```

### 2.5 Deploy
Click "Deploy" and wait for the build to complete.

### 2.6 Note Your URL
After deployment, note the URL (e.g., `femmelux-admin.vercel.app`)

---

## Step 3: Deploy Web Storefront to Vercel

### 3.1 Create Another Vercel Project
1. Click "Add New" > "Project"
2. Import the same GitHub repo again
3. **IMPORTANT**: Set Root Directory to `web`

### 3.2 Configure Build Settings
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `web`
- **Build Command**: `npm run build`
- **Output Directory**: Leave default

### 3.3 Set Environment Variables
```
NEXT_PUBLIC_API_URL=https://your-railway-url.up.railway.app/api
NEXT_PUBLIC_SITE_NAME=FemmeLux Beauty
```

### 3.4 Deploy
Click "Deploy" and wait for the build to complete.

---

## Step 4: Update CORS Origins on Railway

Now that you have your Vercel URLs, update the backend's CORS settings:

1. Go to Railway > Your Project > Backend Service > Variables
2. Update `CORS_ORIGINS`:
```
CORS_ORIGINS=https://femmelux-admin.vercel.app,https://femmelux-web.vercel.app
```
3. Railway will auto-redeploy with the new settings

---

## Step 5: Verify Deployment

### Test Backend API
```bash
curl https://your-railway-url.up.railway.app/api/health
```

### Test Admin Login
1. Go to your admin Vercel URL
2. Login with the seeded admin credentials

### Test Web Storefront
1. Go to your web Vercel URL
2. Browse products and test functionality

---

## Custom Domains (Optional)

### Vercel Custom Domains
1. Go to Project Settings > Domains
2. Add your domain (e.g., `admin.femmelux.com`)
3. Add DNS records as instructed:
   - CNAME record pointing to `cname.vercel-dns.com`

### Railway Custom Domains
1. Go to Service Settings > Networking > Custom Domain
2. Add your domain (e.g., `api.femmelux.com`)
3. Add DNS records as instructed

### Update CORS After Adding Custom Domains
Remember to update `CORS_ORIGINS` to include custom domains:
```
CORS_ORIGINS=https://admin.femmelux.com,https://femmelux.com
```

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `4000` |
| `DATABASE_URL` | PostgreSQL connection | `${{Postgres.DATABASE_URL}}` |
| `JWT_ACCESS_SECRET` | Access token signing key | 64-char random string |
| `JWT_REFRESH_SECRET` | Refresh token signing key | 64-char random string |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry | `7d` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `https://admin.vercel.app,https://web.vercel.app` |

### Admin Panel (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL with /api | `https://api.railway.app/api` |
| `NEXT_PUBLIC_SITE_NAME` | Site display name | `FemmeLux Admin` |

### Web Storefront (Vercel)

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL with /api | `https://api.railway.app/api` |
| `NEXT_PUBLIC_SITE_NAME` | Site display name | `FemmeLux Beauty` |

---

## Troubleshooting

### API Not Responding
1. Check Railway deployment logs
2. Verify DATABASE_URL is correctly set (should reference Postgres service)
3. Ensure Prisma migrations ran successfully
4. Check if PORT is set to 4000

### CORS Errors
1. Open browser DevTools > Network tab
2. Verify the error shows your frontend domain
3. Ensure CORS_ORIGINS includes the exact domain (with https://)
4. No trailing slashes in URLs
5. Redeploy backend after updating CORS_ORIGINS

### Build Failures on Vercel
1. Check that Root Directory is set correctly (`admin` or `web`)
2. Verify all dependencies are in package.json
3. Check build logs for specific TypeScript errors
4. Ensure NEXT_PUBLIC_API_URL is set

### Database Connection Issues
1. Verify DATABASE_URL references `${{Postgres.DATABASE_URL}}`
2. Check Railway PostgreSQL service is running
3. Try re-linking the database variable

### 401 Unauthorized on Admin
1. Check if JWT secrets are set correctly
2. Verify tokens are being sent in headers
3. Check if CORS is allowing credentials

---

## Useful Commands

### Railway CLI (optional)
```bash
# Install
npm i -g @railway/cli

# Login
railway login

# Link to project
railway link

# View logs
railway logs

# Open shell
railway shell
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
- [ ] Database uses SSL (automatic on Railway)
- [ ] Enable 2FA on Vercel and Railway accounts
- [ ] Regularly rotate JWT secrets
- [ ] Monitor for unusual activity in logs
