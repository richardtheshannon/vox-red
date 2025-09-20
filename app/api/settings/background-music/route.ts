import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/database';
import { auth } from '@/app/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BACKGROUND_MUSIC_KEY = 'background_music_url';

const settingsSchema = z.object({
  url: z.string().url().nullable().optional(),
});

export async function GET() {
  try {
    // Check if Settings model is available in Prisma client
    if (!prisma.settings) {
      // Fallback to default URL while Prisma client updates
      return NextResponse.json({
        url: 'https://vox.red/mp3/_backing-tracks/X_backing-track-02.mp3'
      });
    }

    const setting = await prisma.settings.findUnique({
      where: { key: BACKGROUND_MUSIC_KEY },
    });

    return NextResponse.json({
      url: setting?.value || 'https://vox.red/mp3/_backing-tracks/X_backing-track-02.mp3'
    });
  } catch (error) {
    console.error('Error fetching background music URL:', error);
    // Return default URL on error
    return NextResponse.json({
      url: 'https://vox.red/mp3/_backing-tracks/X_backing-track-02.mp3'
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Check if Settings model is available in Prisma client
    if (!prisma.settings) {
      return NextResponse.json(
        { error: 'Settings feature not available yet. Please restart the server.' },
        { status: 503 }
      );
    }

    const setting = await prisma.settings.upsert({
      where: { key: BACKGROUND_MUSIC_KEY },
      update: {
        value: validatedData.url || null
      },
      create: {
        key: BACKGROUND_MUSIC_KEY,
        value: validatedData.url || null
      },
    });

    return NextResponse.json({
      success: true,
      url: setting.value
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.error('Error updating background music URL:', error);
    return NextResponse.json(
      { error: 'Failed to update background music URL' },
      { status: 500 }
    );
  }
}