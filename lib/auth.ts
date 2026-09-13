import { NextRequest, NextResponse } from 'next/server';
import { VotingStore } from './store';

const ADMIN_COOKIE_NAME = 'admin_session_token';
const DEFAULT_SECRET = 'priv_vote_sec_key_2026_xyz';

export function verifyAdminSession(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const authHeader = req.headers.get('Authorization');

  // Also check Bearer token if provided in header
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const headerToken = authHeader.substring(7);
    if (headerToken === DEFAULT_SECRET) return true;
  }

  if (!token) return false;
  return token === DEFAULT_SECRET;
}

export function createAdminAuthResponse(isValid: boolean, message: string = 'Authorized') {
  if (!isValid) {
    return NextResponse.json({ error: 'Unauthorized: Invalid Admin Credentials' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true, message });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: DEFAULT_SECRET,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  return response;
}

export function clearAdminSessionResponse() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: '',
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
