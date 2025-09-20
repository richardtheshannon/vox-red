'use client'

import { useState, useEffect, useRef } from 'react'

export default function BackgroundMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioUrl = 'https://vox.red/mp3/_backing-tracks/X_backing-track-02.mp3'

  useEffect(() => {
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
  }, [])

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