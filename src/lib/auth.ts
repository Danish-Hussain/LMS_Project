import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from './db'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as { userId: string; email: string; name: string; role: string }
    return {
      id: decoded.userId,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role as 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
    }
  } catch {
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
