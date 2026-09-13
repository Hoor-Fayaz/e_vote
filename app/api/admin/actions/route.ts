import { NextRequest, NextResponse } from 'next/server';
import { VotingStore } from '@/lib/store';
import { verifyAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { action } = await req.json();

    if (action === 'RESET_VOTES') {
      await VotingStore.resetAllVotes();
      return NextResponse.json({ success: true, message: 'All votes have been reset to zero.' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Action execution failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';
    const exportData = await VotingStore.getExportData();

    if (format === 'csv') {
      // Build clean CSV rows
      const header = 'VoteID,VoterIdentifier,VoterName,CategoryID,CategoryName,CandidateID,CandidateName,Timestamp,IPHash\n';
      const rows = exportData.votes.map((v) => {
        const cat = exportData.categories.find((c) => c.id === v.categoryId);
        const cand = cat?.candidates.find((c) => c.id === v.candidateId);
        const voterReg = exportData.voterRegistrations[v.voterIdentifier];
        const vName = voterReg?.voterName || v.voterName || '';
        return `"${v.id}","${v.voterIdentifier}","${vName}","${v.categoryId}","${cat?.name || ''}","${v.candidateId}","${cand?.name || ''}","${v.timestamp}","${v.ipHash}"`;
      });

      const csvContent = header + rows.join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="voting-results-audit-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json(exportData);
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
