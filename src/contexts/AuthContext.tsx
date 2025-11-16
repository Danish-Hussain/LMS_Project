'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Local Role type to avoid importing Prisma types in client bundle
export type Role = 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'

export interface User {
  id: string
  email: string
  name: string
  role: Role
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string, role?: Role, phoneNumber?: string) => Promise<{ success: boolean; message?: string }>
  logout: () => Promise<void>
}
// Add optional setter to update user from components
interface MutableAuthContextType extends AuthContextType {
  setUser?: (u: User | null) => void
}

const AuthContext = createContext<MutableAuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        return true
      }
      return false
    } catch (error) {
      console.error('Login failed:', error)
      return false
    }
  }

  const register = async (email: string, password: string, name: string, role?: Role, phoneNumber?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role, phoneNumber })
      })

      const text = await response.text()
      let data: any = {}
      try { data = text ? JSON.parse(text) : {} } catch (e) { data = { message: text } }

      if (response.ok) {
        setUser(data.user)
        return { success: true }
      }

      // Log server-provided error details for easier debugging
      console.error('Registration failed:', { status: response.status, body: data })
      const message = data?.error || data?.message || 'Registration failed'
      return { success: false, message }
    } catch (error) {
      console.error('Registration failed:', error)
      return { success: false, message: 'Network or server error' }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      // Redirect to home screen after logout
      try {
        router.push('/')
      } catch (e) {
        // noop
      }
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
