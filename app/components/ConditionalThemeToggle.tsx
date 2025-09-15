'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function ConditionalThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
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

  // Don't show on admin pages (AdminLayout handles it)
  const isAdminPage = pathname?.startsWith('/admin')

  if (!mounted || isAdminPage) return null

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-2 transition-opacity hover:opacity-70"
      aria-label="Toggle theme"
    >
      <span className="material-icons text-gray-800 dark:text-gray-200 text-2xl">
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
    </button>
  )
}