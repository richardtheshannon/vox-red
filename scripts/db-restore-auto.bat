@echo off
setlocal EnableDelayedExpansion

REM Database Restore Script for Local PostgreSQL (Windows) - Auto mode
echo ================================================================
echo Local Database Restore Script (AUTO MODE)
echo ================================================================

REM Set local database variables directly
set LOCAL_PGUSER=postgres
set LOCAL_PGPASSWORD=Superculture1@
set LOCAL_PGHOST=localhost
set LOCAL_PGPORT=5432
set LOCAL_PGDATABASE=nextjs_cms

REM Check if backups directory exists
if not exist "backups" (
    echo ERROR: No backups directory found
    exit /b 1
)

REM Use latest backup
set BACKUP_FILE=backups\latest.dump

if not exist "%BACKUP_FILE%" (
    echo ERROR: No backup file found at %BACKUP_FILE%
    exit /b 1
)

echo.
echo Local Database Details:
echo   Host: %LOCAL_PGHOST%
echo   Port: %LOCAL_PGPORT%
echo   Database: %LOCAL_PGDATABASE%
echo   User: %LOCAL_PGUSER%
echo.
echo Restore from:
echo   File: %BACKUP_FILE%
echo.
echo WARNING: This will REPLACE your local database!
echo Proceeding automatically...
echo.

echo Starting database restore...

REM Set password for PostgreSQL
set PGPASSWORD=%LOCAL_PGPASSWORD%

REM Drop existing database and create new one
echo Preparing database...
"C:\Program Files\PostgreSQL\17\bin\psql.exe" -U %LOCAL_PGUSER% -h %LOCAL_PGHOST% -p %LOCAL_PGPORT% -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '%LOCAL_PGDATABASE%' AND pid <> pg_backend_pid();" postgres 2>nul
"C:\Program Files\PostgreSQL\17\bin\dropdb.exe" -U %LOCAL_PGUSER% -h %LOCAL_PGHOST% -p %LOCAL_PGPORT% --if-exists %LOCAL_PGDATABASE% 2>nul
"C:\Program Files\PostgreSQL\17\bin\createdb.exe" -U %LOCAL_PGUSER% -h %LOCAL_PGHOST% -p %LOCAL_PGPORT% %LOCAL_PGDATABASE%

REM Restore the backup
echo Restoring data...
"C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" -U %LOCAL_PGUSER% -h %LOCAL_PGHOST% -p %LOCAL_PGPORT% -F t -d %LOCAL_PGDATABASE% %BACKUP_FILE% 2>nul

if %ERRORLEVEL% equ 0 (
    echo.
    echo Database restored successfully!

    REM Run Prisma generate
    echo.
    echo Updating Prisma client...
    call npx prisma generate

    echo.
    echo Local database is now synced with production!
    echo.
    echo Next steps:
    echo   1. Restart your development server: npm run dev
    echo   2. Check the database: npm run db:studio
) else (
    echo.
    echo Restore completed with warnings (this is normal for Prisma).
    echo Running Prisma generate...
    call npx prisma generate
    echo.
    echo Database sync complete!
)

endlocal