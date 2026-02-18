import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const module = await prisma.module.findUnique({
      where: { id: params.id },
      include: {
        belt: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        techniques: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            description: true,
            instructions: true,
            keyPoints: true,
            category: true,
            order: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: 'Module not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(module);
  } catch (error) {
    console.error('Error fetching module:', error);
    return NextResponse.json(
      { error: 'Failed to fetch module' },
      { status: 500 }
    );
  }
}
