import { NextRequest, NextResponse } from 'next/server';
import { VotingStore } from '@/lib/store';
import { verifyAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { categoryId, candidate } = await req.json();
    if (!categoryId || !candidate?.name) {
      return NextResponse.json({ error: 'Category ID and candidate name are required' }, { status: 400 });
    }

    const created = await VotingStore.addCandidate(categoryId, candidate.name);
    if (!created) {
      return NextResponse.json({ error: 'Failed to add candidate. Category not found.' }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: created });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create candidate' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { categoryId, candidateId, updates } = await req.json();
    if (!categoryId || !candidateId) {
      return NextResponse.json({ error: 'Category ID and Candidate ID are required' }, { status: 400 });
    }

    const updated = await VotingStore.updateCandidate(categoryId, candidateId, updates?.name || updates);
    if (!updated) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update candidate' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const candidateId = searchParams.get('candidateId');

    if (!categoryId || !candidateId) {
      return NextResponse.json({ error: 'categoryId and candidateId are required' }, { status: 400 });
    }

    const deleted = await VotingStore.deleteCandidate(categoryId, candidateId);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}
