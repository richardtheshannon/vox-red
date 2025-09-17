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
    // Dispatch a custom event to navigate to first slide
    window.dispatchEvent(new CustomEvent('navigateToFirstSlide'))
  }

  return (
    <button
      onClick={handleHomeClick}
      className="fixed top-4 left-4 z-50 p-2 transition-opacity hover:opacity-70"
      aria-label="Go to first slide"
    >
      <Image
        src="/media/icon-96x96.png"
        alt="Home"
        width={24}
        height={24}
        className="w-6 h-6"
      />
    </button>
  )
}