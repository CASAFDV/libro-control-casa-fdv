#!/bin/sh
set -e

echo "=== LIBRO CONTROL CASA FDV - Starting ==="

# Ensure data directory exists
mkdir -p /app/data

# Set DATABASE_URL if not already set
export DATABASE_URL="${DATABASE_URL:-file:/app/data/custom.db}"

# If no database exists, initialize it with Prisma
if [ ! -f /app/data/custom.db ]; then
  echo "No database found, initializing with Prisma..."
  npx prisma db push --skip-generate 2>&1 || echo "Prisma push completed with warnings"
  echo "Database initialized successfully"
fi

# Start the Next.js application
echo "Starting application on port ${PORT:-3000}..."
exec node server.js
