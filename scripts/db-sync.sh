#!/bin/bash

# Database Sync Script
# This script combines backup and restore operations for easy sync

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Database Sync Script${NC}"
echo "======================="
echo "This will backup production database and restore to local"
echo ""

# Run backup
echo -e "${YELLOW}Step 1: Backing up production database...${NC}"
echo "========================================="
bash ./scripts/db-backup.sh

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}Step 2: Restoring to local database...${NC}"
    echo "======================================"
    bash ./scripts/db-restore.sh
else
    echo -e "${RED}❌ Backup failed. Skipping restore.${NC}"
    exit 1
fi