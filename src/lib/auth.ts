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

export function generateToken(user: AuthUser, tokenVersion?: number): string {
  const payload: TokenPayload = { userId: user.id, email: user.email, role: user.role }
  if (typeof tokenVersion === 'number') payload.tokenVersion = tokenVersion
  return jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' })
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as TokenPayload
    if (!decoded?.userId) return null
    const dbUser = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!dbUser) return null
    // If tokenVersion exists on token and doesn't match DB, token is invalid
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
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' = 'STUDENT'
): Promise<AuthUser> {
  const hashedPassword = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role
    }
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  }
}
