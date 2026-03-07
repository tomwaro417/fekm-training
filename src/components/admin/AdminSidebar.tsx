'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Award, 
  BookOpen, 
  Dumbbell,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  Video,
  BarChart3
} from 'lucide-react'
import { useState } from 'react'

const menuItems = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/belts', icon: Award, label: 'Ceintures' },
  { href: '/admin/modules', icon: BookOpen, label: 'Modules' },
  { href: '/admin/techniques', icon: Dumbbell, label: 'Techniques' },
  { href: '/admin/videos', icon: Video, label: 'Vidéos' },
  { href: '/admin/users', icon: Users, label: 'Utilisateurs' },
  { href: '/admin/stats', icon: BarChart3, label: 'Statistiques' },
  { href: '/admin/settings', icon: Settings, label: 'Paramètres' },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside 
      className={`bg-slate-900 text-white transition-all duration-300 flex flex-col ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className={`flex items-center gap-2 ${collapsed ? 'justify-center w-full' : ''}`}>
          <Shield className="w-8 h-8 text-blue-400" />
          {!collapsed && (
            <div>
              <h1 className="font-bold text-lg">FEKM Admin</h1>
              <p className="text-xs text-slate-400">Espace administration</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Collapse button */}
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full p-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span className="text-sm">Réduire</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}