import { NextRequest, NextResponse } from 'next/server';
import { VotingStore } from '@/lib/store';
import { VoteSubmissionPayload } from '@/types/voting';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: VoteSubmissionPayload = await req.json();

    if (!body.voterIdentifier || !body.voterIdentifier.trim()) {
      return NextResponse.json({ error: 'A valid Voter Identifier (Email / ID) is required.' }, { status: 400 });
    }

    if (!body.ballot || Object.keys(body.ballot).length === 0) {
      return NextResponse.json({ error: 'Please select a candidate before submitting.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
    const ipHash = ip.split(',')[0].trim();

    const result = await VotingStore.castBallot({
      voterIdentifier: body.voterIdentifier.trim().toLowerCase(),
      voterName: body.voterName?.trim(),
      ballot: body.ballot,
      ipHash,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Your vote has been successfully recorded.',
      receiptId: result.receiptId,
    });
  } catch (error) {
    console.error('Error submitting vote:', error);
    return NextResponse.json({ error: 'An unexpected error occurred while casting vote.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const identifier = searchParams.get('identifier');
    if (!identifier) {
      return NextResponse.json({ error: 'Identifier required' }, { status: 400 });
    }
    const hasVoted = await VotingStore.hasVoted(identifier.trim().toLowerCase());
    return NextResponse.json({ hasVoted });
  } catch (error) {
    return NextResponse.json({ error: 'Error checking voter status' }, { status: 500 });
  }
}
