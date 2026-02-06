import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { createSiwsMessage, setSessionCookie, signSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { publicKey, signature, message } = await req.json();
        const nonceCookie = req.cookies.get('auth-nonce');
        const storedNonce = nonceCookie?.value;

        if (!storedNonce) {
            return NextResponse.json({ error: 'Nonce expired or missing' }, { status: 400 });
        }

        // 1. Verify Message Format (Basic check)
        // In strict implementation, parse the CAIP-122 message and check fields match.
        // Here we ensure the nonce is present in the message.
        if (!message.includes(`Nonce: ${storedNonce}`)) {
            return NextResponse.json({ error: 'Invalid nonce in message' }, { status: 400 });
        }

        // 2. Verify Signature
        const pubKeyBytes = new PublicKey(publicKey).toBytes();
        const signatureBytes = bs58.decode(signature);
        const messageBytes = new TextEncoder().encode(message);

        const verified = nacl.sign.detached.verify(messageBytes, signatureBytes, pubKeyBytes);

        if (!verified) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        // 3. Find or Create User
        let user = await db.query.users.findFirst({
            where: eq(users.walletAddress, publicKey),
        });

        if (!user) {
            const result = await db.insert(users).values({
                walletAddress: publicKey,
            }).returning();
            user = result[0];
        }

        // 4. Issue Session
        const token = signSession({
            userId: user.id,
            walletAddress: user.walletAddress,
        });

        const res = NextResponse.json({ success: true, user });

        // Clear nonce
        res.cookies.delete('auth-nonce');

        // Set session
        setSessionCookie(res, token);

        return res;

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
