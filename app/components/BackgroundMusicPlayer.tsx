'use client'

import { useState, useEffect, useRef } from 'react'

export default function BackgroundMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Fetch the background music URL from settings
    fetch('/api/settings/background-music')
      .then(res => res.json())
      .then(data => {
        if (data.url) {
          setAudioUrl(data.url)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!audioUrl) return

    // Create audio element
    audioRef.current = new Audio(audioUrl)
    audioRef.current.loop = true
    audioRef.current.volume = 0.3 // Background volume level

    // Restore play state from localStorage
    const savedState = localStorage.getItem('backgroundMusicPlaying')
    if (savedState === 'true') {
      audioRef.current.play()
      setIsPlaying(true)
    }

    // Cleanup
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [audioUrl])

  const togglePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
      localStorage.setItem('backgroundMusicPlaying', 'false')
    } else {
      audioRef.current.play()
      setIsPlaying(true)
      localStorage.setItem('backgroundMusicPlaying', 'true')
    }
  }

  // Don't render the button if no URL is configured
  if (!audioUrl) return null

  return (
    <button
      onClick={togglePlayPause}
      className={`fixed top-6 left-[71px] z-50 p-2 rounded-full transition-colors ${
        isPlaying ? 'text-red-600 hover:text-red-700' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
      }`}
      title={isPlaying ? 'Stop background music' : 'Play background music'}
    >
      <span className="material-icons" style={{ fontSize: '24px' }}>
        spa
      </span>
    </button>
  )
}