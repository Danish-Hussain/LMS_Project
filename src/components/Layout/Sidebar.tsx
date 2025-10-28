'use client'

import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Users, GraduationCap, BarChart3, Video } from 'lucide-react'
import { clsx } from 'clsx'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'My Courses', href: '/courses', icon: BookOpen },
  { name: 'My Progress', href: '/progress', icon: BarChart3 },
]

const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Courses', href: '/courses', icon: BookOpen },
  { name: 'On-Demand Courses', href: '/on-demand-courses', icon: Video },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Batches', href: '/batches', icon: GraduationCap },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
]

export default function Sidebar() {
  const { user } = useAuth()
  const pathname = usePathname()

  const navItems = user?.role === 'ADMIN'
    ? adminNavigation
    : user?.role === 'INSTRUCTOR'
      ? adminNavigation.filter(item => item.name !== 'Students')
      : navigation

  return (
    <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-gray-50 border-r">
        <div className="flex items-center h-16 px-6 border-b bg-white">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 text-blue-600 rounded-md p-2">
              <BookOpen className="h-6 w-6" />
            </div>
            <div className="text-lg font-semibold text-gray-900">LMS</div>
          </div>
        </div>
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-3 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    isActive
                      ? 'bg-white text-blue-900 border-l-4 border-blue-500 pl-3'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                    'group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-colors space-x-3'
                  )}
                >
                  <div className={clsx(isActive ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500', 'rounded-full p-2') }>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className={clsx(isActive ? 'text-blue-800 font-medium' : 'text-gray-800')}>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </div>
    </div>
  )
}
