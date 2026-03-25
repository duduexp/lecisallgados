import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

const SESSION_COOKIE_NAME = 'admin_session'
const SESSION_EXPIRY_HOURS = 24

export interface AdminSession {
  id: string
  username: string
  name: string | null
  email: string | null
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createSession(adminId: string): Promise<void> {
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + SESSION_EXPIRY_HOURS)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, JSON.stringify({
    id: adminId,
    expiresAt: expiresAt.toISOString(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
}

export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

  if (!sessionCookie?.value) {
    return null
  }

  try {
    const session = JSON.parse(sessionCookie.value)
    
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await destroySession()
      return null
    }

    // Get admin from database
    const admin = await db.admin.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        active: true,
      },
    })

    if (!admin || !admin.active) {
      await destroySession()
      return null
    }

    return {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      email: admin.email,
    }
  } catch {
    return null
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

export async function authenticateAdmin(username: string, password: string): Promise<AdminSession | null> {
  const admin = await db.admin.findUnique({
    where: { username },
  })

  if (!admin || !admin.active) {
    return null
  }

  const isValid = await verifyPassword(password, admin.password)
  if (!isValid) {
    return null
  }

  await createSession(admin.id)

  return {
    id: admin.id,
    username: admin.username,
    name: admin.name,
    email: admin.email,
  }
}
