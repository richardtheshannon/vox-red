@echo off
setlocal EnableDelayedExpansion

REM Database Backup Script for Railway PostgreSQL (Windows) - Auto mode
REM This script downloads a backup of the production database from Railway

echo ================================================================
echo Railway Database Backup Script (AUTO MODE)
echo ================================================================

REM Check if .env.production exists
if not exist ".env.production" (
    echo ERROR: .env.production file not found
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

echo Starting database backup...
echo This may take a few moments...

REM Set password environment variable for pg_dump
set PGPASSWORD=%PGPASSWORD%

REM Perform the backup (auto-accepting password)
"C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -F t -d %PGDATABASE% -w > %BACKUP_FILE% 2>nul

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
    echo Trying with password prompt...
    "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -U %PGUSER% -h %PGHOST% -p %PGPORT% -F t -d %PGDATABASE% -W > %BACKUP_FILE%
)

endlocal