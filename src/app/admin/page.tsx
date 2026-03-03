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
  ArrowRight
} from 'lucide-react'
import { ToastContainer, showToast } from '@/components/admin/Toast'

interface Stats {
  belts: number
  modules: number
  techniques: number
  users: number
  admins: number
  instructors: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/stats')
      if (!response.ok) throw new Error('Erreur lors de la récupération des stats')
      const data = await response.json()
      setStats(data)
    } catch (error) {
      showToast('Erreur lors de la récupération des statistiques', 'error')
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { 
      title: 'Ceintures', 
      value: stats?.belts || 0, 
      icon: Award, 
      color: 'bg-yellow-500',
      href: '/admin/belts'
    },
    { 
      title: 'Modules', 
      value: stats?.modules || 0, 
      icon: BookOpen, 
      color: 'bg-blue-500',
      href: '/admin/modules'
    },
    { 
      title: 'Techniques', 
      value: stats?.techniques || 0, 
      icon: Dumbbell, 
      color: 'bg-green-500',
      href: '/admin/techniques'
    },
    { 
      title: 'Utilisateurs', 
      value: stats?.users || 0, 
      icon: Users, 
      color: 'bg-purple-500',
      href: '/admin/users'
    },
  ]

  const userCards = [
    { 
      title: 'Administrateurs', 
      value: stats?.admins || 0, 
      icon: Shield, 
      color: 'bg-red-500',
    },
    { 
      title: 'Instructeurs', 
      value: stats?.instructors || 0, 
      icon: UserCheck, 
      color: 'bg-orange-500',
    },
  ]

  const quickLinks = [
    { title: 'Gérer les ceintures', href: '/admin/belts', color: 'border-yellow-200 hover:bg-yellow-50' },
    { title: 'Gérer les modules', href: '/admin/modules', color: 'border-blue-200 hover:bg-blue-50' },
    { title: 'Gérer les techniques', href: '/admin/techniques', color: 'border-green-200 hover:bg-green-50' },
    { title: 'Voir les statistiques', href: '/admin/stats', color: 'border-purple-200 hover:bg-purple-50' },
  ]

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
        {statCards.map((card) => {
          const Icon = card.icon
          return (
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
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600">
                <TrendingUp className="w-4 h-4 mr-1" />
                <span>Gérer</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          )
        })}
      </div>

      {/* Section utilisateurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {userCards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Liens rapides */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.title}
              href={link.href}
              className={`flex items-center justify-between p-4 rounded-lg border-2 ${link.color} transition-colors`}
            >
              <span className="font-medium text-gray-700">{link.title}</span>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}