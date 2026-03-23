import { NextResponse } from 'next/server';
import { getBoard, saveBoard } from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Unwrap promise for Next.js 15
) {
  try {
    const { id } = await params;
    const board = await getBoard(id); // added await
    return NextResponse.json({ board });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch board' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { columns, items, history } = body;
    await saveBoard(id, columns || [], items || [], history || []); // added await
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save board' }, { status: 500 });
  }
}
