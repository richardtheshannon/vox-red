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
}

export default function AutoRowPlayButton({ audioTracks }: AutoRowPlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(null)
  const playingRef = useRef(false)
  const rowIdRef = useRef(audioTracks.map(t => t.articleId).join('-'))

  const stopAllAudio = () => {
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  const stopRowAudio = () => {
    // Only stop audio elements from this specific row
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
    // If tracks changed while playing, stop the current playback
    if (isPlaying) {
      playingRef.current = false
      setIsPlaying(false)
      setCurrentTrackIndex(null)
      stopRowAudio()
    }
    rowIdRef.current = newRowId
  }

  // Don't show button if no audio tracks
  if (audioTracks.length === 0) {
    return null
  }

  const playAudio = async (audioElement: HTMLAudioElement): Promise<void> => {
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

      audioElement.currentTime = 0
      audioElement.play().catch(reject)
    })
  }

  const playTracksSequentially = async (shouldContinue: { current: boolean }) => {
    console.log('Auto-row-play: Starting sequential playback of', audioTracks.length, 'tracks')

    for (let i = 0; i < audioTracks.length; i++) {
      // Check if still playing (user might have stopped)
      if (!shouldContinue.current) {
        console.log('Auto-row-play: Stopped by user')
        setCurrentTrackIndex(null)
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
            await playAudio(verifiedAudioElement)
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
    }

    console.log('Auto-row-play: All tracks completed, scrolling back to first slide')

    // Navigate back to the first slide in the row
    window.dispatchEvent(new CustomEvent('navigateToHorizontalSlide', {
      detail: { horizontalIndex: 0 }
    }))

    playingRef.current = false
    setIsPlaying(false)
    setCurrentTrackIndex(null)
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
      // Stop auto-row-play for this row only
      console.log('Auto-row-play: Stopping')
      playingRef.current = false
      setIsPlaying(false)
      setCurrentTrackIndex(null)
      stopRowAudio() // Use row-specific stop instead of stopping all audio
      // Clear any active track indicators for this row
      window.dispatchEvent(new CustomEvent('autoRowPlayTrackActive', {
        detail: {
          articleId: null,
          rowId: rowIdRef.current
        }
      }))
    } else {
      // Start auto-row-play
      console.log('Auto-row-play: Starting with', audioTracks.length, 'tracks')
      playingRef.current = true
      setIsPlaying(true)
      playTracksSequentially(playingRef)
    }
  }

  return (
    <div className="fixed top-6 left-28 z-[60] flex items-center gap-2">
      <button
        onClick={toggleAutoRowPlay}
        className="p-2 transition-opacity hover:opacity-70"
        aria-label={isPlaying ? 'Stop auto-row-play' : 'Start auto-row-play'}
        title={`${isPlaying ? 'Stop' : 'Play'} ${audioTracks.length} MP3${audioTracks.length !== 1 ? 's' : ''} in this row`}
      >
        <span
          className="material-icons text-gray-800 dark:text-gray-200"
          style={{ fontSize: isPlaying ? '24px' : '30px' }}
        >
          {isPlaying ? 'stop_circle' : 'playlist_play'}
        </span>
      </button>
      {audioTracks.length > 0 && (
        <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
          {currentTrackIndex !== null
            ? `${currentTrackIndex + 1}/${audioTracks.length}`
            : `0/${audioTracks.length}`
          }
        </span>
      )}
    </div>
  )
}