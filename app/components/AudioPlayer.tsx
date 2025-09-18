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
    console.log(`AudioPlayer ${articleId}:`, {
      isAutoPlaying,
      currentTrackIndex,
      totalTracks: audioTracks.length,
      currentTrackId: currentTrack?.articleId,
      isCurrentTrack,
      isAutoRowPlaying,
      currentRowTrackIndex,
      totalRowTracks: currentRowAudioTracks.length,
      currentRowTrackId: currentRowTrack?.articleId,
      isCurrentRowTrack,
      audioUrl
    })
  }, [isAutoPlaying, currentTrackIndex, audioTracks.length, currentTrack?.articleId, isCurrentTrack, isAutoRowPlaying, currentRowTrackIndex, currentRowAudioTracks.length, currentRowTrack?.articleId, isCurrentRowTrack, articleId, audioUrl])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setIsLoading(false)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      // Dispatch event when audio completes during auto-play
      if (isCurrentTrack) {
        window.dispatchEvent(new CustomEvent('autoPlayAudioEnd'))
      }
      // Dispatch event when audio completes during auto-row-play
      if (isCurrentRowTrack) {
        window.dispatchEvent(new CustomEvent('autoRowPlayAudioEnd'))
      }
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
  }, [audioUrl, isCurrentTrack, isCurrentRowTrack])

  // Auto-play event listeners
  useEffect(() => {
    const handleAutoPlayStart = () => {
      console.log(`AudioPlayer ${articleId} received autoPlayStart event, isCurrentTrack: ${isCurrentTrack}`)
      if (isCurrentTrack && audioRef.current) {
        const audio = audioRef.current
        console.log(`AudioPlayer ${articleId} is current track, attempting to play`)

        // Reset audio to start and play
        audio.currentTime = 0
        audio.play().then(() => {
          console.log(`AudioPlayer ${articleId} successfully started playing`)
          setIsPlaying(true)
        }).catch((error) => {
          console.error(`AudioPlayer ${articleId} failed to play:`, error)
          // If this audio failed to play, notify to try the next one
          if (isAutoPlaying) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('autoPlayAudioEnd'))
            }, 100)
          }
          // Also handle for auto-row-play
          if (isAutoRowPlaying) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('autoRowPlayAudioEnd'))
            }, 100)
          }
        })
      }
    }

    const handleAutoPlayStop = () => {
      const audio = audioRef.current
      if (audio) {
        console.log(`AudioPlayer ${articleId} stopping due to autoPlayStop`)
        audio.pause()
        audio.currentTime = 0
        setIsPlaying(false)
      }
    }

    const handleStopAllAudio = () => {
      const audio = audioRef.current
      if (audio) {
        console.log(`AudioPlayer ${articleId} stopping due to stopAllAudio`)
        audio.pause()
        audio.currentTime = 0
        setIsPlaying(false)
      }
    }

    const handleAutoRowPlayStart = () => {
      console.log(`AudioPlayer ${articleId} received autoRowPlayStart event, isCurrentRowTrack: ${isCurrentRowTrack}`)
      if (isCurrentRowTrack && audioRef.current) {
        const audio = audioRef.current
        console.log(`AudioPlayer ${articleId} is current row track, attempting to play`)

        // Reset audio to start and play
        audio.currentTime = 0
        audio.play().then(() => {
          console.log(`AudioPlayer ${articleId} successfully started playing (row play)`)
          setIsPlaying(true)
        }).catch((error) => {
          console.error(`AudioPlayer ${articleId} failed to play (row play):`, error)
          // If this audio failed to play, notify to try the next one
          if (isAutoRowPlaying) {
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('autoRowPlayAudioEnd'))
            }, 100)
          }
        })
      }
    }

    const handleAutoRowPlayStop = () => {
      const audio = audioRef.current
      if (audio) {
        console.log(`AudioPlayer ${articleId} stopping due to autoRowPlayStop`)
        audio.pause()
        audio.currentTime = 0
        setIsPlaying(false)
      }
    }

    window.addEventListener('autoPlayStart', handleAutoPlayStart)
    window.addEventListener('autoPlayStop', handleAutoPlayStop)
    window.addEventListener('autoRowPlayStart', handleAutoRowPlayStart)
    window.addEventListener('autoRowPlayStop', handleAutoRowPlayStop)
    window.addEventListener('stopAllAudio', handleStopAllAudio)

    return () => {
      window.removeEventListener('autoPlayStart', handleAutoPlayStart)
      window.removeEventListener('autoPlayStop', handleAutoPlayStop)
      window.removeEventListener('autoRowPlayStart', handleAutoRowPlayStart)
      window.removeEventListener('autoRowPlayStop', handleAutoRowPlayStop)
      window.removeEventListener('stopAllAudio', handleStopAllAudio)
    }
  }, [isCurrentTrack, articleId, isAutoPlaying, isCurrentRowTrack, isAutoRowPlaying])

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
    <div className="inline-flex">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
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