'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { BookOpen, Users, PlayCircle, Award, TrendingUp, Quote } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default function DashboardRedirect() {
  redirect('/')
}

