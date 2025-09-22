/**
 * Publishing utilities for time-based and day-based article visibility
 */

interface Article {
  published: boolean
  isProject: boolean
  temporarilyUnpublished?: boolean
  publishTimeStart?: string | null
  publishTimeEnd?: string | null
  publishDays?: string | null
}

/**
 * Gets the current time in HH:MM format using browser timezone
 */
export function getCurrentTime(): string {
  const now = new Date()
  return now.toTimeString().slice(0, 5) // "HH:MM"
}

/**
 * Gets the current day of week in lowercase
 */
export function getCurrentDay(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  return days[new Date().getDay()]
}

/**
 * Checks if current time is within the publishing time window
 */
export function isWithinTimeWindow(startTime?: string | null, endTime?: string | null): boolean {
  if (!startTime || !endTime) {
    return true // No time restrictions
  }

  const currentTime = getCurrentTime()

  // Handle time window that crosses midnight (e.g., 22:00 to 06:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime
  }

  // Normal time window (e.g., 05:00 to 10:00)
  return currentTime >= startTime && currentTime <= endTime
}

/**
 * Checks if current day is in the allowed publishing days
 */
export function isAllowedDay(publishDays?: string | null): boolean {
  if (!publishDays || publishDays === 'all') {
    return true // No day restrictions or explicitly all days
  }

  try {
    const allowedDays = JSON.parse(publishDays) as string[]
    if (!Array.isArray(allowedDays)) {
      return true // Invalid format, default to allow
    }

    const currentDay = getCurrentDay()
    return allowedDays.map(day => day.toLowerCase()).includes(currentDay)
  } catch {
    return true // Invalid JSON, default to allow
  }
}

/**
 * Determines if an article should be visible based on time and day settings
 * Both standard and project articles can use time-based publishing
 */
export function shouldShowArticle(article: Article): boolean {
  // Check if temporarily unpublished first (highest priority filter)
  if (article.temporarilyUnpublished) {
    return false
  }

  // Must be published
  if (!article.published) {
    return false
  }

  // Check time window
  if (!isWithinTimeWindow(article.publishTimeStart, article.publishTimeEnd)) {
    return false
  }

  // Check allowed days
  if (!isAllowedDay(article.publishDays)) {
    return false
  }

  return true
}

/**
 * Formats days array for display
 */
export function formatDaysForDisplay(publishDays?: string | null): string {
  if (!publishDays || publishDays === 'all') {
    return 'All days'
  }

  try {
    const days = JSON.parse(publishDays) as string[]
    if (!Array.isArray(days) || days.length === 0) {
      return 'All days'
    }

    if (days.length === 7) {
      return 'All days'
    }

    return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ')
  } catch {
    return 'All days'
  }
}

/**
 * Day options for the form dropdown
 */
export const DAY_OPTIONS = [
  { value: 'all', label: 'All days' },
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]