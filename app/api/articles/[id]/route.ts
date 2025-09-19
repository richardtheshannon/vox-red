import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { articleSchema } from '@/app/lib/validations'
import { sseManager } from '@/app/lib/realtime'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        media: true
      }
    })

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(article)
  } catch (error) {
    console.error('Error fetching article:', error)
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    )
  }
}

export async function PUT(
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
    const validatedData = articleSchema.parse(body)

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: validatedData,
    })

    sseManager.notifyArticleChange('updated', id)
    return NextResponse.json(updatedArticle)
  } catch (error) {
    console.error('Error updating article:', error)

    // Check if it's a Zod validation error
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await prisma.article.delete({
      where: { id },
    })

    sseManager.notifyArticleChange('deleted', id)
    return NextResponse.json({ message: 'Article deleted successfully' })
  } catch (error) {
    console.error('Error deleting article:', error)
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    )
  }
}