'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  BookOpen, 
  Users, 
  Settings,
  Home
} from 'lucide-react'
import ContactModal from '@/components/ContactModal'

type ContactDefaults = { name?: string; email?: string }

export default function Navbar() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactDefaults, setContactDefaults] = useState<ContactDefaults>({})
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement | null>(null)

  const openContact = () => {
    const defaults: ContactDefaults = { name: user?.name ?? undefined, email: user?.email ?? undefined }
    setContactDefaults(defaults)
    setIsContactOpen(true)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false)
      }
    }
    window.addEventListener('click', handleClick)
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsAccountOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('click', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    setIsMenuOpen(false)
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Courses', href: '/courses', icon: BookOpen },
    ...(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR' ? [
      { name: 'Students', href: '/students', icon: Users },
      { name: 'Batches', href: '/batches', icon: Users },
    ] : []),
  ]

  return (
    <nav className="bg-white shadow-sm border-b fixed top-0 left-0 right-0 z-50" suppressHydrationWarning>
      <div className="max-w-[1920px] w-full mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-14">
          <div className="flex items-center">
            <Link href={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">LMS</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <button onClick={openContact} className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
              Contact Us
            </button>
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-700">
                    <div>Welcome, {user.name}</div>
                    <div className="text-xs text-gray-500">{user.role}</div>
                  </div>
                  <div className="relative" ref={accountRef}>
                    <button onClick={() => setIsAccountOpen(!isAccountOpen)} className="p-1 rounded-full hover:bg-gray-100 w-9 h-9 flex items-center justify-center bg-gray-50">
                      <span className="text-sm font-medium text-gray-700">{(user?.name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || 'U'}</span>
                    </button>
                    {isAccountOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-md z-50">
                        <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Account details</Link>
                        <Link href="/account/change-password" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">Change password</Link>
                        <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50">Log out</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
                <button onClick={openContact} className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Contact Us
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <button onClick={() => { openContact(); setIsMenuOpen(false) }} className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left">
                Contact Us
              </button>
              {user ? (
                <div className="border-t pt-4">
                  <div className="px-3 py-2">
                    <p className="text-sm text-gray-700">Welcome, {user.name}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {user.role}
                    </span>
                  </div>
                  <Link href="/account" className="text-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left" onClick={() => setIsMenuOpen(false)}>Account details</Link>
                  <Link href="/account/change-password" className="text-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left" onClick={() => setIsMenuOpen(false)}>Change password</Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="border-t pt-4 space-y-1">
                  <Link
                    href="/login"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white block px-3 py-2 rounded-md text-base font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
        <ContactModal open={isContactOpen} onClose={() => setIsContactOpen(false)} defaultName={contactDefaults.name} defaultEmail={contactDefaults.email} />
      </div>
    </nav>
  )
}
