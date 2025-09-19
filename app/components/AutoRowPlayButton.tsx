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

  // Don't show button if no audio tracks
  if (audioTracks.length === 0) {
    return null
  }

  const stopAllAudio = () => {
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
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

      // Find the audio element
      const audioElement = document.querySelector(`audio[data-article-id="${track.articleId}"]`) as HTMLAudioElement

      if (audioElement) {
        try {
          // Stop all other audio first
          stopAllAudio()
          await new Promise(resolve => setTimeout(resolve, 100)) // Small delay for cleanup

          // Play this track
          await playAudio(audioElement)
          console.log(`Auto-row-play: Completed track:`, track.title)
        } catch (error) {
          console.error(`Auto-row-play: Error playing track ${track.title}:`, error)
          // Continue to next track
        }
      } else {
        console.log(`Auto-row-play: Audio element not found for ${track.articleId}`)
        // Continue to next track
      }
    }

    console.log('Auto-row-play: All tracks completed')
    playingRef.current = false
    setIsPlaying(false)
    setCurrentTrackIndex(null)
  }

  const toggleAutoRowPlay = () => {
    if (isPlaying) {
      // Stop auto-row-play
      console.log('Auto-row-play: Stopping')
      playingRef.current = false
      setIsPlaying(false)
      setCurrentTrackIndex(null)
      stopAllAudio()
    } else {
      // Start auto-row-play
      console.log('Auto-row-play: Starting with', audioTracks.length, 'tracks')
      playingRef.current = true
      setIsPlaying(true)
      playTracksSequentially(playingRef)
    }
  }

  return (
    <div className="fixed top-6 left-16 z-50 flex items-center gap-2">
      <button
        onClick={toggleAutoRowPlay}
        className="p-2 transition-opacity hover:opacity-70"
        aria-label={isPlaying ? 'Stop auto-row-play' : 'Start auto-row-play'}
        title={`${isPlaying ? 'Stop' : 'Play'} ${audioTracks.length} MP3${audioTracks.length !== 1 ? 's' : ''} in this row`}
      >
        <span className="material-icons text-gray-800 dark:text-gray-200 text-2xl">
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