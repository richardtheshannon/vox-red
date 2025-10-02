@echo off
setlocal EnableDelayedExpansion

REM Database Restore Script for Local PostgreSQL (Windows)
REM This script restores a Railway backup to your local database

echo ================================================================
echo Local Database Restore Script
echo ================================================================

REM Check if .env exists (local environment)
if not exist ".env" (
    echo ERROR: .env file not found
    echo Please create .env with your local database credentials
    echo See .env.example for template
    exit /b 1
)

REM Load local environment variables
for /f "tokens=1,2 delims==" %%a in (.env) do (
    set "%%a=%%b"
)

REM Parse DATABASE_URL if it exists
if not "%DATABASE_URL%"=="" (
    REM Extract components from DATABASE_URL
    REM Format: postgresql://username:password@host:port/database
    for /f "tokens=2,3,4,5,6 delims=/:@" %%a in ("%DATABASE_URL%") do (
        set "LOCAL_PGUSER=%%b"
        set "LOCAL_PGPASSWORD=%%c"
        set "LOCAL_PGHOST=%%d"
        for /f "tokens=1,2 delims=:" %%x in ("%%e") do (
            set "LOCAL_PGPORT=%%y"
            set "LOCAL_PGDATABASE=%%f"
        )
    )
) else (
    REM Use individual variables
    if "%PGUSER%"=="" (set LOCAL_PGUSER=postgres) else (set LOCAL_PGUSER=%PGUSER%)
    if "%PGPASSWORD%"=="" (set LOCAL_PGPASSWORD=) else (set LOCAL_PGPASSWORD=%PGPASSWORD%)
    if "%PGHOST%"=="" (set LOCAL_PGHOST=localhost) else (set LOCAL_PGHOST=%PGHOST%)
    if "%PGPORT%"=="" (set LOCAL_PGPORT=5432) else (set LOCAL_PGPORT=%PGPORT%)
    if "%PGDATABASE%"=="" (set LOCAL_PGDATABASE=voxred_dev) else (set LOCAL_PGDATABASE=%PGDATABASE%)
)

REM Check if backups directory exists
if not exist "backups" (
    echo ERROR: No backups directory found
    echo Please run 'npm run db:backup' first to create a backup
    exit /b 1
)

REM Find the latest backup file
set BACKUP_FILE=
if exist "backups\latest.dump" (
    set BACKUP_FILE=backups\latest.dump
) else (
    for /f "tokens=*" %%i in ('dir /b /o-d backups\*.dump 2^>nul') do (
        set BACKUP_FILE=backups\%%i
        goto :found_backup
    )
)
:found_backup

if "%BACKUP_FILE%"=="" (
    echo ERROR: No backup file found
    echo Please run 'npm run db:backup' first to create a backup
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
echo All existing data in '%LOCAL_PGDATABASE%' will be lost.
echo.

REM Confirmation prompt
set /p CONFIRM=Do you want to proceed with the restore? (y/N):
if /i not "%CONFIRM%"=="y" (
    echo Restore cancelled
    exit /b 0
)

echo.
echo Starting database restore...

REM Set password for PostgreSQL
set PGPASSWORD=%LOCAL_PGPASSWORD%

REM Drop existing database and create new one
echo Preparing database...
psql -U %LOCAL_PGUSER% -h %LOCAL_PGHOST% -p %LOCAL_PGPORT% -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '%LOCAL_PGDATABASE%' AND pid <> pg_backend_pid();" postgres 2>nul
dropdb -U %LOCAL_PGUSER% -h %LOCAL_PGHOST% -p %LOCAL_PGPORT% --if-exists %LOCAL_PGDATABASE% 2>nul
createdb -U %LOCAL_PGUSER% -h %LOCAL_PGHOST% -p %LOCAL_PGPORT% %LOCAL_PGDATABASE%

REM Restore the backup
echo Restoring data...
pg_restore -U %LOCAL_PGUSER% -h %LOCAL_PGHOST% -p %LOCAL_PGPORT% -F t -d %LOCAL_PGDATABASE% %BACKUP_FILE%

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
    echo ERROR: Restore failed!
    echo Please check your local PostgreSQL installation and credentials
    exit /b 1
)

endlocal