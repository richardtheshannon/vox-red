import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'
import { auth } from '@/app/lib/auth'
import { reorderDocsSchema } from '@/app/lib/validations'

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
    const validatedData = reorderDocsSchema.parse(body)

    // Use a transaction to update all documentation positions
    await prisma.$transaction(
      validatedData.docs.map((doc) =>
        prisma.documentation.update({
          where: { id: doc.id },
          data: { orderPosition: doc.orderPosition },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error reordering documentation:', error)

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid input', details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reorder documentation' },
      { status: 500 }
    )
  }
}