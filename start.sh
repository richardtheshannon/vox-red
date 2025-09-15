#!/bin/sh

# Run database migration
echo "Running database migration..."
npx prisma db push --skip-generate

# Seed the database with admin user
echo "Seeding database..."
npm run db:seed

# Start the Next.js application
echo "Starting Next.js application..."
exec node server.js