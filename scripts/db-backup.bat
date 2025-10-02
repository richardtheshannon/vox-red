@echo off
setlocal EnableDelayedExpansion

REM Database Backup Script for Railway PostgreSQL (Windows)
REM This script downloads a backup of the production database from Railway

echo ================================================================
echo Railway Database Backup Script
echo ================================================================

REM Check if .env.production exists
if not exist ".env.production" (
    echo ERROR: .env.production file not found
    echo Please create .env.production with your Railway database credentials
    echo See .env.production.example for template
    exit /b 1
)

REM Load production environment variables
for /f "tokens=1,2 delims==" %%a in (.env.production) do (
    set "%%a=%%b"
)

REM Validate required variables
if "%PGUSER%"=="" goto :missing_vars
if "%PGHOST%"=="" goto :missing_vars
if "%PGPORT%"=="" goto :missing_vars
if "%PGDATABASE%"=="" goto :missing_vars
if "%PGPASSWORD%"=="" goto :missing_vars
goto :vars_ok

:missing_vars
echo ERROR: Missing required environment variables
echo Please ensure all variables are set in .env.production:
echo   - PGUSER
echo   - PGHOST
echo   - PGPORT
echo   - PGDATABASE
echo   - PGPASSWORD
exit /b 1

:vars_ok

REM Create backups directory if it doesn't exist
if not exist "backups" mkdir backups

REM Generate timestamp for backup file
for /f "tokens=2 delims==" %%i in ('wmic os get localdatetime /value') do set datetime=%%i
set TIMESTAMP=%datetime:~0,4%%datetime:~4,2%%datetime:~6,2%_%datetime:~8,2%%datetime:~10,2%%datetime:~12,2%
set BACKUP_FILE=backups\voxred_production_%TIMESTAMP%.dump

echo.
echo Database Details:
echo   Host: %PGHOST%
echo   Port: %PGPORT%
echo   Database: %PGDATABASE%
echo   User: %PGUSER%
echo.
echo Backup will be saved to:
echo   %BACKUP_FILE%
echo.

REM Confirmation prompt
set /p CONFIRM=Do you want to proceed with the backup? (y/N):
if /i not "%CONFIRM%"=="y" (
    echo Backup cancelled
    exit /b 0
)

echo.
echo Starting database backup...

REM Perform the backup
pg_dump -U %PGUSER% -h %PGHOST% -p %PGPORT% -W -F t -d %PGDATABASE% > %BACKUP_FILE%

if %ERRORLEVEL% equ 0 (
    echo.
    echo Backup completed successfully!
    echo File: %BACKUP_FILE%

    REM Create a copy as latest.dump for easy access
    copy %BACKUP_FILE% backups\latest.dump > nul
    echo Created copy: backups\latest.dump
) else (
    echo.
    echo ERROR: Backup failed!
    echo Please check your credentials and network connection
    del %BACKUP_FILE% 2>nul
    exit /b 1
)

echo.
echo Database backup complete!
echo To restore this backup to local database, run:
echo   npm run db:restore

endlocal