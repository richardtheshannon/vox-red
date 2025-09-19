#!/bin/sh

# Run database migration
echo "Running database migration..."
npx prisma db push --skip-generate

# Seed the database with admin user
echo "Seeding database with admin user..."
echo "Admin Email: $ADMIN_EMAIL"
echo "Admin Password is set: $([ -n "$ADMIN_PASSWORD" ] && echo "Yes" || echo "No")"
node prisma/seed.js || echo "Seed script failed, but continuing..."

# Start the Next.js application
echo "Starting Next.js application..."
echo "PORT environment variable: $PORT"
echo "HOSTNAME environment variable: $HOSTNAME"
exec node server.js