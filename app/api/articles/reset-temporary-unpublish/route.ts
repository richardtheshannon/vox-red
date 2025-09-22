import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { sseManager } from '@/app/lib/realtime'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Get the current date (local date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    // Reset articles that were temporarily unpublished
    const updatedArticles = await prisma.article.updateMany({
      where: {
        temporarilyUnpublished: true,
        unpublishedDate: {
          lt: today // Any unpublish date before today
        }
      },
      data: {
        temporarilyUnpublished: false,
        unpublishedDate: null
      }
    })

    // Notify of changes via SSE
    sseManager.notifyArticleChange('updated', 'temporary-unpublish-reset')

    return NextResponse.json({
      success: true,
      message: `Reset ${updatedArticles.count} temporarily unpublished articles`,
      resetCount: updatedArticles.count,
      resetTime: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error resetting temporary unpublish status:', error)
    return NextResponse.json(
      { error: 'Failed to reset temporary unpublish status' },
      { status: 500 }
    )
  }
}