'use client'

import { useState, useRef, useEffect } from 'react'

interface AudioPlayerProps {
  audioUrl: string
  title?: string
  autoPlay?: boolean
}

export default function AudioPlayer({ audioUrl, autoPlay = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setIsLoading(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // Dispatch auto-play audio end event
      window.dispatchEvent(new CustomEvent('autoPlayAudioEnd'))
    }

    const handleLoadStart = () => {
      setIsLoading(true)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadstart', handleLoadStart)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadstart', handleLoadStart)
    }
  }, [audioUrl])

  // Auto-play event listeners
  useEffect(() => {
    const handleAutoPlayStart = () => {
      if (autoPlay) {
        const audio = audioRef.current
        if (audio && !isPlaying) {
          audio.play()
          setIsPlaying(true)
        }
      }
    }

    const handleAutoPlayStop = () => {
      const audio = audioRef.current
      if (audio && isPlaying) {
        audio.pause()
        setIsPlaying(false)
      }
    }

    window.addEventListener('autoPlayStart', handleAutoPlayStart)
    window.addEventListener('autoPlayStop', handleAutoPlayStop)

    return () => {
      window.removeEventListener('autoPlayStart', handleAutoPlayStart)
      window.removeEventListener('autoPlayStop', handleAutoPlayStop)
    }
  }, [autoPlay, isPlaying])

  // Auto-start audio when autoPlay is enabled and component becomes active
  useEffect(() => {
    if (autoPlay) {
      const audio = audioRef.current
      if (audio && !isPlaying) {
        const timer = setTimeout(() => {
          audio.play()
          setIsPlaying(true)
        }, 500) // Small delay to ensure slide transition is complete

        return () => clearTimeout(timer)
      }
    }
  }, [autoPlay, isPlaying])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div className="inline-flex">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className="w-8 h-8 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 rounded-full flex items-center justify-center transition-colors"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isLoading ? (
          <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <svg className="w-3 h-3 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
          </svg>
        ) : (
          <svg className="w-3 h-3 ml-0.5 text-gray-600 dark:text-gray-300" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        )}
      </button>
    </div>
  )
}