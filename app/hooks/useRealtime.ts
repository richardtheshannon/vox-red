'use client'

import { useEffect, useState, useCallback } from 'react'

interface RealtimeMessage {
  type: string
  action?: string
  articleId?: string
  timestamp?: string
}

export function useRealtime() {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<RealtimeMessage | null>(null)

  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const triggerRefresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      try {
        eventSource = new EventSource('/api/realtime')

        eventSource.onopen = () => {
          console.log('SSE connected')
          setIsConnected(true)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            setLastMessage(data)

            if (data.type === 'article_change') {
              triggerRefresh()
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error)
          }
        }

        eventSource.onerror = (error) => {
          console.error('SSE error:', error)
          setIsConnected(false)
          
          eventSource?.close()
          
          reconnectTimeout = setTimeout(() => {
            console.log('Attempting to reconnect SSE...')
            connect()
          }, 3000)
        }
      } catch (error) {
        console.error('Error creating SSE connection:', error)
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [triggerRefresh])

  return {
    isConnected,
    lastMessage,
    refreshTrigger,
  }
}