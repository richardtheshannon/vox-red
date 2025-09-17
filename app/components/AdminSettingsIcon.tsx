'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AdminSettingsIcon() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Check authentication status
    const authData = localStorage.getItem('vox-red-auth')
    if (authData) {
      try {
        const { expiry } = JSON.parse(authData)
        setIsAuthenticated(Date.now() < expiry)
      } catch {
        setIsAuthenticated(false)
      }
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  // Don't show on admin pages to avoid redundancy or when not authenticated
  const isAdminPage = pathname?.startsWith('/admin')

  if (!mounted || isAdminPage || !isAuthenticated) return null

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