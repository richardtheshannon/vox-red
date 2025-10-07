'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

interface BottomNavigationFooterProps {
  // Vertical navigation (main slides)
  onVerticalPrevious: () => void
  onVerticalNext: () => void
  canGoVerticalPrevious: boolean
  canGoVerticalNext: boolean
  // Horizontal navigation (sub-articles)
  onHorizontalPrevious: () => void
  onHorizontalNext: () => void
  canGoHorizontalPrevious: boolean
  canGoHorizontalNext: boolean
}

export default function BottomNavigationFooter({
  onVerticalPrevious,
  onVerticalNext,
  canGoVerticalPrevious,
  canGoVerticalNext,
  onHorizontalPrevious,
  onHorizontalNext,
  canGoHorizontalPrevious,
  canGoHorizontalNext
}: BottomNavigationFooterProps) {
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
  }, [])

  // Don't show on admin pages or when not authenticated
  const isAdminPage = pathname?.startsWith('/admin')

  if (!mounted || isAdminPage || !isAuthenticated) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Vertical Navigation (Left) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onVerticalPrevious}
            disabled={!canGoVerticalPrevious}
            className={`p-2 transition-opacity ${
              canGoVerticalPrevious ? 'hover:opacity-70' : 'opacity-30 cursor-not-allowed'
            }`}
            aria-label="Previous slide"
          >
            <span className="material-icons text-white text-2xl">
              keyboard_arrow_up
            </span>
          </button>

          <button
            onClick={onVerticalNext}
            disabled={!canGoVerticalNext}
            className={`p-2 transition-opacity ${
              canGoVerticalNext ? 'hover:opacity-70' : 'opacity-30 cursor-not-allowed'
            }`}
            aria-label="Next slide"
          >
            <span className="material-icons text-white text-2xl">
              keyboard_arrow_down
            </span>
          </button>
        </div>

        {/* Horizontal Navigation (Right) */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onHorizontalPrevious}
            disabled={!canGoHorizontalPrevious}
            className={`p-2 transition-opacity ${
              canGoHorizontalPrevious ? 'hover:opacity-70' : 'opacity-30 cursor-not-allowed'
            }`}
            aria-label="Previous horizontal slide"
          >
            <span className="material-icons text-white text-2xl">
              keyboard_arrow_left
            </span>
          </button>

          <button
            onClick={onHorizontalNext}
            disabled={!canGoHorizontalNext}
            className={`p-2 transition-opacity ${
              canGoHorizontalNext ? 'hover:opacity-70' : 'opacity-30 cursor-not-allowed'
            }`}
            aria-label="Next horizontal slide"
          >
            <span className="material-icons text-white text-2xl">
              keyboard_arrow_right
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}