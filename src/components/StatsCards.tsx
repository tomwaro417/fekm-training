'use client'

import { ProgressLevel } from '@prisma/client'

interface StatsCardsProps {
  totalTechniques: number
  mastered: number
  acquired: number
  learning: number
}

export function StatsCards({ totalTechniques, mastered, acquired, learning }: StatsCardsProps) {
  const notStarted = totalTechniques - mastered - acquired - learning

  const stats = [
    { label: 'Techniques maîtrisées', value: mastered, color: 'bg-green-500', total: totalTechniques },
    { label: 'Techniques acquises', value: acquired, color: 'bg-blue-500', total: totalTechniques },
    { label: 'En apprentissage', value: learning, color: 'bg-yellow-500', total: totalTechniques },
    { label: 'Non commencées', value: notStarted > 0 ? notStarted : 0, color: 'bg-gray-300', total: totalTechniques },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-3xl font-bold mt-1">{stat.value}</p>
            </div>
            <div className={`w-12 h-12 rounded-full ${stat.color} bg-opacity-20 flex items-center justify-center`}>
              <div className={`w-6 h-6 rounded-full ${stat.color}`} />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${stat.color} transition-all`}
                style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stat.total > 0 ? Math.round((stat.value / stat.total) * 100) : 0}% du programme
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
