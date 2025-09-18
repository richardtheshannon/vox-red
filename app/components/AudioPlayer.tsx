'use client'

import { useState, useRef, useEffect } from 'react'
import { useAutoPlay } from './AutoPlayManager'
import { useAutoRowPlay } from './AutoRowPlayManager'

interface AudioPlayerProps {
  audioUrl: string
  title?: string
  articleId: string
}

export default function AudioPlayer({ audioUrl, articleId }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const { isAutoPlaying, currentTrackIndex, audioTracks } = useAutoPlay()
  const { isAutoRowPlaying, currentRowTrackIndex, currentRowAudioTracks } = useAutoRowPlay()

  // Check if this is the current track in auto-play
  const currentTrack = audioTracks[currentTrackIndex]
  const isCurrentTrack = isAutoPlaying && currentTrack?.articleId === articleId

  // Check if this is the current track in auto-row-play
  const currentRowTrack = currentRowAudioTracks[currentRowTrackIndex]
  const isCurrentRowTrack = isAutoRowPlaying && currentRowTrack?.articleId === articleId

  // Debug logging
  useEffect(() => {
    console.log(`=== AudioPlayer DEBUG ===`)
    console.log(`AudioPlayer ID: ${articleId}`)
    console.log(`Audio URL: ${audioUrl}`)
    console.log('Current row tracks:', currentRowAudioTracks.map(t => ({ id: t.articleId, title: t.title })))
    console.log('Is this player in current row tracks?', currentRowAudioTracks.some(t => t.articleId === articleId))
  }, [articleId, audioUrl, currentRowAudioTracks])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setIsLoading(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // No longer need to dispatch events - direct control handles progression
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

  // No longer need complex event listeners - using direct DOM manipulation
  useEffect(() => {
    const handleStopAllAudio = () => {
      const audio = audioRef.current
      if (audio) {
        console.log(`AudioPlayer ${articleId} stopping due to stopAllAudio`)
        audio.pause()
        audio.currentTime = 0
        setIsPlaying(false)
      }
    }

    // Keep only the stopAllAudio event for manual controls
    window.addEventListener('stopAllAudio', handleStopAllAudio)

    return () => {
      window.removeEventListener('stopAllAudio', handleStopAllAudio)
    }
  }, [articleId])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      // Just pause this audio
      audio.pause()
      setIsPlaying(false)
    } else {
      // Stop all other audio first, then play this one
      window.dispatchEvent(new CustomEvent('stopAllAudio'))

      setTimeout(() => {
        audio.currentTime = 0
        audio.play().then(() => {
          setIsPlaying(true)
        }).catch(console.error)
      }, 100)
    }
  }

  return (
    <div className="inline-flex" data-article-id={articleId}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" data-article-id={articleId} />
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isCurrentTrack
            ? 'bg-blue-100 hover:bg-blue-200 dark:bg-blue-800 dark:hover:bg-blue-700'
            : isCurrentRowTrack
            ? 'bg-green-100 hover:bg-green-200 dark:bg-green-800 dark:hover:bg-green-700'
            : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
        } disabled:opacity-50`}
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