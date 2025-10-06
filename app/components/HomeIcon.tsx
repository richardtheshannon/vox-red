'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function HomeIcon() {
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

  // Don't show on admin pages or when not authenticated
  const isAdminPage = pathname?.startsWith('/admin')

  if (!mounted || isAdminPage || !isAuthenticated) return null

  const handleHomeClick = () => {
    // Reload the page to reset everything to homepage
    window.location.reload()
  }

  return (
    <button
      onClick={handleHomeClick}
      className="fixed top-6 left-6 z-50 p-2 transition-opacity hover:opacity-70"
      aria-label="Refresh page"
    >
      <Image
        src="/media/favicon.ico"
        alt="Home"
        width={34}
        height={34}
        className="w-[34px] h-[34px] brightness-0 saturate-100 invert-0 sepia-100 hue-rotate-[0deg] contrast-200"
        style={{ filter: 'brightness(0) saturate(100%) invert(16%) sepia(99%) saturate(7404%) hue-rotate(359deg) brightness(95%) contrast(118%)' }}
      />
    </button>
  )
}