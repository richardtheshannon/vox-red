'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface AudioTrack {
  url: string
  title: string
  articleId: string
  verticalIndex: number  // Which vertical slide (main article)
  horizontalIndex: number // Which horizontal slide (0 = main, 1+ = sub-articles)
}

interface AutoPlayContextType {
  isAutoPlaying: boolean
  currentTrackIndex: number
  audioTracks: AudioTrack[]
  toggleAutoPlay: () => void
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
  console.log('AutoPlayProvider initialized')
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [audioTracks, setAudioTracks] = useState<AudioTrack[]>([])

  // Fetch and organize all audio tracks in the correct order
  useEffect(() => {
    console.log('AutoPlayProvider: Starting to fetch audio tracks')
    const fetchAudioTracks = async () => {
      try {
        console.log('AutoPlayProvider: Fetching /api/articles')
        const response = await fetch('/api/articles')
        const articles = await response.json()
        console.log('AutoPlayProvider: Received articles:', articles.length)

        const tracks: AudioTrack[] = []

        // Process each main article and its sub-articles in order
        articles.forEach((article: {
          id: string
          title: string
          audioUrl?: string | null
          subArticles?: {
            id: string
            title: string
            audioUrl?: string | null
          }[]
        }, verticalIndex: number) => {
          // Add main article if it has audio
          if (article.audioUrl) {
            console.log('Adding main article to tracks:', article.id, article.title, 'at position', verticalIndex, 0)
            tracks.push({
              url: article.audioUrl,
              title: article.title,
              articleId: article.id,
              verticalIndex,
              horizontalIndex: 0
            })
          }

          // Add sub-articles in order (left to right)
          if (article.subArticles) {
            article.subArticles.forEach((subArticle, subIndex) => {
              if (subArticle.audioUrl) {
                console.log('Adding sub-article to tracks:', subArticle.id, subArticle.title, 'at position', verticalIndex, subIndex + 1)
                tracks.push({
                  url: subArticle.audioUrl,
                  title: subArticle.title,
                  articleId: subArticle.id,
                  verticalIndex,
                  horizontalIndex: subIndex + 1
                })
              }
            })
          }
        })

        console.log('Found audio tracks:', tracks)
        setAudioTracks(tracks)
      } catch (error) {
        console.error('Failed to fetch audio tracks:', error)
      }
    }

    fetchAudioTracks()
  }, [])

  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => {
      const newState = !prev
      console.log('Toggling auto-play to:', newState)
      if (newState) {
        // Starting auto-play
        console.log('Starting auto-play, available tracks:', audioTracks.length)

        // First stop all audio to ensure clean start
        window.dispatchEvent(new CustomEvent('stopAllAudio'))

        setCurrentTrackIndex(0)

        // If we have tracks, navigate to the first one if needed
        if (audioTracks.length > 0) {
          const firstTrack = audioTracks[0]
          console.log(`First track is at: vertical=${firstTrack.verticalIndex}, horizontal=${firstTrack.horizontalIndex}`)

          // Navigate to the first track's slide
          window.dispatchEvent(new CustomEvent('autoPlayNavigate', {
            detail: {
              verticalIndex: firstTrack.verticalIndex,
              horizontalIndex: firstTrack.horizontalIndex
            }
          }))

          // Wait for navigation and then start playback
          setTimeout(() => {
            console.log('Dispatching autoPlayStart event for track 0')
            window.dispatchEvent(new CustomEvent('autoPlayStart'))
          }, 800) // Give time for navigation
        }
      } else {
        // Stopping auto-play
        console.log('Stopping auto-play')
        window.dispatchEvent(new CustomEvent('autoPlayStop'))
        window.dispatchEvent(new CustomEvent('stopAllAudio'))
      }
      return newState
    })
  }

  // Listen for audio end events to play next track
  useEffect(() => {
    const handleAudioEnd = () => {
      console.log('Audio ended, checking for next track...')
      if (isAutoPlaying && audioTracks.length > 0) {
        const nextIndex = currentTrackIndex + 1
        console.log(`Current track ${currentTrackIndex} ended, next index would be ${nextIndex}`)

        if (nextIndex < audioTracks.length) {
          // First stop all audio to ensure clean transition
          window.dispatchEvent(new CustomEvent('stopAllAudio'))

          // Update to next track index
          setCurrentTrackIndex(nextIndex)

          // Get the next track to determine if we need to navigate
          const nextTrack = audioTracks[nextIndex]
          const currentTrack = audioTracks[currentTrackIndex]

          // Check if we need to navigate to a different slide
          if (currentTrack && nextTrack &&
              (nextTrack.verticalIndex !== currentTrack.verticalIndex ||
               nextTrack.horizontalIndex !== currentTrack.horizontalIndex)) {

            console.log(`Navigating to slide: vertical=${nextTrack.verticalIndex}, horizontal=${nextTrack.horizontalIndex}`)

            // Dispatch navigation event to move to the correct slide
            window.dispatchEvent(new CustomEvent('autoPlayNavigate', {
              detail: {
                verticalIndex: nextTrack.verticalIndex,
                horizontalIndex: nextTrack.horizontalIndex
              }
            }))

            // Wait longer for navigation to complete before starting audio
            setTimeout(() => {
              console.log(`Starting next track after navigation: ${nextIndex}`)
              window.dispatchEvent(new CustomEvent('autoPlayStart'))
            }, 800) // Give time for slide navigation
          } else {
            // Same slide, just wait for audio cleanup
            setTimeout(() => {
              console.log(`Starting next track on same slide: ${nextIndex}`)
              window.dispatchEvent(new CustomEvent('autoPlayStart'))
            }, 300) // Give enough time for audio cleanup
          }
        } else {
          // End of playlist - stop auto-play
          console.log('End of playlist, stopping auto-play')
          setIsAutoPlaying(false)
          setCurrentTrackIndex(0)
          window.dispatchEvent(new CustomEvent('autoPlayStop'))
          window.dispatchEvent(new CustomEvent('stopAllAudio'))
        }
      }
    }

    window.addEventListener('autoPlayAudioEnd', handleAudioEnd as EventListener)

    return () => {
      window.removeEventListener('autoPlayAudioEnd', handleAudioEnd as EventListener)
    }
  }, [isAutoPlaying, currentTrackIndex, audioTracks])

  const value = {
    isAutoPlaying,
    currentTrackIndex,
    audioTracks,
    toggleAutoPlay
  }

  return (
    <AutoPlayContext.Provider value={value}>
      {children}
    </AutoPlayContext.Provider>
  )
}

export default function AutoPlayIcon() {
  const { isAutoPlaying, toggleAutoPlay } = useAutoPlay()
  const pathname = usePathname()

  // Don't show on admin pages
  const isAdminPage = pathname?.startsWith('/admin')
  if (isAdminPage) return null

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