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
  FiList,
  FiX
} from 'react-icons/fi'
import { Button } from '@/components/ui/button'

const navigation = [
  { name: 'Главная', href: '/dashboard', icon: FiHome },
  { name: 'Системы', href: '/systems', icon: FiServer },
  { name: 'Связи', href: '/connections', icon: FiGitBranch },
  { name: 'Документы', href: '/documents', icon: FiFileText },
  { name: 'Классификаторы', href: '/classifiers', icon: FiList },
  { name: 'Администрирование', href: '/admin', icon: FiSettings, adminOnly: true },
]

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed md:static inset-y-0 left-0 z-50 flex flex-col w-64 bg-[color:var(--color-card)] border-r border-[color:var(--color-border)] transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="flex items-center h-16 px-6 border-b border-[color:var(--color-border)]">
          <Link href="/dashboard" className="flex items-center space-x-2 flex-1">
            <div className="h-8 px-3 bg-[#4285B4] rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-xs">НИВЦ</span>
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">АИС Интеграция</span>
              <span className="text-xs text-[color:var(--color-muted-foreground)]">Версия 1.2</span>
            </div>
          </Link>
          
          {/* Close button for mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <FiX className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors cursor-pointer',
                  isActive
                    ? 'bg-[color:var(--color-secondary)] text-[color:var(--color-foreground)]'
                    : 'text-[color:var(--color-muted-foreground)] hover:bg-[color:var(--color-accent)] hover:text-[color:var(--color-foreground)]'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[color:var(--color-border)]">
          <div className="text-xs text-[color:var(--color-muted-foreground)] text-center">
            © 2025 МГУ имени М.В.Ломоносова
          </div>
        </div>
      </div>
    </>
  )
}
