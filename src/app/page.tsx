"use client"

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { BookOpen, Users, PlayCircle, Award } from 'lucide-react'

export default function HomePage() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="min-h-screen -mx-4 sm:-mx-6" style={{ background: 'var(--background)' }}>
      {/* Hero Section (true full-bleed) */}
      <section className="w-full bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {/* subtle overlay to soften gradient */}
        <div className="absolute inset-0 z-0 bg-black opacity-12 pointer-events-none" />

        <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-36 text-white transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Learn Without Limits
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              Access world-class training with video recordings and interactive sessions
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Get Started
              </Link>
              <Link
                href="/login"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Curved SVG separator */}
        <div className={`relative z-10 pointer-events-none mt-0 drop-shadow-sm transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
          <svg className="w-full h-20 md:h-28" viewBox="0 0 1440 140" preserveAspectRatio="none">
            <path d="M0,80 C360,180 1080,-40 1440,80 L1440,140 L0,140 Z" fill="var(--background)" opacity="0.95" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <div className="py-16" style={{ background: 'var(--section-bg)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--foreground)' }}>
              Everything you need to learn effectively
            </h2>
            <p className="text-xl" style={{ color: 'var(--session-subtext)' }}>
              Our platform provides comprehensive tools for online learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 rounded-xl transition-all hover:shadow-lg hover:-translate-y-1" style={{ background: 'var(--background)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-110" style={{ background: 'rgba(37, 99, 235, 0.15)' }}>
                <BookOpen className="h-8 w-8" style={{ color: 'var(--accent)' }} />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Structured Courses
              </h3>
              <p style={{ color: 'var(--session-subtext)' }}>
                Well-organized course content with clear learning paths
              </p>
            </div>

            <div className="text-center p-6 rounded-xl transition-all hover:shadow-lg hover:-translate-y-1" style={{ background: 'var(--background)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-110" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                <PlayCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Video Recordings
              </h3>
              <p style={{ color: 'var(--session-subtext)' }}>
                Access training sessions anytime with high-quality recordings
              </p>
            </div>

            <div className="text-center p-6 rounded-xl transition-all hover:shadow-lg hover:-translate-y-1" style={{ background: 'var(--background)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-110" style={{ background: 'rgba(168, 85, 247, 0.15)' }}>
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Batch Learning
              </h3>
              <p style={{ color: 'var(--session-subtext)' }}>
                Learn with peers in organized batches and sessions
              </p>
            </div>

            <div className="text-center p-6 rounded-xl transition-all hover:shadow-lg hover:-translate-y-1" style={{ background: 'var(--background)' }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-transform hover:scale-110" style={{ background: 'rgba(234, 179, 8, 0.15)' }}>
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
                Track Progress
              </h3>
              <p style={{ color: 'var(--session-subtext)' }}>
                Monitor your learning journey with detailed progress tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16" style={{ background: 'rgba(0, 0, 0, 0.85)', color: 'white' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to start learning?
          </h2>
          <p className="text-xl mb-8" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Join thousands of students already learning on our platform
          </p>
          <Link
            href="/register"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}