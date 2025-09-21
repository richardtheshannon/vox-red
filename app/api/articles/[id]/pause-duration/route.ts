import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/app/lib/auth";
import { prisma } from "@/app/lib/database";
import { z } from "zod";

export const dynamic = 'force-dynamic';

const pauseDurationSchema = z.object({
  pauseDuration: z.number().int().nullable()
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const validation = pauseDurationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid pause duration", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updatedArticle = await prisma.article.update({
      where: { id },
      data: {
        pauseDuration: validation.data.pauseDuration
      }
    });

    // Trigger real-time update
    const encoder = new TextEncoder();
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'article-updated', id: updatedArticle.id })}\n\n`));
        controller.close();
      }
    });

    return NextResponse.json(updatedArticle);
  } catch (error) {
    console.error("Error updating pause duration:", error);
    return NextResponse.json(
      { error: "Failed to update pause duration" },
      { status: 500 }
    );
  }
}