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

  // State tracking for debugging
  console.log('AutoRowPlayProvider: allArticles:', allArticles.length, 'tracks:', currentRowAudioTracks.length)

  // Simplified useEffect - just fetch articles ONCE
  useEffect(() => {
    console.log('=== useEffect FINALLY TRIGGERED ===')
    console.log('Fetching articles...')

    fetch('/api/articles')
      .then(response => {
        console.log('useEffect: Fetch response status:', response.status)
        return response.json()
      })
      .then(articles => {
        console.log('useEffect: Received articles count:', articles.length)
        console.log('useEffect: First article:', articles[0]?.title || 'No articles')
        console.log('useEffect: About to call setAllArticles')
        setAllArticles(articles)
        console.log('useEffect: setAllArticles called successfully')
      })
      .catch(error => {
        console.error('useEffect: Failed to fetch:', error)
      })
  }, []) // EMPTY DEPENDENCY ARRAY

  // Update current row tracks when vertical index changes
  const updateCurrentRow = useCallback((verticalIndex: number) => {
    console.log('=== UPDATE CURRENT ROW ===')
    console.log('AutoRowPlayProvider: Updating current row to vertical index:', verticalIndex)
    console.log('All articles count:', allArticles.length)
    setCurrentVerticalIndex(verticalIndex)

    if (allArticles.length === 0) {
      console.log('AutoRowPlayProvider: No articles loaded yet, skipping row update')
      return
    }

    const currentArticle = allArticles[verticalIndex]
    if (!currentArticle) {
      console.log('AutoRowPlayProvider: No article found at vertical index:', verticalIndex)
      return
    }

    console.log('AutoRowPlayProvider: Found article at index', verticalIndex, ':', {
      id: currentArticle.id,
      title: currentArticle.title,
      hasAudio: !!currentArticle.audioUrl,
      audioUrl: currentArticle.audioUrl,
      subArticlesCount: currentArticle.subArticles?.length || 0
    })

    const rowTracks: AudioTrack[] = []

    // Add main article if it has audio
    if (currentArticle.audioUrl) {
      console.log('=== ADDING MAIN ARTICLE TO TRACKS ===')
      console.log('Main article ID:', currentArticle.id)
      console.log('Main article title:', currentArticle.title)
      console.log('Main article audioUrl:', currentArticle.audioUrl)
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
          console.log('=== ADDING SUB-ARTICLE TO TRACKS ===')
          console.log('Sub-article ID:', subArticle.id)
          console.log('Sub-article title:', subArticle.title)
          console.log('Sub-article audioUrl:', subArticle.audioUrl)
          console.log('Horizontal position:', subIndex + 1)
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

  // Initialize first row when articles are loaded
  useEffect(() => {
    if (allArticles.length > 0) {
      console.log('AutoRowPlayProvider: Articles loaded, re-initializing current row:', currentVerticalIndex)
      // Re-run the row tracking logic now that articles are available
      const currentArticle = allArticles[currentVerticalIndex]
      if (!currentArticle) return

      const rowTracks: AudioTrack[] = []

      // Add main article if it has audio
      if (currentArticle.audioUrl) {
        console.log('Articles loaded: Adding main article to row tracks:', currentArticle.id, currentArticle.title)
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
            console.log('Articles loaded: Adding sub-article to row tracks:', subArticle.id, subArticle.title, 'at horizontal position', subIndex + 1)
            rowTracks.push({
              url: subArticle.audioUrl,
              title: subArticle.title,
              articleId: subArticle.id,
              horizontalIndex: subIndex + 1
            })
          }
        })
      }

      console.log('Articles loaded: Found row audio tracks:', rowTracks)
      setCurrentRowAudioTracks(rowTracks)
      setCurrentRowTrackIndex(0)
    }
  }, [allArticles, currentVerticalIndex]) // Include currentVerticalIndex dependency

  const toggleAutoRowPlay = async () => {
    setIsAutoRowPlaying(prev => {
      const newState = !prev
      console.log('=== TOGGLE AUTO-ROW-PLAY ===')
      console.log('Toggling auto-row-play to:', newState)
      console.log('Current vertical index:', currentVerticalIndex)
      console.log('Current row audio tracks:', currentRowAudioTracks)
      console.log('All articles loaded:', allArticles.length)

      if (newState) {
        // Starting auto-row-play
        console.log('Starting auto-row-play, available tracks in current row:', currentRowAudioTracks.length)

        if (currentRowAudioTracks.length === 0) {
          console.error('ERROR: No audio tracks found in current row! Cannot start auto-row-play.')
          return false // Don't start if no tracks
        }

        // Start playing the row tracks sequentially
        playRowTracksSequentially()
      } else {
        // Stopping auto-row-play
        console.log('Stopping auto-row-play')
        stopAllAudio()
      }
      return newState
    })
  }

  const stopAllAudio = () => {
    const audioElements = document.querySelectorAll('audio')
    audioElements.forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
  }

  const navigateToHorizontalSlide = async (horizontalIndex: number): Promise<void> => {
    return new Promise(resolve => {
      window.dispatchEvent(new CustomEvent('navigateToHorizontalSlide', {
        detail: { horizontalIndex }
      }))
      // Wait for navigation to complete
      setTimeout(resolve, 800)
    })
  }

  const findAudioPlayerByArticleId = (articleId: string): HTMLAudioElement | null => {
    // Direct lookup using data attribute
    const audioElement = document.querySelector(`audio[data-article-id="${articleId}"]`) as HTMLAudioElement

    if (audioElement) {
      console.log(`✅ Found audio element for article ${articleId}`)
      return audioElement
    }

    console.log(`❌ No audio element found for article ${articleId}`)
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

  const playRowTracksSequentially = async () => {
    console.log('=== STARTING SEQUENTIAL ROW PLAYBACK ===')

    for (let i = 0; i < currentRowAudioTracks.length; i++) {
      // Check if auto-row-play is still active using state instead of DOM
      if (!isAutoRowPlaying) {
        console.log('Auto-row-play state is false, breaking out of loop')
        break
      }

      const track = currentRowAudioTracks[i]
      console.log(`Playing track ${i + 1}/${currentRowAudioTracks.length}:`, track)

      try {
        // Stop all audio first
        stopAllAudio()

        // Navigate to the correct horizontal slide if needed
        if (track.horizontalIndex > 0) {
          console.log(`Navigating to horizontal slide ${track.horizontalIndex}`)
          await navigateToHorizontalSlide(track.horizontalIndex)
        } else if (i > 0) {
          // Navigate back to main slide if we're not on the first track
          console.log('Navigating back to main slide')
          await navigateToHorizontalSlide(0)
        }

        // Find the audio player for this track
        const audioElement = findAudioPlayerByArticleId(track.articleId)

        if (audioElement) {
          console.log(`✅ Found audio element for ${track.articleId}, starting playback`)
          setCurrentRowTrackIndex(i)
          await playAudio(audioElement)
          console.log(`✅ Completed playing ${track.title}`)
        } else {
          console.error(`❌ Could not find audio element for ${track.articleId}`)
          // Continue to next track instead of stopping
        }

      } catch (error) {
        console.error(`Error playing track ${track.title}:`, error)
        // Continue to next track instead of stopping
      }
    }

    // All tracks completed or stopped
    console.log('=== ROW PLAYBACK COMPLETED ===')
    setIsAutoRowPlaying(false)
    setCurrentRowTrackIndex(0)
  }

  // No longer need event-based audio end handling - using direct sequential control

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

  // Debug logging for button visibility
  console.log('AutoRowPlayIcon:', currentRowAudioTracks.length, 'tracks in row')

  // Don't show on admin pages
  const isAdminPage = pathname?.startsWith('/admin')
  if (isAdminPage) {
    console.log('AutoRowPlayIcon: Hidden because admin page')
    return null
  }

  // Only show if current row has MP3 tracks
  if (currentRowAudioTracks.length === 0) {
    console.log('AutoRowPlayIcon: Hidden because no audio tracks in current row')
    return null
  }

  console.log('AutoRowPlayIcon: Showing button with', currentRowAudioTracks.length, 'tracks')

  return (
    <div
      className="fixed top-6 left-36 z-50"
      data-auto-row-playing={isAutoRowPlaying ? 'true' : 'false'}
    >
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