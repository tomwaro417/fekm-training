'use client'

import { ProgressLevel } from '@prisma/client'
import Link from 'next/link'

interface RecentTechniquesProps {
  progress: Array<{
    id: string
    level: ProgressLevel
    lastUpdated: Date
    technique: {
      name: string
      module: {
        code: string
        belt: {
          id: string
          name: string
          color: string
        }
      }
    }
  }>
}

const levelLabels: Record<ProgressLevel, string> = {
  NON_ACQUIS: 'Non acquis',
  EN_COURS_DAPPRENTISSAGE: 'En cours',
  ACQUIS: 'Acquis',
  MAITRISE: 'Maîtrisé',
}

const levelColors: Record<ProgressLevel, string> = {
  NON_ACQUIS: 'bg-gray-200 text-gray-600',
  EN_COURS_DAPPRENTISSAGE: 'bg-yellow-100 text-yellow-700',
  ACQUIS: 'bg-blue-100 text-blue-700',
  MAITRISE: 'bg-green-100 text-green-700',
}

export function RecentTechniques({ progress }: RecentTechniquesProps) {
  if (progress.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Commencez à explorer les techniques pour voir votre progression ici.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {progress.map((p) => (
        <Link
          key={p.id}
          href={`/technique/${p.technique.module.belt.id}`}
          className="block p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {p.technique.name}
              </p>
              <p className="text-sm text-gray-500">
                {p.technique.module.code} - Ceinture {p.technique.module.belt.name}
              </p>
            </div>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${levelColors[p.level]}`}>
              {levelLabels[p.level]}
            </span>
          </div>
        </Link>
      ))}
    </div>
  )
}
