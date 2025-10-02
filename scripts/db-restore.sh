#!/bin/bash

# Database Restore Script for Local PostgreSQL
# This script restores a Railway backup to your local database

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Local Database Restore Script${NC}"
echo "================================="

# Check if .env exists (local environment)
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env with your local database credentials"
    echo "See .env.example for template"
    exit 1
fi

# Load local environment variables
source .env

# Parse DATABASE_URL if it exists, otherwise use individual variables
if [ ! -z "$DATABASE_URL" ]; then
    # Extract components from DATABASE_URL
    # Format: postgresql://username:password@host:port/database
    if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
        LOCAL_PGUSER="${BASH_REMATCH[1]}"
        LOCAL_PGPASSWORD="${BASH_REMATCH[2]}"
        LOCAL_PGHOST="${BASH_REMATCH[3]}"
        LOCAL_PGPORT="${BASH_REMATCH[4]}"
        LOCAL_PGDATABASE="${BASH_REMATCH[5]}"
    fi
else
    # Use individual variables
    LOCAL_PGUSER=${PGUSER:-postgres}
    LOCAL_PGPASSWORD=${PGPASSWORD:-}
    LOCAL_PGHOST=${PGHOST:-localhost}
    LOCAL_PGPORT=${PGPORT:-5432}
    LOCAL_PGDATABASE=${PGDATABASE:-voxred_dev}
fi

# Validate required variables
if [ -z "$LOCAL_PGHOST" ] || [ -z "$LOCAL_PGPORT" ] || [ -z "$LOCAL_PGDATABASE" ]; then
    echo -e "${RED}❌ Error: Missing required database configuration${NC}"
    echo "Please ensure DATABASE_URL is set in .env"
    exit 1
fi

# Check if backups directory exists
if [ ! -d "./backups" ]; then
    echo -e "${RED}❌ Error: No backups directory found${NC}"
    echo "Please run 'npm run db:backup' first to create a backup"
    exit 1
fi

# Determine which backup to restore
BACKUP_FILE=""
if [ ! -z "$1" ]; then
    # Use specified backup file
    BACKUP_FILE="$1"
else
    # Use latest backup if exists
    if [ -L "./backups/latest.dump" ]; then
        BACKUP_FILE="./backups/latest.dump"
    else
        # Find most recent backup
        LATEST_BACKUP=$(ls -t ./backups/*.dump 2>/dev/null | head -n1)
        if [ ! -z "$LATEST_BACKUP" ]; then
            BACKUP_FILE="$LATEST_BACKUP"
        fi
    fi
fi

# Check if backup file exists
if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: No backup file found${NC}"
    echo "Please run 'npm run db:backup' first to create a backup"
    echo "Or specify a backup file: npm run db:restore -- path/to/backup.dump"
    exit 1
fi

# Get file info
FILE_SIZE=$(ls -lh $BACKUP_FILE | awk '{print $5}')
FILE_DATE=$(ls -l $BACKUP_FILE | awk '{print $6, $7, $8}')

echo -e "${YELLOW}📊 Local Database Details:${NC}"
echo "  Host: $LOCAL_PGHOST"
echo "  Port: $LOCAL_PGPORT"
echo "  Database: $LOCAL_PGDATABASE"
echo "  User: $LOCAL_PGUSER"
echo ""
echo -e "${YELLOW}📁 Restore from:${NC}"
echo "  File: $BACKUP_FILE"
echo "  Size: $FILE_SIZE"
echo "  Date: $FILE_DATE"
echo ""

echo -e "${RED}⚠️  WARNING: This will REPLACE your local database!${NC}"
echo "All existing data in '$LOCAL_PGDATABASE' will be lost."
echo ""

# Confirmation prompt
read -p "Do you want to proceed with the restore? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Restore cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🔄 Starting database restore...${NC}"

# Export password for psql/pg_restore
export PGPASSWORD=$LOCAL_PGPASSWORD

# Drop existing database (if exists) and create new one
echo -e "${BLUE}📦 Preparing database...${NC}"
psql -U $LOCAL_PGUSER -h $LOCAL_PGHOST -p $LOCAL_PGPORT -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$LOCAL_PGDATABASE' AND pid <> pg_backend_pid();" postgres 2>/dev/null || true
dropdb -U $LOCAL_PGUSER -h $LOCAL_PGHOST -p $LOCAL_PGPORT --if-exists $LOCAL_PGDATABASE 2>/dev/null || true
createdb -U $LOCAL_PGUSER -h $LOCAL_PGHOST -p $LOCAL_PGPORT $LOCAL_PGDATABASE

# Restore the backup
echo -e "${BLUE}📥 Restoring data...${NC}"
if pg_restore -U $LOCAL_PGUSER -h $LOCAL_PGHOST -p $LOCAL_PGPORT -F t -d $LOCAL_PGDATABASE $BACKUP_FILE 2>/dev/null; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"

    # Run Prisma generate to update client
    echo ""
    echo -e "${BLUE}🔧 Updating Prisma client...${NC}"
    npx prisma generate

    echo ""
    echo -e "${GREEN}🎉 Local database is now synced with production!${NC}"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "  1. Restart your development server: npm run dev"
    echo "  2. Check the database: npm run db:studio"
else
    echo -e "${RED}❌ Restore failed!${NC}"
    echo "Please check your local PostgreSQL installation and credentials"
    exit 1
fi