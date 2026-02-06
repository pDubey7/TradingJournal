import jwt from 'jsonwebtoken';
import { serialize, parse } from 'cookie';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dev_key_change_me_in_prod';
const SESSION_DURATION = 60 * 60 * 24 * 7; // 7 days

export interface SessionData {
    userId: string;
    walletAddress: string;
}

export function signSession(payload: SessionData): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySession(token: string): SessionData | null {
    try {
        return jwt.verify(token, JWT_SECRET) as SessionData;
    } catch (error) {
        return null;
    }
}

export function setSessionCookie(res: NextResponse, token: string) {
    res.cookies.set('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: SESSION_DURATION,
        path: '/',
    });
}

export function getSession(req: NextRequest): SessionData | null {
    const cookie = req.cookies.get('session');
    if (!cookie?.value) return null;
    return verifySession(cookie.value);
}

// CAIP-122 style message construction (simplified)
export function createSiwsMessage(address: string, nonce: string): string {
    const domain = 'deriverse.analytics';
    const origin = 'https://deriverse.analytics';
    const statement = 'Sign in to Deriverse Analytics to view your private trading journal.';

    return `${domain} wants you to sign in with your Solana account:
${address}

${statement}

URI: ${origin}
Version: 1
Nonce: ${nonce}
Issued At: ${new Date().toISOString()}`;
}
