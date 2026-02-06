import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = getSession(req);

    if (!session) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true, user: session });
}

export async function DELETE(req: NextRequest) {
    const res = NextResponse.json({ success: true });
    res.cookies.delete('session');
    return res;
}
