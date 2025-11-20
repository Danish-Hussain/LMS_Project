'use client'

import { TrendingUp, CheckCircle, PlayCircle, BookOpen } from 'lucide-react'
import { StatCard } from './StatCard'

interface ProgressStatsProps {
  totalProgress: number
  completedSessions: number
  totalSessions: number
  activeCourses: number
}

export function ProgressStats({ 
  totalProgress, 
  completedSessions, 
  totalSessions, 
  activeCourses 
}: ProgressStatsProps) {
  const stats = [
    {
      key: 'overall-progress',
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />,
      bgColor: '',
      bgStyle: { background: 'var(--stat-blue-bg)' },
      label: 'Overall Progress',
      value: `${Math.round(totalProgress)}%`
    },
    {
      key: 'completed-sessions',
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      bgColor: '',
      bgStyle: { background: 'var(--stat-green-bg)' },
      label: 'Completed Sessions',
      value: completedSessions
    },
    {
      key: 'total-sessions',
      icon: <PlayCircle className="h-6 w-6 text-purple-600" />,
      bgColor: '',
      bgStyle: { background: 'var(--stat-purple-bg)' },
      label: 'Total Sessions',
      value: totalSessions
    },
    {
      key: 'active-courses',
      icon: <BookOpen className="h-6 w-6 text-yellow-600" />,
      bgColor: '',
      bgStyle: { background: 'var(--stat-yellow-bg)' },
      label: 'Active Courses',
      value: activeCourses
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {stats.map((stat) => (
        <StatCard
          key={stat.key}
          id={stat.key}
          icon={stat.icon}
          bgColor={stat.bgColor}
          bgStyle={stat.bgStyle}
          label={stat.label}
          value={stat.value}
        />
      ))}
    </div>
  )
}