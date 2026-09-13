import { NextRequest, NextResponse } from 'next/server';
import { createAdminAuthResponse, clearAdminSessionResponse } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { pin } = await req.json();

    // Read the admin PIN strictly from environment variable — no hardcoded fallback
    const adminPin = process.env.ADMIN_PIN;

    if (!adminPin) {
      console.error('ADMIN_PIN environment variable is not set.');
      return NextResponse.json(
        { error: 'Admin access is not configured. Please set the ADMIN_PIN environment variable.' },
        { status: 503 }
      );
    }

    if (pin === adminPin) {
      return createAdminAuthResponse(true, 'Authentication successful');
    }

    return createAdminAuthResponse(false);
  } catch (error) {
    return NextResponse.json({ error: 'Server error during login' }, { status: 500 });
  }
}

export async function DELETE() {
  return clearAdminSessionResponse();
}
