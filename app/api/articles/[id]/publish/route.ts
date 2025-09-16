import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { sseManager } from '@/app/lib/realtime'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { published } = await request.json()

    if (typeof published !== 'boolean') {
      return NextResponse.json(
        { error: 'Published status must be a boolean' },
        { status: 400 }
      )
    }

    // Update the article's published status
    const updatedArticle = await prisma.article.update({
      where: { id: params.id },
      data: { published }
    })

    // Notify all clients about the change
    sseManager.notifyArticleChange('updated', params.id)

    return NextResponse.json({
      success: true,
      article: updatedArticle
    })

  } catch (error) {
    console.error('Error updating publish status:', error)
    return NextResponse.json(
      { error: 'Failed to update publish status' },
      { status: 500 }
    )
  }
}