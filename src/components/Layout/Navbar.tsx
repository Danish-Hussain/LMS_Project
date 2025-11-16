'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useState, useRef, useEffect } from 'react'
import { useDarkMode } from '@/contexts/DarkModeContext'
import { Moon, Sun, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { Menu, X, BookOpen, Users, Home, Video, FileText } from 'lucide-react'
import ContactModal from '@/components/ContactModal'

type ContactDefaults = { name?: string; email?: string }

export default function Navbar() {
  const { user, logout } = useAuth()
  const { darkMode, toggleDarkMode } = useDarkMode()
  
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactDefaults, setContactDefaults] = useState<ContactDefaults>({})
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const accountRefDesktop = useRef<HTMLDivElement | null>(null)
  const accountRefMobile = useRef<HTMLDivElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const firstMenuItemRef = useRef<HTMLAnchorElement | null>(null)

  const openContact = () => {
    const defaults: ContactDefaults = { name: user?.name ?? undefined, email: user?.email ?? undefined }
    setContactDefaults(defaults)
    setIsContactOpen(true)
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      const insideDesktop = accountRefDesktop.current?.contains(target)
      const insideMobile = accountRefMobile.current?.contains(target)
      if (!insideDesktop && !insideMobile) setIsAccountOpen(false)
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

  // Ensure proper title-case for known roles
  const formatRole = (role?: string) => {
    if (!role) return ''
    const r = String(role).toUpperCase()
    switch (r) {
      case 'ADMIN':
        return 'Admin'
      case 'INSTRUCTOR':
        return 'Instructor'
      case 'STUDENT':
        return 'Student'
      default:
        return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase()
    }
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    // Courses dropdown will be rendered separately to allow sub-menu items
    { name: 'Blogs', href: '/blogs', icon: FileText },
    ...(user?.role === 'ADMIN' ? [
      { name: 'Students', href: '/students', icon: Users },
    ] : [])
  ]

  const [isCoursesOpen, setIsCoursesOpen] = useState(false)
  const coursesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (!coursesRef.current?.contains(target)) setIsCoursesOpen(false)
    }
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  return (
  <nav className="shadow-sm border-b" style={{ background: 'var(--background)', borderColor: 'var(--section-border)' }} suppressHydrationWarning>
      <div className="max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-row items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center h-14" style={{ marginLeft: 0, paddingLeft: 0 }} aria-label="SAP Integration Expert Home">
            <svg width={320} height={36} viewBox="0 50 1100 160" preserveAspectRatio="xMinYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="title desc" className="self-center translate-y-[1px]" style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.1))', display: 'block' }}>
              <title id="title">SAP Integration Expert — Wordmark</title>
              <desc id="desc">SAP in brand blue; Integration Expert in black (light) or light (dark). Logo shown before the wordmark.</desc>
              <defs></defs>
              <text x={0} y={155} fontFamily="Inter, Segoe UI, Arial, sans-serif" fontSize={105} fontWeight={800} letterSpacing={1.5} style={{ fill: 'var(--brand-primary)' }}>SAP</text>
              <text x={250} y={155} fontFamily="Inter, Segoe UI, Arial, sans-serif" fontSize={105} fontWeight={800} letterSpacing={1.5} style={{ fill: 'var(--brand-integration)', filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.03))' }}>Integration Expert</text>
            </svg>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center h-14 space-x-8">
            {/* Dashboard first */}
            <Link href="/dashboard" className="hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors" style={{ color: 'var(--session-text)' }}>Dashboard</Link>

            {/* Courses dropdown */}
            <div className="relative" ref={coursesRef}>
              {user ? (
                // Logged-in users
                user.role === 'ADMIN' || user.role === 'INSTRUCTOR' ? (
                  <div className="flex items-center">
                    <Link
                      href="/courses"
                      className="hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                      style={{ color: 'var(--session-text)' }}
                    >
                      Courses
                    </Link>
                    <button
                      onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                      className="px-2 py-2 rounded-md hover:bg-gray-100 ml-0"
                      aria-haspopup="true"
                      aria-expanded={isCoursesOpen}
                      aria-label="Open courses menu"
                      style={{ color: 'var(--session-text)' }}
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isCoursesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCoursesOpen && (
                      <div className="absolute right-0 top-full translate-y-2 -translate-x-1 origin-top-right w-44 rounded-md shadow-md z-40" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
                        <Link
                          href="/on-demand-courses"
                          onClick={() => setIsCoursesOpen(false)}
                          className="block px-4 py-2 text-sm hover:bg-gray-50"
                          style={{ color: 'var(--session-text)' }}
                        >
                          Recorded Courses
                        </Link>
                        <Link href="/batches" onClick={() => setIsCoursesOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-50" style={{ color: 'var(--session-text)' }}>Batches</Link>
                      </div>
                    )}
                  </div>
                ) : user.role === 'STUDENT' ? (
                  // Students: no dropdown, open courses page
                  <Link
                    href="/courses"
                    className="hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    style={{ color: 'var(--session-text)' }}
                  >
                    Courses
                  </Link>
                ) : (
                  // Other logged-in roles: toggle dropdown
                  <>
                    <button
                      onClick={() => setIsCoursesOpen(!isCoursesOpen)}
                      className="hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                      style={{ color: 'var(--session-text)' }}
                      aria-haspopup="true"
                      aria-expanded={isCoursesOpen}
                    >
                      Courses
                      <ChevronDown className={`h-4 w-4 transition-transform ${isCoursesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCoursesOpen && (
                      <div className="absolute right-0 top-full translate-y-2 -translate-x-1 origin-top-right w-44 rounded-md shadow-md z-40" style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}>
                        <Link
                          href="/recorded-courses"
                          onClick={() => setIsCoursesOpen(false)}
                          className="block px-4 py-2 text-sm hover:bg-gray-50"
                          style={{ color: 'var(--session-text)' }}
                        >
                          Recorded Courses
                        </Link>
                      </div>
                    )}
                  </>
                )
              ) : (
                // No user (guest): simple Courses link only (no chevron/dropdown)
                <Link
                  href="/courses"
                  className="hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{ color: 'var(--session-text)' }}
                >
                  Courses
                </Link>
              )}
            </div>

            {/* Other nav items */}
            {navigation.filter(i => i.name !== 'Dashboard').map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{ color: 'var(--session-text)' }}
              >
                {item.name}
              </Link>
            ))}
            {!(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
              <button onClick={openContact} className="hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium cursor-pointer" style={{ color: 'var(--session-text)' }}>
                Contact Us
              </button>
            )}
          </div>

          {/* Desktop right controls: Dark mode on the left, account pill on the right */}
          <div className="hidden md:flex items-center h-14 space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              aria-label="Toggle dark mode"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ background: 'var(--section-bg)' }}
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5" style={{ color: 'var(--session-text)' }} />}
            </button>
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Combined clickable pill with name */}
                <div className="relative" ref={accountRefDesktop}>
                  <button
                    id="account-button"
                    aria-haspopup="true"
                    aria-expanded={isAccountOpen}
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    className="group flex items-center gap-3 rounded-full border px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors hover-bg-accent hover:shadow-sm cursor-pointer"
                    style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}
                    aria-label="Open account menu"
                  >
                    <span className="text-left text-sm leading-tight" style={{ color: 'var(--session-text)' }}>
                      <span className="font-medium block truncate max-w-[10rem]">{user.name}</span>
                      <span className="text-xs block" style={{ color: 'var(--session-subtext)' }}>
                        {formatRole(user.role)}
                      </span>
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--session-subtext)' }} />
                  </button>
                  {isAccountOpen && (
                    <div
                      ref={menuRef}
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="account-button"
                      className="absolute right-0 mt-2 w-56 rounded-md shadow-md z-50 transition transform duration-150 ease-out"
                      style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}
                    >
                      <Link href="/account" ref={firstMenuItemRef} role="menuitem" tabIndex={-1} className="block px-4 py-3 text-sm focus:outline-none transition-colors hover-bg-accent" style={{ color: 'var(--session-text)' }}>Account Details</Link>
                      {user?.role === 'ADMIN' && (
                        <Link href="/instructors" role="menuitem" tabIndex={-1} className="block px-4 py-3 text-sm focus:outline-none transition-colors hover-bg-accent" style={{ color: 'var(--session-text)' }}>Instructors</Link>
                      )}
                      <Link href="/account/change-password" role="menuitem" tabIndex={-1} className="block px-4 py-3 text-sm focus:outline-none transition-colors hover-bg-accent" style={{ color: 'var(--session-text)' }}>Change Password</Link>
                      <div className="border-t" style={{ borderColor: 'var(--section-border)' }} />
                      <button onClick={handleLogout} role="menuitem" tabIndex={-1} className="w-full text-left px-4 py-3 text-sm text-red-600 focus:outline-none transition-colors hover-bg-accent">Log Out</button>
                    </div>
                  )}
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
          <div className="md:hidden flex items-center h-14 space-x-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
              aria-label="Toggle dark mode"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun className="h-5 w-5 text-yellow-400" /> : <Moon className="h-5 w-5 text-gray-700" />}
            </button>
            {user && (
              <div className="relative" ref={accountRefMobile}>
                <button
                  id="account-button-mobile"
                  aria-haspopup="true"
                  aria-expanded={isAccountOpen}
                  onClick={() => setIsAccountOpen(!isAccountOpen)}
                  className="group flex items-center gap-2 rounded-full border px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors hover-bg-accent hover:shadow-sm"
                  style={{ background: 'var(--section-bg)', borderColor: 'var(--section-border)' }}
                  aria-label="Open account menu"
                >
                  <span
                    className="rounded-full w-8 h-8 flex items-center justify-center text-xs font-medium"
                    style={{ background: 'var(--section-bg)', color: 'var(--session-text)' }}
                  >
                    {(user?.name || '').split(' ').map(n => n[0]).slice(0,2).join('').toUpperCase() || 'U'}
                  </span>
                  <span className="text-left text-xs leading-tight max-w-[6rem] truncate" style={{ color: 'var(--session-text)' }}>
                    <span className="font-medium block truncate">{user.name}</span>
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--session-subtext)' }} />
                </button>
                {isAccountOpen && (
                  <div
                    ref={menuRef}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="account-button-mobile"
                    className="absolute right-0 mt-2 w-56 rounded-md shadow-md z-50 transition transform duration-150 ease-out"
                    style={{ background: 'var(--section-bg)', border: '1px solid var(--section-border)' }}
                  >
                    <Link href="/account" ref={firstMenuItemRef} role="menuitem" tabIndex={-1} className="block px-4 py-3 text-sm focus:outline-none transition-colors hover-bg-accent" style={{ color: 'var(--session-text)' }}>Account Details</Link>
                    {user?.role === 'ADMIN' && (
                      <Link href="/instructors" role="menuitem" tabIndex={-1} className="block px-4 py-3 text-sm focus:outline-none transition-colors hover-bg-accent" style={{ color: 'var(--session-text)' }}>Instructors</Link>
                    )}
                    <Link href="/account/change-password" role="menuitem" tabIndex={-1} className="block px-4 py-3 text-sm focus:outline-none transition-colors hover-bg-accent" style={{ color: 'var(--session-text)' }}>Change Password</Link>
                    <div className="border-t" style={{ borderColor: 'var(--section-border)' }} />
                    <button onClick={handleLogout} role="menuitem" tabIndex={-1} className="w-full text-left px-4 py-3 text-sm text-red-600 focus:outline-none transition-colors hover-bg-accent">Log Out</button>
                  </div>
                )}
              </div>
            )}
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
              <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>Dashboard</Link>

              {/* Mobile Courses: match desktop behavior
                  - Admin/Instructor: label -> /courses, chevron toggles nested links (On-demand, Batches)
                  - Student: simple link to /courses
                  - Guest: split control (label -> /courses, chevron toggles Recorded Courses)
                  - Other roles: toggle dropdown with Recorded Courses
              */}
              {user ? (
                (user.role === 'ADMIN' || user.role === 'INSTRUCTOR') ? (
                  <div>
                    <div className="flex items-center justify-between px-3 py-2">
                      <Link href="/courses" className="text-gray-700 hover:text-blue-600 text-base font-medium" onClick={() => setIsMenuOpen(false)}>Courses</Link>
                      <button onClick={() => setIsCoursesOpen(!isCoursesOpen)} className="p-1 rounded-md hover:bg-gray-100" aria-label="Toggle courses submenu">
                        <ChevronDown className={`h-5 w-5 ${isCoursesOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                    {isCoursesOpen && (
                      <div className="pl-4 space-y-1">
                        <Link href="/on-demand-courses" className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium" onClick={() => { setIsMenuOpen(false); setIsCoursesOpen(false); }}>Recorded Courses</Link>
                        <Link href="/batches" className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium" onClick={() => { setIsMenuOpen(false); setIsCoursesOpen(false); }}>Batches</Link>
                      </div>
                    )}
                  </div>
                ) : user.role === 'STUDENT' ? (
                  <Link href="/courses" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>Courses</Link>
                ) : (
                  <div>
                    <button onClick={() => setIsCoursesOpen(!isCoursesOpen)} className="w-full text-left text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium flex items-center justify-between" aria-label="Toggle courses submenu">
                      <span>Courses</span>
                      <ChevronDown className={`h-5 w-5 ${isCoursesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isCoursesOpen && (
                      <div className="pl-4">
                        <Link href="/recorded-courses" className="block text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-base font-medium" onClick={() => { setIsMenuOpen(false); setIsCoursesOpen(false); }}>Recorded Courses</Link>
                      </div>
                    )}
                  </div>
                )
              ) : (
                // guest: simple Courses link only (no chevron/dropdown)
                <Link href="/courses" className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium" onClick={() => setIsMenuOpen(false)}>Courses</Link>
              )}
              {navigation.filter(i => i.name !== 'Dashboard').map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {!(user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR') && (
                <button onClick={() => { openContact(); setIsMenuOpen(false) }} className="text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left cursor-pointer">
                  Contact Us
                </button>
              )}
              {user ? (
                <div className="border-t pt-4">
                  <div className="px-3 py-2">
                    <p className="text-sm text-gray-700 font-medium">{user.name}</p>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      {formatRole(user.role)}
                    </span>
                  </div>
                  <Link href="/account" className="text-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left" onClick={() => setIsMenuOpen(false)}>Account Details</Link>
                  {user?.role === 'ADMIN' && (
                    <Link href="/instructors" className="text-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left" onClick={() => setIsMenuOpen(false)}>Instructors</Link>
                  )}
                  <Link href="/account/change-password" className="text-gray-700 block px-3 py-2 rounded-md text-base font-medium w-full text-left" onClick={() => setIsMenuOpen(false)}>Change Password</Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-700 hover:text-red-600 block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    Log Out
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
