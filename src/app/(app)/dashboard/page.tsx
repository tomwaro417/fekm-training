import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ProgressChart } from '@/components/ProgressChart'
import { RecentTechniques } from '@/components/RecentTechniques'
import { StatsCards } from '@/components/StatsCards'
import { Button } from '@/components/ui/Button'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Récupérer les ceintures
  const belts = await prisma.belt.findMany({
    orderBy: { order: 'asc' },
    include: {
      modules: {
        include: {
          techniques: true
        }
      }
    }
  })

  // Récupérer la progression de l'utilisateur
  const userProgress = await prisma.userTechniqueProgress.findMany({
    where: { userId: session.user.id },
    include: {
      technique: {
        include: {
          module: {
            include: {
              belt: true
            }
          }
        }
      }
    },
    orderBy: { lastUpdated: 'desc' },
    take: 10
  })

  // Calculer les statistiques
  const totalTechniques = belts.reduce((acc, belt) => 
    acc + belt.modules.reduce((mAcc, mod) => mAcc + mod.techniques.length, 0), 0
  )

  const masteredCount = userProgress.filter(p => p.level === 'MAITRISE').length
  const acquiredCount = userProgress.filter(p => p.level === 'ACQUIS').length
  const learningCount = userProgress.filter(p => p.level === 'EN_COURS_DAPPRENTISSAGE').length

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Bonjour, {session.user.name || session.user.email}
          </h1>
          <p className="mt-2 text-gray-600">
            Suivez votre progression dans le programme FEKM
          </p>
        </div>

        {/* Stats */}
        <StatsCards 
          totalTechniques={totalTechniques}
          mastered={masteredCount}
          acquired={acquiredCount}
          learning={learningCount}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Ceintures */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Programme par ceinture
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {belts.map((belt) => {
                const beltProgress = userProgress.filter(
                  p => p.technique.module.beltId === belt.id
                )
                const beltMastered = beltProgress.filter(p => p.level === 'MAITRISE').length
                const beltTotal = belt.modules.reduce((acc, m) => acc + m.techniques.length, 0)
                const progressPercent = beltTotal > 0 ? (beltMastered / beltTotal) * 100 : 0

                return (
                  <Link
                    key={belt.id}
                    href={`/belt/${belt.id}`}
                    className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border-l-4"
                    style={{ borderLeftColor: belt.color }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Ceinture {belt.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {belt.modules.length} modules • {beltTotal} techniques
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold" style={{ color: belt.color }}>
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${progressPercent}%`,
                            backgroundColor: belt.color
                          }}
                        />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progression récente */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Progression récente
              </h3>
              <RecentTechniques progress={userProgress} />
            </div>

            {/* Actions rapides */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Actions rapides
              </h3>
              <div className="space-y-3">
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/search">
                    🔍 Rechercher une technique
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/to-learn">
                    📚 Techniques à apprendre
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/videos">
                    🎥 Mes vidéos
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
