import { NextRequest } from 'next/server'
import { sseManager } from '@/app/lib/realtime'

export async function GET(request: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      const cleanup = sseManager.addClient(controller)

      request.signal.addEventListener('abort', () => {
        cleanup()
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    },
  })
}