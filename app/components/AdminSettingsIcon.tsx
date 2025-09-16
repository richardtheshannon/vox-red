'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AdminSettingsIcon() {
  const pathname = usePathname()

  // Don't show on admin pages to avoid redundancy
  const isAdminPage = pathname?.startsWith('/admin')

  if (isAdminPage) return null

  return (
    <Link
      href="/admin/login"
      className="fixed bottom-4 left-4 z-50 p-2 transition-opacity hover:opacity-70"
      aria-label="Admin Settings"
    >
      <span className="material-icons text-gray-800 dark:text-gray-200 text-2xl">
        settings
      </span>
    </Link>
  )
}