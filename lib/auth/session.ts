import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const key = new TextEncoder().encode(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

const COOKIE_NAME = 'session_token'

export type SessionPayload = {
    userId: string
    cedula: string
    role: 'admin' | 'voter'
    expires: Date
}

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1d')
        .sign(key)
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, key, {
            algorithms: ['HS256'],
        })
        return payload as unknown as SessionPayload
    } catch (_error) {
        return null
    }
}

export async function createSession(userId: string, cedula: string, role: 'admin' | 'voter') {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
    const session = await encrypt({ userId, cedula, role, expires })

    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, session, {
        httpOnly: true,
        secure: true,
        expires,
        sameSite: 'lax',
        path: '/',
    })
}

export async function getSession() {
    const cookieStore = await cookies()
    const session = cookieStore.get(COOKIE_NAME)?.value
    if (!session) return null
    return await decrypt(session)
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}
