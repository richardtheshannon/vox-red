'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface YouTubeAudioPlayerProps {
  audioUrl: string
  articleId: string
}

// YouTube Player types
interface YTPlayer {
  playVideo: () => void
  pauseVideo: () => void
  seekTo: (seconds: number) => void
  destroy: () => void
}

interface YTPlayerConstructor {
  new (element: HTMLElement, config: {
    height: string
    width: string
    videoId: string
    playerVars: Record<string, number>
    events: {
      onReady: () => void
      onStateChange: (event: { data: number }) => void
      onError: (event: { data: number }) => void
    }
  }): YTPlayer
}

declare global {
  interface Window {
    YT: {
      Player: YTPlayerConstructor
    }
    onYouTubeIframeAPIReady: () => void
  }
}

export default function YouTubeAudioPlayer({ audioUrl, articleId }: YouTubeAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isAutoRowPlayActive, setIsAutoRowPlayActive] = useState(false)
  const playerRef = useRef<YTPlayer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ]

    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const videoId = extractVideoId(audioUrl)

  const initializePlayer = useCallback(() => {
    if (!videoId || !containerRef.current || playerRef.current) return

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '0',
        width: '0',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      })
    } catch (error) {
      console.error('Error initializing YouTube player:', error)
      setIsLoading(false)
    }
  }, [videoId])

  // Load YouTube API
  useEffect(() => {
    if (typeof window === 'undefined') return

    const loadYouTubeAPI = () => {
      if (window.YT && window.YT.Player) {
        initializePlayer()
        return
      }

      // Create script tag if not already loaded
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.async = true
        document.head.appendChild(script)
      }

      // Set up the callback
      window.onYouTubeIframeAPIReady = initializePlayer
    }

    loadYouTubeAPI()

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy()
        } catch (error) {
          console.error('Error destroying YouTube player:', error)
        }
      }
    }
  }, [videoId, initializePlayer])

  const onPlayerReady = () => {
    setIsLoading(false)
  }

  const onPlayerStateChange = (event: { data: number }) => {
    const playerState = event.data

    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    switch (playerState) {
      case 1: // playing
        setIsPlaying(true)
        break
      case 2: // paused
        setIsPlaying(false)
        break
      case 0: // ended
        setIsPlaying(false)
        // Trigger auto-play progression
        window.dispatchEvent(new CustomEvent('autoPlayAudioEnd'))
        break
      case 3: // buffering
        setIsLoading(true)
        break
      default:
        if (playerState !== -1) { // not unstarted
          setIsLoading(false)
        }
    }
  }

  const onPlayerError = (event: { data: number }) => {
    console.error('YouTube player error:', event.data)
    setIsLoading(false)
    setIsPlaying(false)
  }

  // Event listeners for auto-play system
  useEffect(() => {
    const handleStopAllAudio = () => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        console.log(`YouTubeAudioPlayer ${articleId} stopping due to stopAllAudio`)
        playerRef.current.pauseVideo()
        setIsPlaying(false)
      }
    }

    const handleAutoRowPlayTrackActive = (event: CustomEvent) => {
      const { articleId: activeArticleId, rowId } = event.detail
      const isOurRow = rowId ? rowId.includes(articleId) : true
      if (isOurRow) {
        setIsAutoRowPlayActive(activeArticleId === articleId)
      }
    }

    window.addEventListener('stopAllAudio', handleStopAllAudio)
    window.addEventListener('autoRowPlayTrackActive', handleAutoRowPlayTrackActive as EventListener)

    return () => {
      window.removeEventListener('stopAllAudio', handleStopAllAudio)
      window.removeEventListener('autoRowPlayTrackActive', handleAutoRowPlayTrackActive as EventListener)
    }
  }, [articleId])

  const togglePlayPause = () => {
    if (!playerRef.current || isLoading) return

    if (isPlaying) {
      playerRef.current.pauseVideo()
      setIsPlaying(false)
    } else {
      // Stop all other audio first
      window.dispatchEvent(new CustomEvent('stopAllAudio'))

      setTimeout(() => {
        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
          // Don't seek to 0 - this allows resume from current position
          // playerRef.current.seekTo(0)  // Removed to enable pause/resume
          playerRef.current.playVideo()
        }
      }, 100)
    }
  }

  if (!videoId) {
    return (
      <div className="inline-flex" data-article-id={articleId}>
        <button
          disabled
          className="w-12 h-12 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900"
          aria-label="Invalid YouTube URL"
        >
          <span className="material-icons text-2xl text-red-500">
            error
          </span>
        </button>
      </div>
    )
  }

  return (
    <div className="inline-flex" data-article-id={articleId}>
      <div ref={containerRef} style={{ display: 'none' }} />
      <button
        onClick={togglePlayPause}
        disabled={isLoading}
        className="w-12 h-12 rounded-full flex items-center justify-center transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50"
        aria-label={isPlaying ? 'Pause YouTube audio' : 'Play YouTube audio'}
      >
        {isLoading ? (
          <span className="material-icons text-2xl text-gray-600 dark:text-gray-300 animate-spin">
            hourglass_empty
          </span>
        ) : (isPlaying || isAutoRowPlayActive) ? (
          <span className="material-icons text-red-500" style={{fontSize: '44px'}}>
            {isPlaying ? 'pause_circle' : 'play_circle'}
          </span>
        ) : (
          <span className="material-icons text-gray-600 dark:text-gray-300" style={{fontSize: '44px'}}>
            play_circle
          </span>
        )}
      </button>
    </div>
  )
}