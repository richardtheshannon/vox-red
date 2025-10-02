#!/bin/bash

# Database Backup Script for Railway PostgreSQL
# This script downloads a backup of the production database from Railway

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚂 Railway Database Backup Script${NC}"
echo "=================================="

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found${NC}"
    echo "Please create .env.production with your Railway database credentials"
    echo "See .env.production.example for template"
    exit 1
fi

# Load production environment variables
source .env.production

# Validate required variables
if [ -z "$PGUSER" ] || [ -z "$PGHOST" ] || [ -z "$PGPORT" ] || [ -z "$PGDATABASE" ] || [ -z "$PGPASSWORD" ]; then
    echo -e "${RED}❌ Error: Missing required environment variables${NC}"
    echo "Please ensure all variables are set in .env.production:"
    echo "  - PGUSER"
    echo "  - PGHOST"
    echo "  - PGPORT"
    echo "  - PGDATABASE"
    echo "  - PGPASSWORD"
    exit 1
fi

# Create backups directory if it doesn't exist
mkdir -p ./backups

# Generate timestamp for backup file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="./backups/voxred_production_${TIMESTAMP}.dump"

echo -e "${YELLOW}📊 Database Details:${NC}"
echo "  Host: $PGHOST"
echo "  Port: $PGPORT"
echo "  Database: $PGDATABASE"
echo "  User: $PGUSER"
echo ""
echo -e "${YELLOW}📁 Backup will be saved to:${NC}"
echo "  $BACKUP_FILE"
echo ""

# Confirmation prompt
read -p "Do you want to proceed with the backup? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⚠️  Backup cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}💾 Starting database backup...${NC}"

# Export password for pg_dump
export PGPASSWORD=$PGPASSWORD

# Perform the backup
if pg_dump -U $PGUSER -h $PGHOST -p $PGPORT -F t -d $PGDATABASE > $BACKUP_FILE 2>/dev/null; then
    # Get file size
    FILE_SIZE=$(ls -lh $BACKUP_FILE | awk '{print $5}')

    echo -e "${GREEN}✅ Backup completed successfully!${NC}"
    echo "  File: $BACKUP_FILE"
    echo "  Size: $FILE_SIZE"

    # Create a symlink to latest backup for easy access
    ln -sf $(basename $BACKUP_FILE) ./backups/latest.dump
    echo -e "${GREEN}📎 Created symlink: ./backups/latest.dump${NC}"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    echo "Please check your credentials and network connection"
    rm -f $BACKUP_FILE  # Clean up failed backup
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 Database backup complete!${NC}"
echo "To restore this backup to local database, run:"
echo "  npm run db:restore"