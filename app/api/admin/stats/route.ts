import { NextRequest, NextResponse } from 'next/server';
import { VotingStore } from '@/lib/store';
import { verifyAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await VotingStore.getAdminDashboardData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
