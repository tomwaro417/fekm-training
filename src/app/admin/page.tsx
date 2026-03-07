'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Award, 
  BookOpen, 
  Dumbbell, 
  Users, 
  Shield, 
  UserCheck,
  TrendingUp,
  ArrowRight,
  Activity,
  Video,
  Clock,
  ChevronRight
} from 'lucide-react'
import { ToastContainer, showToast } from '@/components/admin/Toast'
import { Card, StatCard } from '@/components/admin/FormComponents'

interface Stats {
  belts: number
  modules: number
  techniques: number
  users: number
  admins: number
  instructors: number
  videos: number
}

interface RecentActivity {
  id: string
  type: 'user_registered' | 'video_uploaded' | 'belt_assigned' | 'progress_updated'
  title: string
  description: string
  user?: {
    name: string | null
    email: string
  }
  timestamp: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    fetchRecentActivity()
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) {
        // Si l'API n'existe pas ou retourne une erreur, utiliser des stats par défaut
        setStats({
          belts: 6,
          modules: 0,
          techniques: 127,
          users: 0,
          admins: 1,
          instructors: 0,
          videos: 0
        })
        return
      }
      const data = await response.json()
      setStats(data)
    } catch (error) {
      // Utiliser des stats par défaut en cas d'erreur
      setStats({
        belts: 6,
        modules: 0,
        techniques: 127,
        users: 0,
        admins: 1,
        instructors: 0,
        videos: 0
      })
    } finally {
      setLoading(false)
    }
  }

  async function fetchRecentActivity() {
    // Simuler des données d'activité récente
    // Plus tard, on pourrait créer une API dédiée
    const mockActivity: RecentActivity[] = [
      {
        id: '1',
        type: 'user_registered',
        title: 'Nouvel utilisateur',
        description: 'Jean Dupont s\'est inscrit',
        user: { name: 'Jean Dupont', email: 'jean@example.com' },
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: '2',
        type: 'video_uploaded',
        title: 'Vidéo uploadée',
        description: 'Direct du bras avant - Vidéo coach',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '3',
        type: 'belt_assigned',
        title: 'Ceinture assignée',
        description: 'Marie Martin a reçu la ceinture Orange',
        user: { name: 'Marie Martin', email: 'marie@example.com' },
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '4',
        type: 'progress_updated',
        title: 'Progression mise à jour',
        description: 'Pierre Durand a maîtrisé 3 nouvelles techniques',
        user: { name: 'Pierre Durand', email: 'pierre@example.com' },
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: '5',
        type: 'video_uploaded',
        title: 'Vidéo uploadée',
        description: 'Crochet du bras avant - Démonstration',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      }
    ]
    setRecentActivity(mockActivity)
  }

  const statCards = [
    { 
      title: 'Ceintures', 
      value: stats?.belts || 0, 
      icon: <Award className="w-6 h-6 text-white" />, 
      colorClass: 'bg-yellow-500',
      href: '/admin/belts'
    },
    { 
      title: 'Modules', 
      value: stats?.modules || 0, 
      icon: <BookOpen className="w-6 h-6 text-white" />, 
      colorClass: 'bg-blue-500',
      href: '/admin/modules'
    },
    { 
      title: 'Techniques', 
      value: stats?.techniques || 0, 
      icon: <Dumbbell className="w-6 h-6 text-white" />, 
      colorClass: 'bg-green-500',
      href: '/admin/techniques'
    },
    { 
      title: 'Utilisateurs', 
      value: stats?.users || 0, 
      icon: <Users className="w-6 h-6 text-white" />, 
      colorClass: 'bg-purple-500',
      href: '/admin/users'
    },
  ]

  const userCards = [
    { 
      title: 'Administrateurs', 
      value: stats?.admins || 0, 
      icon: <Shield className="w-6 h-6 text-white" />, 
      colorClass: 'bg-red-500',
    },
    { 
      title: 'Instructeurs', 
      value: stats?.instructors || 0, 
      icon: <UserCheck className="w-6 h-6 text-white" />, 
      colorClass: 'bg-orange-500',
    },
  ]

  const quickLinks = [
    { title: 'Gérer les ceintures', href: '/admin/belts', color: 'border-yellow-200 hover:bg-yellow-50', icon: Award },
    { title: 'Gérer les modules', href: '/admin/modules', color: 'border-blue-200 hover:bg-blue-50', icon: BookOpen },
    { title: 'Gérer les techniques', href: '/admin/techniques', color: 'border-green-200 hover:bg-green-50', icon: Dumbbell },
    { title: 'Assigner les ceintures', href: '/admin/users', color: 'border-red-200 hover:bg-red-50', icon: Users },
    { title: 'Uploader des vidéos', href: '/admin/videos/upload', color: 'border-pink-200 hover:bg-pink-50', icon: Video },
    { title: 'Voir les statistiques', href: '/admin/stats', color: 'border-purple-200 hover:bg-purple-50', icon: TrendingUp },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_registered':
        return <Users className="w-5 h-5 text-blue-500" />
      case 'video_uploaded':
        return <Video className="w-5 h-5 text-pink-500" />
      case 'belt_assigned':
        return <Award className="w-5 h-5 text-yellow-500" />
      case 'progress_updated':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      default:
        return <Activity className="w-5 h-5 text-gray-500" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 60) return `Il y a ${minutes} min`
    if (hours < 24) return `Il y a ${hours}h`
    return `Il y a ${days}j`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div>
      <ToastContainer />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrateur</h1>
        <p className="text-gray-600 mt-2">Bienvenue dans l'espace d'administration FEKM Training</p>
      </div>

      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.colorClass} p-3 rounded-lg`}>
                {card.icon}
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm text-blue-600">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>Gérer</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Section utilisateurs et activité */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats utilisateurs */}
        <div className="lg:col-span-1 space-y-4">
          {userCards.map((card) => (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.colorClass} p-3 rounded-lg`}>
                  {card.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Activité récente */}
        <Card 
          title="Activité récente" 
          subtitle="Les dernières actions sur la plateforme"
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div 
                key={activity.id} 
                className="flex items-start p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <span className="text-xs text-gray-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t text-center">
            <Link 
              href="/admin/stats" 
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Voir toute l'activité →
            </Link>
          </div>
        </Card>
      </div>

      {/* Liens rapides */}
      <Card title="Actions rapides">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.title}
                href={link.href}
                className={`flex items-center justify-between p-4 rounded-lg border-2 ${link.color} transition-colors group`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center mr-3 group-hover:shadow-sm transition-shadow">
                    <Icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-700">{link.title}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
              </Link>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
