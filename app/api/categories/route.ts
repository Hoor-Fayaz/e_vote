import { NextResponse } from 'next/server';
import { VotingStore } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await VotingStore.getPublicCategories();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching public categories:', error);
    return NextResponse.json({ error: 'Failed to load ballot categories' }, { status: 500 });
  }
}
