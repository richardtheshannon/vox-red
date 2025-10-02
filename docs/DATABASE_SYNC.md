# Database Sync Guide

This guide explains how to download the production database from Railway and use it locally for testing.

## Prerequisites

- PostgreSQL installed locally (same version as Railway, preferably 13+)
- `pg_dump` and `pg_restore` commands available in your PATH
- Railway project with PostgreSQL database
- Local development environment set up

## Setup

### 1. Get Railway Database Credentials

1. Log into your [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on the PostgreSQL service
4. Go to the "Connect" tab
5. Copy the following credentials:
   - `PGUSER` (usually "postgres")
   - `PGHOST` (e.g., "containers-us-west-XX.railway.app")
   - `PGPORT` (e.g., "5432" or custom port)
   - `PGDATABASE` (database name, usually "railway")
   - `PGPASSWORD` (your database password)

### 2. Create Production Environment File

1. Copy the example file:
   ```bash
   cp .env.production.example .env.production
   ```

2. Edit `.env.production` and add your Railway credentials:
   ```env
   PGUSER=postgres
   PGHOST=containers-us-west-XX.railway.app
   PGPORT=5432
   PGDATABASE=railway
   PGPASSWORD=your-railway-database-password
   ```

   ⚠️ **IMPORTANT**: Never commit `.env.production` to version control!

### 3. Ensure Local Database is Running

Make sure your local PostgreSQL is running and accessible. Your local database connection should be configured in `.env`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/voxred_dev"
```

## Usage

### Download Production Database

To create a backup of the production database:

```bash
npm run db:backup
```

This will:
- Connect to your Railway database
- Create a timestamped backup in `./backups/` directory
- Create a symlink `./backups/latest.dump` for easy access

**Windows users**: If the npm script doesn't work, run directly:
```cmd
scripts\db-backup.bat
```

### Restore to Local Database

To restore the latest backup to your local database:

```bash
npm run db:restore
```

⚠️ **WARNING**: This will REPLACE your entire local database!

To restore a specific backup file:
```bash
npm run db:restore -- ./backups/voxred_production_20250102_143022.dump
```

**Windows users**: The restore script is not available as a batch file yet. Use pg_restore directly:
```cmd
set PGPASSWORD=your-local-password
pg_restore -U postgres -h localhost -p 5432 -F t -d voxred_dev backups\latest.dump
```

### Sync in One Command

To backup and restore in one operation:

```bash
npm run db:sync
```

This combines both operations for convenience.

## Security Considerations

### Production Data Handling

⚠️ **IMPORTANT SECURITY NOTES**:

1. **Never commit production credentials** - The `.env.production` file is gitignored
2. **Handle production data carefully** - It may contain sensitive user information
3. **Use only for testing** - Don't use production data in staging or demo environments
4. **Clean up backups** - Delete old backup files when no longer needed
5. **Secure your local environment** - Ensure your local machine is secure

### Data Anonymization (Optional)

For additional security, consider anonymizing sensitive data after restore:

```sql
-- Example: Anonymize user emails (run in psql or Prisma Studio)
UPDATE "User" SET email = CONCAT('user', id, '@example.com');
UPDATE "User" SET "passwordHash" = '$2a$10$dummy.hash.for.testing';
```

## Troubleshooting

### Common Issues

#### 1. pg_dump/pg_restore not found
- **Solution**: Install PostgreSQL client tools
  - Mac: `brew install postgresql`
  - Windows: Download from [PostgreSQL website](https://www.postgresql.org/download/windows/)
  - Linux: `sudo apt-get install postgresql-client`

#### 2. Connection timeout to Railway
- **Solution**: Check your internet connection and Railway service status
- Ensure the database is not sleeping (wake it up in Railway dashboard)

#### 3. Authentication failed
- **Solution**: Double-check your credentials in `.env.production`
- Ensure you're using the correct password from Railway

#### 4. Local database doesn't exist
- **Solution**: Create the database first:
  ```bash
  createdb voxred_dev
  ```

#### 5. Permission denied errors
- **Solution**: Ensure your local PostgreSQL user has sufficient privileges
- Try running as PostgreSQL superuser

#### 6. Prisma schema conflicts
- **Solution**: After restore, regenerate Prisma client:
  ```bash
  npx prisma generate
  ```

### Network Egress Costs

⚠️ **Note**: Railway charges for network egress when downloading data. Large databases may incur costs. Check your Railway billing dashboard for current usage.

## Best Practices

1. **Regular Backups**: Schedule regular backups of production data
2. **Test Restores**: Periodically test the restore process
3. **Version Control**: Keep backup scripts in version control
4. **Documentation**: Document any custom modifications to the sync process
5. **Monitoring**: Monitor backup sizes and success rates

## Alternative Methods

### Using Docker

If you prefer Docker, you can use a PostgreSQL container:

```yaml
# docker-compose.yml
services:
  db:
    image: postgres:13
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: voxred_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Direct SQL Dump

For a SQL text dump instead of custom format:

```bash
# Backup as SQL
pg_dump -U $PGUSER -h $PGHOST -p $PGPORT -W $PGDATABASE > backup.sql

# Restore SQL
psql -U postgres -h localhost -d voxred_dev < backup.sql
```

## Support

If you encounter issues not covered here:

1. Check the [Railway Documentation](https://docs.railway.app/guides/postgresql)
2. Review [PostgreSQL backup documentation](https://www.postgresql.org/docs/current/backup.html)
3. Open an issue in the project repository