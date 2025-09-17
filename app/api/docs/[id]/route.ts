import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { documentationSchema } from '@/app/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const doc = await prisma.documentation.findUnique({
      where: { id: params.id },
      include: {
        subDocs: {
          orderBy: { orderPosition: 'asc' }
        }
      }
    })

    if (!doc) {
      return NextResponse.json(
        { error: 'Documentation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(doc)
  } catch (error) {
    console.error('Error fetching documentation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documentation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const validatedData = documentationSchema.parse(body)

    const updatedDoc = await prisma.documentation.update({
      where: { id: params.id },
      data: {
        ...validatedData,
        parentId: validatedData.parentId || null,
      },
    })

    return NextResponse.json(updatedDoc)
  } catch (error) {
    console.error('Error updating documentation:', error)

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update documentation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await prisma.documentation.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting documentation:', error)
    return NextResponse.json(
      { error: 'Failed to delete documentation' },
      { status: 500 }
    )
  }
}