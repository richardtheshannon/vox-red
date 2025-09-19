import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/database'

export async function GET() {
  try {
    // Test database connection by counting users
    const userCount = await prisma.user.count()
    const articleCount = await prisma.article.count()

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      userCount,
      articleCount,
      timestamp: new Date().toISOString(),
      databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
    })
  } catch (error) {
    console.error('Database health check failed:', error)
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown database error',
        timestamp: new Date().toISOString(),
        databaseUrl: process.env.DATABASE_URL ? 'configured' : 'missing'
      },
      { status: 500 }
    )
  }
}