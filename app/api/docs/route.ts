import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { documentationSchema } from '@/app/lib/validations'

export async function GET() {
  try {
    const session = await auth()

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all main documentation (no parentId)
    const allMainDocs = await prisma.documentation.findMany({
      where: {
        parentId: null,
      },
      orderBy: { orderPosition: 'asc' },
      include: {
        subDocs: {
          orderBy: { orderPosition: 'asc' }
        }
      }
    })

    return NextResponse.json(allMainDocs)
  } catch (error) {
    console.error('Error fetching documentation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documentation' },
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
    const validatedData = documentationSchema.parse(body)

    // Calculate order position based on whether it's a main doc or sub-doc
    const maxPosition = await prisma.documentation.aggregate({
      where: { parentId: validatedData.parentId || null },
      _max: { orderPosition: true },
    })

    const newDoc = await prisma.documentation.create({
      data: {
        ...validatedData,
        parentId: validatedData.parentId || null,
        orderPosition: validatedData.orderPosition ??
          ((maxPosition._max.orderPosition ?? -1) + 1),
      },
    })

    return NextResponse.json(newDoc, { status: 201 })
  } catch (error) {
    console.error('Error creating documentation:', error)

    // Check if it's a Zod validation error
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create documentation' },
      { status: 500 }
    )
  }
}