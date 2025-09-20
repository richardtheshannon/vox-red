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
    const { articleType } = body

    // Validate articleType
    const validTypes = ['meditation', 'education', 'personal', 'spiritual', 'routine', null]
    if (!validTypes.includes(articleType)) {
      return NextResponse.json(
        { error: 'Invalid article type' },
        { status: 400 }
      )
    }

    const article = await prisma.article.update({
      where: { id },
      data: { articleType },
      include: {
        subArticles: {
          orderBy: {
            orderPosition: 'asc',
          },
        },
        media: true,
      },
    })

    // Trigger real-time update
    sseManager.broadcast({ type: 'article-updated', data: article })

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error updating article type:', error)
    return NextResponse.json(
      { error: 'Failed to update article type' },
      { status: 500 }
    )
  }
}