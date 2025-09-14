import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { reorderSchema } from '@/app/lib/validations'
import { sseManager } from '@/app/lib/realtime'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = reorderSchema.parse(body)

    const updatePromises = validatedData.articles.map((article) =>
      prisma.article.update({
        where: { id: article.id },
        data: { orderPosition: article.orderPosition },
      })
    )

    await prisma.$transaction(updatePromises)

    sseManager.notifyArticleChange('reordered')
    return NextResponse.json({ message: 'Articles reordered successfully' })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      )
    }
    
    console.error('Error reordering articles:', error)
    return NextResponse.json(
      { error: 'Failed to reorder articles' },
      { status: 500 }
    )
  }
}