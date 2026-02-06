import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // In a real app, store this nonce in DB or Redis linked to the session/IP
    // For this MVP, we rely on the client to sign and return it immediately.
    // Stateless nonce: We could sign the nonce itself with a server secret to verify it later.

    const nonce = crypto.randomBytes(32).toString('base64');

    // We can set a temporary cookie with the nonce to verify it matches on return
    const res = NextResponse.json({ nonce });

    res.cookies.set('auth-nonce', nonce, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 5, // 5 minutes
        path: '/',
    });

    return res;
}
