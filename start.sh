#!/bin/sh

# Run database migration
echo "Running database migration..."
npx prisma db push --skip-generate

# Start the Next.js application
echo "Starting Next.js application..."
exec node server.js