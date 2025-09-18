'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function ConditionalThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const pathname = usePathname()

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

    // Check localStorage and system preference
    const savedTheme = localStorage.getItem('theme')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

    if (savedTheme) {
      setTheme(savedTheme as 'light' | 'dark')
      document.documentElement.classList.toggle('dark', savedTheme === 'dark')
    } else if (systemPrefersDark) {
      setTheme('dark')
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark')
  }

  const handleLogout = () => {
    localStorage.removeItem('vox-red-auth')
    window.location.reload()
  }

  // Don't show on admin pages (AdminLayout handles it) or when not authenticated
  const isAdminPage = pathname?.startsWith('/admin')

  if (!mounted || isAdminPage || !isAuthenticated) return null

  return (
    <div className="fixed top-6 right-6 z-50 flex gap-2">
      <button
        onClick={toggleTheme}
        className="p-2 transition-opacity hover:opacity-70"
        aria-label="Toggle theme"
      >
        <span className="material-icons text-gray-800 dark:text-gray-200 text-2xl">
          {theme === 'light' ? 'dark_mode' : 'light_mode'}
        </span>
      </button>
      <button
        onClick={handleLogout}
        className="p-2 transition-opacity hover:opacity-70"
        aria-label="Logout"
      >
        <span className="material-icons text-gray-800 dark:text-gray-200 text-2xl">
          logout
        </span>
      </button>
    </div>
  )
}