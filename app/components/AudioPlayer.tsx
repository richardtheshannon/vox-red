'use client'

import { useState, useRef, useEffect } from 'react'
import YouTubeAudioPlayer from './YouTubeAudioPlayer'

interface AudioPlayerProps {
  audioUrl: string
  title?: string
  articleId: string
}

// Utility function to detect YouTube URLs
const isYouTubeUrl = (url: string): boolean => {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(url)
}

// Standard HTML5 Audio Player Component
function StandardAudioPlayer({ audioUrl, articleId }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoRowPlayActive, setIsAutoRowPlayActive] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

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

    const handleAutoRowPlayTrackActive = (event: CustomEvent) => {
      const { articleId: activeArticleId, rowId } = event.detail
      // Only respond if this is for our row (check if our articleId exists in the rowId)
      const isOurRow = rowId ? rowId.includes(articleId) : true // fallback for backward compatibility
      if (isOurRow) {
        setIsAutoRowPlayActive(activeArticleId === articleId)
      }
    }

    // Keep only the stopAllAudio event for manual controls
    window.addEventListener('stopAllAudio', handleStopAllAudio)
    window.addEventListener('autoRowPlayTrackActive', handleAutoRowPlayTrackActive as EventListener)

    return () => {
      window.removeEventListener('stopAllAudio', handleStopAllAudio)
      window.removeEventListener('autoRowPlayTrackActive', handleAutoRowPlayTrackActive as EventListener)
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
        className="w-8 h-8 rounded-full flex items-center justify-center transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isLoading ? (
          <span className="material-icons text-sm text-gray-600 dark:text-gray-300 animate-spin">
            hourglass_empty
          </span>
        ) : (isPlaying || isAutoRowPlayActive) ? (
          <span className="material-icons text-sm text-red-500">
            {isPlaying ? 'pause_circle' : 'play_circle'}
          </span>
        ) : (
          <span className="material-icons text-sm text-gray-600 dark:text-gray-300">
            play_circle
          </span>
        )}
      </button>
    </div>
  )
}

// Main AudioPlayer component that routes to appropriate player
export default function AudioPlayer({ audioUrl, articleId }: AudioPlayerProps) {
  // Route to YouTube player if URL is a YouTube link
  if (isYouTubeUrl(audioUrl)) {
    return <YouTubeAudioPlayer audioUrl={audioUrl} articleId={articleId} />
  }

  // Use standard HTML5 audio player for MP3s and other audio files
  return <StandardAudioPlayer audioUrl={audioUrl} articleId={articleId} />
}