import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { sseManager } from '@/app/lib/realtime'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const { isFavorite } = body

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: { isFavorite },
    })

    sseManager.notifyArticleChange('updated', id)
    return NextResponse.json(updatedArticle)
  } catch (error) {
    console.error('Error updating favorite status:', error)
    return NextResponse.json(
      { error: 'Failed to update favorite status' },
      { status: 500 }
    )
  }
}