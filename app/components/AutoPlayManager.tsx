'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface AutoPlayContextType {
  isAutoPlaying: boolean
  currentSlideIndex: number
  currentSubSlideIndex: number
  toggleAutoPlay: () => void
  moveToNextSlide: () => void
  resetAutoPlay: () => void
  setCurrentPosition: (slideIndex: number, subSlideIndex?: number) => void
}

const AutoPlayContext = createContext<AutoPlayContextType | undefined>(undefined)

export function useAutoPlay() {
  const context = useContext(AutoPlayContext)
  if (context === undefined) {
    throw new Error('useAutoPlay must be used within an AutoPlayProvider')
  }
  return context
}

interface AutoPlayProviderProps {
  children: ReactNode
}

export function AutoPlayProvider({ children }: AutoPlayProviderProps) {
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [currentSubSlideIndex, setCurrentSubSlideIndex] = useState(0)

  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => {
      const newState = !prev
      if (newState) {
        // Starting auto-play - dispatch event to start playing current slide
        window.dispatchEvent(new CustomEvent('autoPlayStart'))
      } else {
        // Stopping auto-play - dispatch event to pause current audio
        window.dispatchEvent(new CustomEvent('autoPlayStop'))
      }
      return newState
    })
  }

  const moveToNextSlide = useCallback(() => {
    if (!isAutoPlaying) return

    // Dispatch event to move to next slide
    window.dispatchEvent(new CustomEvent('autoPlayNext', {
      detail: {
        currentSlideIndex,
        currentSubSlideIndex
      }
    }))
  }, [isAutoPlaying, currentSlideIndex, currentSubSlideIndex])

  const resetAutoPlay = () => {
    setIsAutoPlaying(false)
    setCurrentSlideIndex(0)
    setCurrentSubSlideIndex(0)
    window.dispatchEvent(new CustomEvent('autoPlayReset'))
  }

  const setCurrentPosition = (slideIndex: number, subSlideIndex: number = 0) => {
    setCurrentSlideIndex(slideIndex)
    setCurrentSubSlideIndex(subSlideIndex)
  }

  // Listen for audio end events to trigger next slide
  useEffect(() => {
    const handleAudioEnd = () => {
      if (isAutoPlaying) {
        // Small delay before moving to next slide
        setTimeout(() => {
          moveToNextSlide()
        }, 500)
      }
    }

    const handleSlideChange = (event: CustomEvent) => {
      const { slideIndex, subSlideIndex } = event.detail
      setCurrentPosition(slideIndex, subSlideIndex || 0)
    }

    window.addEventListener('autoPlayAudioEnd', handleAudioEnd as EventListener)
    window.addEventListener('autoPlaySlideChange', handleSlideChange as EventListener)

    return () => {
      window.removeEventListener('autoPlayAudioEnd', handleAudioEnd as EventListener)
      window.removeEventListener('autoPlaySlideChange', handleSlideChange as EventListener)
    }
  }, [isAutoPlaying, moveToNextSlide])

  const value = {
    isAutoPlaying,
    currentSlideIndex,
    currentSubSlideIndex,
    toggleAutoPlay,
    moveToNextSlide,
    resetAutoPlay,
    setCurrentPosition
  }

  return (
    <AutoPlayContext.Provider value={value}>
      {children}
    </AutoPlayContext.Provider>
  )
}

export default function AutoPlayIcon() {
  const { isAutoPlaying, toggleAutoPlay } = useAutoPlay()

  return (
    <div className="fixed top-6 left-20 z-50">
      <button
        onClick={toggleAutoPlay}
        className="p-2 transition-opacity hover:opacity-70"
        aria-label={isAutoPlaying ? 'Stop auto-play' : 'Start auto-play'}
      >
        <span className="material-icons text-gray-800 dark:text-gray-200 text-2xl">
          {isAutoPlaying ? 'pause_circle' : 'play_circle'}
        </span>
      </button>
    </div>
  )
}