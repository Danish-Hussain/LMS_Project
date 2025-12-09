import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
}

export interface TokenPayload {
  userId: string
  email: string
  role: string
  tokenVersion?: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Access token (short-lived) + Refresh token (long-lived) helpers
export function generateAccessToken(user: AuthUser): string {
  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role }
  // Access tokens are short-lived (15 minutes)
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '15m' })
}

export function generateRefreshToken(user: AuthUser, tokenVersion?: number): string {
  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role }
  if (typeof tokenVersion === 'number') payload.tokenVersion = tokenVersion
  // Refresh tokens are long-lived (7 days)
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' })
}

// Backwards-compatible single-name generator (deprecated): produces access token
export const generateToken = generateAccessToken

export async function verifyToken(token: string): Promise<AuthUser | null> {
  // verifyToken is used across the codebase to validate access tokens (short-lived)
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as TokenPayload
    if (!decoded?.userId) return null
    const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!dbUser) return null
    // Access tokens normally won't include tokenVersion. If they do, still enforce it.
    if (typeof decoded.tokenVersion === 'number' && decoded.tokenVersion !== dbUser.tokenVersion) return null
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role
    }
  } catch (err) {
    return null
  }
}

export async function verifyRefreshToken(token: string): Promise<AuthUser | null> {
  // Verify refresh token and ensure tokenVersion matches DB
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as TokenPayload
    if (!decoded?.userId) return null
    const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!dbUser) return null
    // Refresh token MUST include tokenVersion and it must match DB
    if (typeof decoded.tokenVersion !== 'number') return null
    if (decoded.tokenVersion !== dbUser.tokenVersion) return null
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role
    }
  } catch (err) {
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user || !await verifyPassword(password, user.password)) {
    return null
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' = 'STUDENT',
  phoneNumber?: string
): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
      ...(phoneNumber ? { phoneNumber } : {})
    }
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }
}
