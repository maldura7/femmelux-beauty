# FemmeLux Beauty - DigitalOcean Deployment Guide

This guide walks you through deploying FemmeLux Beauty to DigitalOcean App Platform.

## Prerequisites

1. A DigitalOcean account
2. Your code pushed to a GitHub repository
3. A domain name (optional, but recommended)

## Estimated Monthly Costs

| Service | Size | Cost |
|---------|------|------|
| Backend API | basic-xxs | $5/month |
| Admin Panel | basic-xxs | $5/month |
| Web Storefront | basic-xxs | $5/month |
| PostgreSQL | db-s-1vcpu-1gb | $15/month |
| **Total** | | **~$30/month** |

*Note: Add Redis (~$15/month) if you need caching/sessions*

## Step 1: Prepare Your Repository

1. Push your code to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/femmelux-beauty.git
   git push -u origin main
   ```

2. Update `.do/app.yaml`:
   - Replace `maldura7` with your actual GitHub username

## Step 2: Create the App on DigitalOcean

### Option A: Using the DigitalOcean Console

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Select "GitHub" and authorize access
4. Choose your repository and branch
5. DigitalOcean will auto-detect the `.do/app.yaml` configuration
6. Review and click "Create Resources"

### Option B: Using doctl CLI

1. Install doctl:
   ```bash
   # macOS
   brew install doctl

   # Windows
   scoop install doctl
   ```

2. Authenticate:
   ```bash
   doctl auth init
   ```

3. Create the app:
   ```bash
   doctl apps create --spec .do/app.yaml
   ```

## Step 3: Configure Environment Variables

After the app is created, configure these secrets in the DigitalOcean console:

### Backend Secrets (Required)

| Variable | Description |
|----------|-------------|
| `JWT_ACCESS_SECRET` | Generate with: `openssl rand -base64 64` |
| `JWT_REFRESH_SECRET` | Generate with: `openssl rand -base64 64` |
| `SMTP_HOST` | Your SMTP server (e.g., smtp.gmail.com) |
| `SMTP_USER` | SMTP username/email |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_FROM` | Sender email address |

### Optional Secrets

| Variable | Description |
|----------|-------------|
| `REDIS_URL` | Redis connection URL (if using Redis) |

To set secrets via CLI:
```bash
doctl apps update YOUR_APP_ID --spec .do/app.yaml
```

## Step 4: Database Setup

The PostgreSQL database is automatically provisioned. To run migrations:

1. The Dockerfile automatically runs `prisma migrate deploy` on startup
2. To seed data, connect to your app's console:
   ```bash
   doctl apps console YOUR_APP_ID backend
   npx prisma db seed
   ```

## Step 5: Custom Domain (Optional)

1. In the DigitalOcean console, go to your app's Settings
2. Click "Domains"
3. Add your custom domains:
   - `femmelux.com` → Web Storefront
   - `admin.femmelux.com` → Admin Panel
   - `api.femmelux.com` → Backend API

4. Update your DNS records:
   ```
   Type: CNAME
   Name: @
   Value: your-app.ondigitalocean.app
   ```

5. Update CORS_ORIGINS in your app settings to include your custom domains

## Step 6: File Storage (Recommended for Production)

For production, use DigitalOcean Spaces instead of local file storage:

1. Create a Space in your DigitalOcean console
2. Generate Spaces access keys
3. Add these environment variables to your backend:
   ```
   DO_SPACES_KEY=your-key
   DO_SPACES_SECRET=your-secret
   DO_SPACES_ENDPOINT=nyc3.digitaloceanspaces.com
   DO_SPACES_BUCKET=femmelux-uploads
   DO_SPACES_CDN_ENDPOINT=femmelux-uploads.nyc3.cdn.digitaloceanspaces.com
   ```

## Monitoring & Logs

### View Logs
```bash
# Via CLI
doctl apps logs YOUR_APP_ID --type=run

# Or in the console
# Go to Apps > Your App > Runtime Logs
```

### View Metrics
The DigitalOcean console provides CPU, memory, and bandwidth metrics for each component.

## Scaling

To scale your app, update the `instance_count` or `instance_size_slug` in `.do/app.yaml`:

```yaml
services:
  - name: backend
    instance_count: 2  # Add more instances
    instance_size_slug: basic-xs  # Upgrade instance size
```

Available sizes:
- `basic-xxs`: 512 MB RAM, 1 vCPU ($5/month)
- `basic-xs`: 1 GB RAM, 1 vCPU ($10/month)
- `basic-s`: 2 GB RAM, 1 vCPU ($20/month)
- `basic-m`: 4 GB RAM, 2 vCPU ($40/month)

## Troubleshooting

### Build Failures
- Check the build logs in the DigitalOcean console
- Ensure all dependencies are in `package.json`
- Verify Dockerfile syntax

### Database Connection Issues
- Check that `DATABASE_URL` is properly set
- Verify the database is in the same region
- Check connection limits

### CORS Errors
- Ensure `CORS_ORIGINS` includes all your frontend URLs
- Include both http and https if needed

### Health Check Failures
- The backend must respond to GET requests on port 4000
- Check if the app is starting correctly in logs

## Useful Commands

```bash
# List apps
doctl apps list

# Get app info
doctl apps get YOUR_APP_ID

# Update app
doctl apps update YOUR_APP_ID --spec .do/app.yaml

# Restart component
doctl apps restart YOUR_APP_ID

# Delete app
doctl apps delete YOUR_APP_ID
```

## Security Checklist

- [ ] Use strong, unique JWT secrets
- [ ] Enable HTTPS (automatic with DigitalOcean)
- [ ] Set proper CORS origins
- [ ] Use managed database with SSL
- [ ] Regularly rotate secrets
- [ ] Enable 2FA on your DigitalOcean account
- [ ] Set up alerts for unusual activity
