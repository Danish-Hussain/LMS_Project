import { ReactNode } from 'react'

interface StatCardProps {
  id: string
  icon: ReactNode
  bgColor: string
  label: string
  value: string | number
}

export function StatCard({ id, icon, bgColor, label, value }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`${bgColor} p-3 rounded-lg`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  )
}