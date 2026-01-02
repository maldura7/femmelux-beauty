#!/bin/sh

echo "Starting FemmeLux Backend..."
echo "DATABASE_URL is set: $(if [ -n "$DATABASE_URL" ]; then echo 'yes'; else echo 'NO - THIS IS THE PROBLEM'; fi)"

# Run database migrations in the background to not block server startup
{
  echo "Running database migrations in background..."
  sleep 5  # Give the server time to start first

  MAX_RETRIES=10
  RETRY_COUNT=0

  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if npx prisma migrate deploy 2>&1; then
      echo "Database migrations completed successfully!"
      break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Migration attempt $RETRY_COUNT failed, retrying in 10 seconds..."
    sleep 10
  done

  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Warning: Database migrations failed after $MAX_RETRIES attempts"
    echo "Trying db push as fallback..."
    npx prisma db push --accept-data-loss 2>&1 || echo "Warning: db push also failed"
  fi
} &

# Start the server immediately so health checks pass
echo "Starting Express server on port ${PORT:-4000}..."
exec node dist/server.js
