import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { articleSchema } from '@/app/lib/validations'
import { sseManager } from '@/app/lib/realtime'

export async function GET() {
  try {
    const articles = await prisma.article.findMany({
      where: { parentId: null }, // Only get main articles (not sub-articles)
      orderBy: { orderPosition: 'asc' },
      include: {
        subArticles: {
          orderBy: { orderPosition: 'asc' }
        }
      }
    })

    return NextResponse.json(articles)
  } catch (error) {
    console.error('Error fetching articles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = articleSchema.parse(body)

    // Calculate order position based on whether it's a main article or sub-article
    const maxPosition = await prisma.article.aggregate({
      where: { parentId: validatedData.parentId || null },
      _max: { orderPosition: true },
    })

    const newArticle = await prisma.article.create({
      data: {
        ...validatedData,
        parentId: validatedData.parentId || null,
        orderPosition: validatedData.orderPosition ??
          ((maxPosition._max.orderPosition ?? -1) + 1),
      },
    })

    sseManager.notifyArticleChange('created', newArticle.id)
    return NextResponse.json(newArticle, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      )
    }
    
    console.error('Error creating article:', error)
    return NextResponse.json(
      { error: 'Failed to create article' },
      { status: 500 }
    )
  }
}