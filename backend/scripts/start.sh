#!/bin/sh

echo "Starting FemmeLux Backend..."
echo "DATABASE_URL is set: $(if [ -n "$DATABASE_URL" ]; then echo 'yes'; else echo 'NO - THIS IS THE PROBLEM'; fi)"

# Use prisma from node_modules/.bin directly
PRISMA_CMD="./node_modules/.bin/prisma"

# Fallback to npx if direct path doesn't work
if [ ! -f "$PRISMA_CMD" ]; then
  PRISMA_CMD="npx prisma"
fi

# Sync database schema with prisma schema (creates tables if missing)
echo "Syncing database schema..."
$PRISMA_CMD db push --accept-data-loss 2>&1 || {
  echo "db push failed, retrying..."
  sleep 3
  $PRISMA_CMD db push --accept-data-loss 2>&1 || echo "Warning: db push failed"
}

# Run seed after migrations
echo "Running database seed..."
$PRISMA_CMD db seed 2>&1 || echo "Seed skipped or already run"

# Start the server
echo "Starting Express server on port ${PORT:-4000}..."
exec node dist/server.js
