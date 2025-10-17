'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { Moon, Sun } from 'lucide-react'
import Link from 'next/link'
import { Menu, X, BookOpen, Users, Home } from 'lucide-react'
import ContactModal from '@/components/ContactModal'

type ContactDefaults = { name?: string; email?: string }

export default function Navbar() {
  const { user, logout } = useAuth()
  const { darkMode, toggleDarkMode } = useDarkMode()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactDefaults, setContactDefaults] = useState<ContactDefaults>({})
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const firstMenuItemRef = useRef<HTMLAnchorElement | null>(null)

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

  // When account menu opens, move focus to the first actionable item for accessibility
  useEffect(() => {
    if (isAccountOpen) {
      // small delay to ensure element exists in DOM
      setTimeout(() => firstMenuItemRef.current?.focus(), 0)
    }
  }, [isAccountOpen])

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
    ] : [])
  ]

  return (
  <nav className="shadow-sm border-b fixed top-0 left-0 right-0 z-50" style={{ background: 'var(--background)', borderColor: 'var(--section-border)' }} suppressHydrationWarning>
      <div className="max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between h-14">
          {/* Logo */}
          <Link href={user ? "/dashboard" : "/"} className="flex-shrink-0 flex items-center" style={{ marginLeft: 0, paddingLeft: 0 }} aria-label="SAPIntegrationExpert Home">
            <svg width={320} height={36} viewBox="0 50 1100 160" preserveAspectRatio="xMinYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc" style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.1))', display: 'block' }}>
              <title id="title">SAPIntegrationExpert — Wordmark</title>
              <desc id="desc">SAP in blue gradient, IntegrationExpert in theme foreground color. No background.</desc>
              <defs>
                <linearGradient id="sap-gradient" x1="0" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#0A74DA" />
                  <stop offset="1" stopColor="#60A5FA" />
                </linearGradient>
              </defs>
              <text x={0} y={155} fontFamily="Inter, Segoe UI, Arial, sans-serif" fontSize={105} fontWeight={800} letterSpacing={1.5} fill="url(#sap-gradient)">SAP</text>
              <text x={250} y={155} fontFamily="Inter, Segoe UI, Arial, sans-serif" fontSize={105} fontWeight={800} letterSpacing={1.5} style={{ fill: 'var(--foreground)', filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.10))' }}>IntegrationExpert</text>
            </svg>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{ color: 'var(--session-text)' }}
              >
                {item.name}
              </Link>
            ))}
            <button onClick={openContact} className="hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium" style={{ color: 'var(--session-text)' }}>
              Contact Us
            </button>
          </div>

          {/* Dark Mode Toggle */}
          <div className="hidden md:flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Toggle dark mode"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ background: 'var(--section-bg)' }}
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" style={{ color: 'var(--session-text)' }} />}
            </button>
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="text-sm" style={{ color: 'var(--session-text)' }}>
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs" style={{ color: 'var(--session-subtext)' }}>{user.role?.toLowerCase()?.replace(/(^|\s)\S/g, s => s.toUpperCase())}</div>
                  </div>
                  <div className="relative" ref={accountRef}>
                    <button id="account-button" aria-haspopup="true" aria-expanded={isAccountOpen} onClick={() => setIsAccountOpen(!isAccountOpen)} className="p-1 rounded-full w-9 h-9 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-200" style={{ background: 'var(--section-bg)' }} aria-label="Open account menu">
                      <span className="text-sm font-medium" style={{ color: 'var(--session-text)' }}>{(user?.name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || 'U'}</span>
                    </button>
                    {isAccountOpen && (
                      <div ref={menuRef} role="menu" aria-orientation="vertical" aria-labelledby="account-button" className="absolute right-0 mt-2 w-56 rounded-md shadow-md z-50 transition transform duration-150 ease-out" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
                        <Link href="/account" ref={firstMenuItemRef} role="menuitem" tabIndex={-1} className="block px-4 py-3 text-sm focus:outline-none transition-colors hover-bg-accent" style={{ color: 'var(--session-text)' }}>Account details</Link>
                        <Link href="/account/change-password" role="menuitem" tabIndex={-1} className="block px-4 py-3 text-sm focus:outline-none transition-colors hover-bg-accent" style={{ color: 'var(--session-text)' }}>Change password</Link>
                        <div className="border-t" style={{ borderColor: 'var(--section-border)' }} />
                        <button onClick={handleLogout} role="menuitem" tabIndex={-1} className="w-full text-left px-4 py-3 text-sm text-red-600 focus:outline-none transition-colors hover-bg-accent">Log out</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-md text-sm font-medium border transition-colors hover-bg-accent focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm hover:shadow hover:text-blue-500"
                  style={{ background: 'var(--section-bg)', color: 'var(--foreground)', borderColor: 'var(--section-border)' }}
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
                {/* top-right Contact Us removed to avoid duplicate; use main nav Contact Us */}
              </div>
            )}
          </div>

          {/* Mobile menu button and dark mode toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Toggle dark mode"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
            </button>
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
                    <p className="text-sm text-gray-700 font-medium">{user.name}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {user.role?.toLowerCase()?.replace(/(^|\s)\S/g, s => s.toUpperCase())}
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
                    className="block px-3 py-2 rounded-md text-base font-medium border transition-colors hover-bg-accent hover:text-blue-500 shadow-sm hover:shadow"
                    style={{ background: 'var(--section-bg)', color: 'var(--foreground)', borderColor: 'var(--section-border)' }}
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
