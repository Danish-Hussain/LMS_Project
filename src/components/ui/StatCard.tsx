import { ReactNode, CSSProperties } from 'react'

interface StatCardProps {
  id: string
  icon: ReactNode
  bgColor: string
  bgStyle?: CSSProperties
  label: string
  value: string | number
}

export function StatCard({ id, icon, bgColor, bgStyle, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg shadow p-6" style={{ background: 'var(--section-bg)' }}>
      <div className="flex items-center">
        <div className={`${bgColor} p-3 rounded-lg`} style={bgStyle}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium" style={{ color: 'var(--session-subtext)' }}>{label}</p>
          <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
        </div>
      </div>
    </div>
  )
}