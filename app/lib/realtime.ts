export class SSEManager {
  private clients: Set<ReadableStreamDefaultController> = new Set()

  addClient(controller: ReadableStreamDefaultController) {
    this.clients.add(controller)
    
    controller.enqueue(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

    return () => {
      this.clients.delete(controller)
    }
  }

  broadcast(data: any) {
    const message = `data: ${JSON.stringify(data)}\n\n`
    
    this.clients.forEach((controller) => {
      try {
        controller.enqueue(message)
      } catch (error) {
        this.clients.delete(controller)
      }
    })
  }

  notifyArticleChange(type: 'created' | 'updated' | 'deleted' | 'reordered', articleId?: string) {
    this.broadcast({
      type: 'article_change',
      action: type,
      articleId,
      timestamp: new Date().toISOString(),
    })
  }
}

export const sseManager = new SSEManager()