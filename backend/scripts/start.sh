#!/bin/sh

echo "Starting FemmeLux Backend..."
echo "DATABASE_URL is set: $(if [ -n "$DATABASE_URL" ]; then echo 'yes'; else echo 'NO - THIS IS THE PROBLEM'; fi)"

# IMPORTANT: We do NOT run prisma db push or any schema changes on startup
# This was causing data loss on every deployment!
#
# Database schema changes should be done manually:
# 1. Make changes to prisma/schema.prisma
# 2. Run: npx prisma migrate dev --name "description_of_change"
# 3. Commit the migration files
# 4. Deploy - migrations will be applied via prisma migrate deploy
#
# For Railway: Set up a one-time migration command or run manually

# Start the server directly
echo "Starting Express server on port ${PORT:-4000}..."
exec node dist/server.js
