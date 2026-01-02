#!/bin/sh
set -e

echo "Starting FemmeLux Backend..."

# Wait for database to be ready
echo "Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if npx prisma db push --skip-generate 2>/dev/null; then
    echo "Database connection successful!"
    break
  fi

  RETRY_COUNT=$((RETRY_COUNT + 1))
  echo "Database not ready, attempt $RETRY_COUNT of $MAX_RETRIES..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Warning: Could not verify database connection after $MAX_RETRIES attempts"
  echo "Attempting to start anyway..."
fi

# Run database migrations
echo "Running database migrations..."
npx prisma migrate deploy || {
  echo "Migration failed, attempting db push as fallback..."
  npx prisma db push --skip-generate || echo "Warning: Could not sync database schema"
}

# Generate Prisma client (in case it's needed)
echo "Ensuring Prisma client is up to date..."
npx prisma generate

# Start the server
echo "Starting Express server..."
exec node dist/server.js
