@echo off
REM Database Sync Script for Windows
REM This script combines backup and restore operations

echo ================================================================
echo Database Sync Script
echo ================================================================
echo This will backup production database and restore to local
echo.

echo Step 1: Backing up production database...
echo =========================================
call scripts\db-backup.bat

if %ERRORLEVEL% equ 0 (
    echo.
    echo Step 2: Restoring to local database...
    echo ======================================
    call scripts\db-restore.bat
) else (
    echo.
    echo ERROR: Backup failed. Skipping restore.
    exit /b 1
)