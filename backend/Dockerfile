# Backend Dockerfile
FROM node:20-alpine AS base

# Install OpenSSL and other dependencies needed by Prisma
RUN apk add --no-cache openssl openssl-dev libc6-compat

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev deps for prisma CLI)
RUN npm install && npm cache clean --force

# Generate Prisma client with correct binary targets
RUN npx prisma generate

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Production image, copy all files and run
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Copy necessary files from builder (includes all node_modules with prisma CLI)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/scripts ./scripts

# Make start script executable
RUN chmod +x scripts/start.sh

# Create uploads directory
RUN mkdir -p uploads && chown -R expressjs:nodejs uploads

# Ensure node_modules binaries are accessible
ENV PATH="/app/node_modules/.bin:$PATH"

USER expressjs

EXPOSE 4000

# Run startup script
CMD ["sh", "scripts/start.sh"]
