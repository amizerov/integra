'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { 
  FiHome, 
  FiServer, 
  FiGitBranch, 
  FiFileText, 
  FiSettings,
  FiUsers,
  FiList
} from 'react-icons/fi'

const navigation = [
  { name: 'Главная', href: '/dashboard', icon: FiHome },
  { name: 'Системы', href: '/systems', icon: FiServer },
  { name: 'Связи', href: '/connections', icon: FiGitBranch },
  { name: 'Документы', href: '/documents', icon: FiFileText },
  { name: 'Классификаторы', href: '/classifiers', icon: FiList },
  { name: 'Администрирование', href: '/admin', icon: FiSettings, adminOnly: true },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col w-64 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center h-16 px-6 border-b border-border">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-[var(--mgu-red)] rounded-md flex items-center justify-center">
            <span className="text-white font-bold text-sm">МГУ</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">АИС Интеграция</span>
            <span className="text-xs text-muted-foreground">Версия 1.2</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          © 2025 МГУ имени М.В.Ломоносова
        </div>
      </div>
    </div>
  )
}
