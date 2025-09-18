'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { usePathname } from 'next/navigation'

interface AudioTrack {
  url: string
  title: string
  articleId: string
  horizontalIndex: number // Position within the current row (0 = main, 1+ = sub-articles)
}

interface Article {
  id: string
  title: string
  subtitle?: string | null
  content: string
  audioUrl?: string | null
  orderPosition: number
  textAlign?: string
  verticalAlign?: string
  parentId?: string | null
  subArticles?: Article[]
}

interface AutoRowPlayContextType {
  isAutoRowPlaying: boolean
  currentRowTrackIndex: number
  currentRowAudioTracks: AudioTrack[]
  currentVerticalIndex: number
  toggleAutoRowPlay: () => void
  updateCurrentRow: (verticalIndex: number) => void
}

const AutoRowPlayContext = createContext<AutoRowPlayContextType | undefined>(undefined)

export function useAutoRowPlay() {
  const context = useContext(AutoRowPlayContext)
  if (context === undefined) {
    throw new Error('useAutoRowPlay must be used within an AutoRowPlayProvider')
  }
  return context
}

interface AutoRowPlayProviderProps {
  children: ReactNode
}

export function AutoRowPlayProvider({ children }: AutoRowPlayProviderProps) {
  console.log('AutoRowPlayProvider initialized')
  const [isAutoRowPlaying, setIsAutoRowPlaying] = useState(false)
  const [currentRowTrackIndex, setCurrentRowTrackIndex] = useState(0)
  const [currentRowAudioTracks, setCurrentRowAudioTracks] = useState<AudioTrack[]>([])
  const [currentVerticalIndex, setCurrentVerticalIndex] = useState(0)
  const [allArticles, setAllArticles] = useState<Article[]>([])

  // Fetch all articles once
  useEffect(() => {
    console.log('AutoRowPlayProvider: Starting to fetch all articles')
    const fetchAllArticles = async () => {
      try {
        console.log('AutoRowPlayProvider: Fetching /api/articles')
        const response = await fetch('/api/articles')
        const articles = await response.json()
        console.log('AutoRowPlayProvider: Received articles:', articles.length)
        setAllArticles(articles)
      } catch (error) {
        console.error('Failed to fetch articles:', error)
      }
    }

    fetchAllArticles()
  }, [])

  // Update current row tracks when vertical index changes
  const updateCurrentRow = useCallback((verticalIndex: number) => {
    console.log('AutoRowPlayProvider: Updating current row to vertical index:', verticalIndex)
    setCurrentVerticalIndex(verticalIndex)

    if (allArticles.length === 0) return

    const currentArticle = allArticles[verticalIndex]
    if (!currentArticle) return

    const rowTracks: AudioTrack[] = []

    // Add main article if it has audio
    if (currentArticle.audioUrl) {
      console.log('Adding main article to row tracks:', currentArticle.id, currentArticle.title)
      rowTracks.push({
        url: currentArticle.audioUrl,
        title: currentArticle.title,
        articleId: currentArticle.id,
        horizontalIndex: 0
      })
    }

    // Add sub-articles in order (left to right)
    if (currentArticle.subArticles) {
      currentArticle.subArticles.forEach((subArticle: Article, subIndex: number) => {
        if (subArticle.audioUrl) {
          console.log('Adding sub-article to row tracks:', subArticle.id, subArticle.title, 'at horizontal position', subIndex + 1)
          rowTracks.push({
            url: subArticle.audioUrl,
            title: subArticle.title,
            articleId: subArticle.id,
            horizontalIndex: subIndex + 1
          })
        }
      })
    }

    console.log('Found row audio tracks:', rowTracks)
    setCurrentRowAudioTracks(rowTracks)
    setCurrentRowTrackIndex(0) // Reset to first track in the row
  }, [allArticles])

  // Update current row when articles are loaded
  useEffect(() => {
    if (allArticles.length > 0) {
      updateCurrentRow(currentVerticalIndex)
    }
  }, [allArticles, currentVerticalIndex, updateCurrentRow])

  const toggleAutoRowPlay = () => {
    setIsAutoRowPlaying(prev => {
      const newState = !prev
      console.log('Toggling auto-row-play to:', newState)

      if (newState) {
        // Starting auto-row-play
        console.log('Starting auto-row-play, available tracks in current row:', currentRowAudioTracks.length)

        // First stop all audio to ensure clean start
        window.dispatchEvent(new CustomEvent('stopAllAudio'))

        setCurrentRowTrackIndex(0)

        // If we have tracks in the current row, start with the first one
        if (currentRowAudioTracks.length > 0) {
          const firstTrack = currentRowAudioTracks[0]
          console.log(`First track in row is at horizontal position: ${firstTrack.horizontalIndex}`)

          // Navigate to the first track's horizontal position in current row
          if (firstTrack.horizontalIndex > 0) {
            window.dispatchEvent(new CustomEvent('navigateToHorizontalSlide', {
              detail: { horizontalIndex: firstTrack.horizontalIndex }
            }))

            // Wait for navigation and then start playback
            setTimeout(() => {
              console.log('Dispatching autoRowPlayStart event for track 0')
              window.dispatchEvent(new CustomEvent('autoRowPlayStart'))
            }, 500) // Give time for navigation
          } else {
            // Track is on main slide, start immediately
            setTimeout(() => {
              console.log('Dispatching autoRowPlayStart event for track 0 (main slide)')
              window.dispatchEvent(new CustomEvent('autoRowPlayStart'))
            }, 200)
          }
        }
      } else {
        // Stopping auto-row-play
        console.log('Stopping auto-row-play')
        window.dispatchEvent(new CustomEvent('autoRowPlayStop'))
        window.dispatchEvent(new CustomEvent('stopAllAudio'))
      }
      return newState
    })
  }

  // Listen for audio end events to play next track in the row
  useEffect(() => {
    const handleAudioEnd = () => {
      console.log('Row audio ended, checking for next track in row...')
      if (isAutoRowPlaying && currentRowAudioTracks.length > 0) {
        const nextIndex = currentRowTrackIndex + 1
        console.log(`Current row track ${currentRowTrackIndex} ended, next index would be ${nextIndex}`)

        if (nextIndex < currentRowAudioTracks.length) {
          // First stop all audio to ensure clean transition
          window.dispatchEvent(new CustomEvent('stopAllAudio'))

          // Update to next track index
          setCurrentRowTrackIndex(nextIndex)

          // Get the next track to determine if we need to navigate horizontally
          const nextTrack = currentRowAudioTracks[nextIndex]
          console.log(`Next track in row: ${nextTrack.title} at horizontal index ${nextTrack.horizontalIndex}`)

          // Navigate to the correct horizontal position
          if (nextTrack.horizontalIndex > 0) {
            window.dispatchEvent(new CustomEvent('navigateToHorizontalSlide', {
              detail: { horizontalIndex: nextTrack.horizontalIndex }
            }))

            // Wait for navigation to complete before starting audio
            setTimeout(() => {
              console.log(`Starting next row track after navigation: ${nextIndex}`)
              window.dispatchEvent(new CustomEvent('autoRowPlayStart'))
            }, 500)
          } else {
            // Navigate back to main slide
            window.dispatchEvent(new CustomEvent('navigateToHorizontalSlide', {
              detail: { horizontalIndex: 0 }
            }))

            setTimeout(() => {
              console.log(`Starting next row track on main slide: ${nextIndex}`)
              window.dispatchEvent(new CustomEvent('autoRowPlayStart'))
            }, 500)
          }
        } else {
          // End of row playlist - stop auto-row-play
          console.log('End of row playlist, stopping auto-row-play')
          setIsAutoRowPlaying(false)
          setCurrentRowTrackIndex(0)
          window.dispatchEvent(new CustomEvent('autoRowPlayStop'))
          window.dispatchEvent(new CustomEvent('stopAllAudio'))
        }
      }
    }

    window.addEventListener('autoRowPlayAudioEnd', handleAudioEnd as EventListener)

    return () => {
      window.removeEventListener('autoRowPlayAudioEnd', handleAudioEnd as EventListener)
    }
  }, [isAutoRowPlaying, currentRowTrackIndex, currentRowAudioTracks])

  const value = {
    isAutoRowPlaying,
    currentRowTrackIndex,
    currentRowAudioTracks,
    currentVerticalIndex,
    toggleAutoRowPlay,
    updateCurrentRow
  }

  return (
    <AutoRowPlayContext.Provider value={value}>
      {children}
    </AutoRowPlayContext.Provider>
  )
}

export default function AutoRowPlayIcon() {
  const { isAutoRowPlaying, toggleAutoRowPlay, currentRowAudioTracks } = useAutoRowPlay()
  const pathname = usePathname()

  // Don't show on admin pages
  const isAdminPage = pathname?.startsWith('/admin')
  if (isAdminPage) return null

  // Only show if current row has MP3 tracks
  if (currentRowAudioTracks.length === 0) return null

  return (
    <div className="fixed top-6 left-36 z-50">
      <button
        onClick={toggleAutoRowPlay}
        className="p-2 transition-opacity hover:opacity-70"
        aria-label={isAutoRowPlaying ? 'Stop auto-row-play' : 'Start auto-row-play'}
        title={`${isAutoRowPlaying ? 'Stop' : 'Play'} ${currentRowAudioTracks.length} MP3${currentRowAudioTracks.length !== 1 ? 's' : ''} in this row`}
      >
        <span className="material-icons text-gray-800 dark:text-gray-200 text-2xl">
          {isAutoRowPlaying ? 'stop_circle' : 'playlist_play'}
        </span>
      </button>
    </div>
  )
}