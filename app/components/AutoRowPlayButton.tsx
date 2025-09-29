'use client'

import { useState, useRef } from 'react'

interface AudioTrack {
  url: string
  title: string
  articleId: string
  slideIndex: number
}

interface AutoRowPlayButtonProps {
  audioTracks: AudioTrack[]
  pauseDuration?: number | null // Seconds to pause between tracks
}

export default function AutoRowPlayButton({ audioTracks, pauseDuration }: AutoRowPlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const playingRef = useRef(false)
  const rowIdRef = useRef(audioTracks.map(t => t.articleId).join('-'))
  const pausedTrackIndex = useRef<number | null>(null)

  const stopAllAudio = () => {
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  const pauseRowAudio = () => {
    // Only pause audio elements from this specific row (keep position for resume)
    audioTracks.forEach(track => {
      const audioElement = document.querySelector(`audio[data-article-id="${track.articleId}"]`) as HTMLAudioElement
      if (audioElement) {
        audioElement.pause()
        // Don't reset currentTime to allow resume
      }
    })
  }

  const stopRowAudio = () => {
    // Stop and reset audio elements from this specific row
    audioTracks.forEach(track => {
      const audioElement = document.querySelector(`audio[data-article-id="${track.articleId}"]`) as HTMLAudioElement
      if (audioElement) {
        audioElement.pause()
        audioElement.currentTime = 0
      }
    })
  }

  // Update row ID when tracks change (handles reordering/adding articles)
  const newRowId = audioTracks.map(t => t.articleId).join('-')
  if (rowIdRef.current !== newRowId) {
    // If tracks changed while playing or paused, stop the current playback
    if (isPlaying || isPaused) {
      playingRef.current = false
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentTrackIndex(null)
      pausedTrackIndex.current = null
      stopRowAudio()
    }
    rowIdRef.current = newRowId
  }

  // Don't show button if no audio tracks
  if (audioTracks.length === 0) {
    return null
  }

  const playAudio = async (audioElement: HTMLAudioElement, resetPosition: boolean = true): Promise<void> => {
    return new Promise((resolve, reject) => {
      const handleEnded = () => {
        audioElement.removeEventListener('ended', handleEnded)
        audioElement.removeEventListener('error', handleError)
        resolve()
      }

      const handleError = (error: Event) => {
        audioElement.removeEventListener('ended', handleEnded)
        audioElement.removeEventListener('error', handleError)
        console.error('Audio playback error:', error)
        reject(error)
      }

      audioElement.addEventListener('ended', handleEnded)
      audioElement.addEventListener('error', handleError)

      // Only reset position if not resuming
      if (resetPosition) {
        audioElement.currentTime = 0
      }
      audioElement.play().catch(reject)
    })
  }

  const playTracksSequentially = async (shouldContinue: { current: boolean }, startIndex: number = 0) => {
    console.log('Auto-row-play: Starting sequential playback of', audioTracks.length, 'tracks from index', startIndex)

    for (let i = startIndex; i < audioTracks.length; i++) {
      // Check if still playing (user might have stopped or paused)
      if (!shouldContinue.current) {
        console.log('Auto-row-play: Stopped/Paused by user')
        if (isPaused) {
          pausedTrackIndex.current = i  // Remember where we paused
        } else {
          setCurrentTrackIndex(null)
          pausedTrackIndex.current = null
        }
        break
      }

      const track = audioTracks[i]
      setCurrentTrackIndex(i)
      console.log(`Auto-row-play: Playing track ${i + 1}/${audioTracks.length}:`, track.title)

      // Navigate to the slide containing this track
      console.log(`Auto-row-play: Navigating to slide ${track.slideIndex}`)
      window.dispatchEvent(new CustomEvent('navigateToHorizontalSlide', {
        detail: { horizontalIndex: track.slideIndex }
      }))

      // Wait for navigation to complete
      await new Promise(resolve => setTimeout(resolve, 600))

      // Broadcast which track is now playing for visual feedback (row-specific)
      window.dispatchEvent(new CustomEvent('autoRowPlayTrackActive', {
        detail: {
          articleId: track.articleId,
          rowId: rowIdRef.current
        }
      }))

      // Find the audio element
      const audioElement = document.querySelector(`audio[data-article-id="${track.articleId}"]`) as HTMLAudioElement

      if (audioElement) {
        try {
          // Stop all other audio first (including other rows)
          stopAllAudio()
          await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for cleanup

          // Verify element is still valid after cleanup
          const verifiedAudioElement = document.querySelector(`audio[data-article-id="${track.articleId}"]`) as HTMLAudioElement
          if (verifiedAudioElement) {
            // Check if we're resuming from the same track
            const isResuming = isPaused && i === pausedTrackIndex.current
            await playAudio(verifiedAudioElement, !isResuming)
            console.log(`Auto-row-play: Completed track:`, track.title)
          } else {
            console.log(`Auto-row-play: Audio element disappeared for ${track.articleId}`)
          }
        } catch (error) {
          console.error(`Auto-row-play: Error playing track ${track.title}:`, error)
          // Continue to next track
        }
      } else {
        console.log(`Auto-row-play: Audio element not found for ${track.articleId}`)
        // Continue to next track
      }

      // Clear the active track when this track completes
      window.dispatchEvent(new CustomEvent('autoRowPlayTrackActive', {
        detail: {
          articleId: null,
          rowId: rowIdRef.current
        }
      }))

      // Add pause between tracks if configured (and not the last track)
      if (pauseDuration && pauseDuration > 0 && i < audioTracks.length - 1) {
        console.log(`Auto-row-play: Pausing for ${pauseDuration} seconds before next track`)
        await new Promise(resolve => setTimeout(resolve, pauseDuration * 1000))
      }
    }

    console.log('Auto-row-play: All tracks completed, scrolling back to first slide')

    // Navigate back to the first slide in the row
    window.dispatchEvent(new CustomEvent('navigateToHorizontalSlide', {
      detail: { horizontalIndex: 0 }
    }))

    playingRef.current = false
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentTrackIndex(null)
    pausedTrackIndex.current = null
    // Clear any active track indicators for this row
    window.dispatchEvent(new CustomEvent('autoRowPlayTrackActive', {
      detail: {
        articleId: null,
        rowId: rowIdRef.current
      }
    }))
  }

  const toggleAutoRowPlay = () => {
    if (isPlaying) {
      // Pause auto-row-play for this row only
      console.log('Auto-row-play: Pausing')
      playingRef.current = false
      setIsPlaying(false)
      setIsPaused(true)
      pauseRowAudio() // Use pause instead of stop to keep position
      // Keep track indicators active but paused
    } else if (isPaused && pausedTrackIndex.current !== null) {
      // Resume from paused position
      console.log('Auto-row-play: Resuming from track', pausedTrackIndex.current)
      playingRef.current = true
      setIsPlaying(true)
      setIsPaused(false)
      playTracksSequentially(playingRef, pausedTrackIndex.current)
    } else {
      // Start fresh auto-row-play
      console.log('Auto-row-play: Starting with', audioTracks.length, 'tracks')
      playingRef.current = true
      setIsPlaying(true)
      setIsPaused(false)
      pausedTrackIndex.current = null
      playTracksSequentially(playingRef, 0)
    }
  }

  const stopAutoRowPlay = () => {
    // Completely stop and reset
    console.log('Auto-row-play: Stopping completely')
    playingRef.current = false
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentTrackIndex(null)
    pausedTrackIndex.current = null
    stopRowAudio()
    // Clear any active track indicators for this row
    window.dispatchEvent(new CustomEvent('autoRowPlayTrackActive', {
      detail: {
        articleId: null,
        rowId: rowIdRef.current
      }
    }))
  }

  return (
    <div className="fixed top-6 left-28 z-[60] flex items-center gap-1">
      <button
        onClick={toggleAutoRowPlay}
        className="p-2 transition-opacity hover:opacity-70"
        aria-label={isPlaying ? 'Pause auto-row-play' : isPaused ? 'Resume auto-row-play' : 'Start auto-row-play'}
        title={`${isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'} ${audioTracks.length} MP3${audioTracks.length !== 1 ? 's' : ''} in this row`}
      >
        <span
          className="material-icons text-gray-800 dark:text-gray-200"
          style={{ fontSize: isPlaying || isPaused ? '28px' : '30px' }}
        >
          {isPlaying ? 'pause_circle' : isPaused ? 'play_circle' : 'playlist_play'}
        </span>
      </button>
      {isPaused && (
        <button
          onClick={stopAutoRowPlay}
          className="p-2 transition-opacity hover:opacity-70"
          aria-label="Stop auto-row-play"
          title="Stop and reset playlist"
        >
          <span
            className="material-icons text-gray-800 dark:text-gray-200"
            style={{ fontSize: '24px' }}
          >
            stop_circle
          </span>
        </button>
      )}
      {audioTracks.length > 0 && (
        <span className="text-xs text-gray-600 dark:text-gray-400 font-mono ml-1">
          {currentTrackIndex !== null
            ? `${currentTrackIndex + 1}/${audioTracks.length}`
            : pausedTrackIndex.current !== null
            ? `${pausedTrackIndex.current + 1}/${audioTracks.length}`
            : `0/${audioTracks.length}`
          }
        </span>
      )}
    </div>
  )
}