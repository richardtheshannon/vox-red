#!/usr/bin/env node

/**
 * Daily Reset Script for Temporary Unpublish
 *
 * This script resets all temporarily unpublished articles back to published status.
 * It should be run daily at 1:00 AM via external cron service like cron-job.org
 *
 * Usage:
 * - Local: node scripts/daily-reset.mjs
 * - External Cron (cron-job.org): Call https://your-app.railway.app/api/articles/reset-temporary-unpublish
 *
 * Environment Variables:
 * - RESET_API_URL: The URL to call for reset (defaults to localhost:3000)
 *
 * Note: This script is optional if using external cron services that directly call the API endpoint.
 */

import fetch from 'node-fetch'

async function resetTemporaryUnpublish() {
  const baseUrl = process.env.RESET_API_URL || 'http://localhost:3000'
  const resetUrl = `${baseUrl}/api/articles/reset-temporary-unpublish`

  try {
    console.log(`[${new Date().toISOString()}] Starting daily reset of temporary unpublish...`)

    const response = await fetch(resetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (response.ok) {
      console.log(`[${new Date().toISOString()}] Reset completed successfully:`)
      console.log(`  - Articles reset: ${result.resetCount}`)
      console.log(`  - Reset time: ${result.resetTime}`)
      console.log(`  - Message: ${result.message}`)
    } else {
      console.error(`[${new Date().toISOString()}] Reset failed:`, result.error)
      process.exit(1)
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error during reset:`, error.message)
    process.exit(1)
  }
}

// Run the reset
resetTemporaryUnpublish()