"use client"

import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { FiSun, FiMoon, FiBell, FiUser, FiLogOut, FiSettings, FiMenu } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const pathname = usePathname() || ''

  // Загружаем актуальный аватар из профиля
  useEffect(() => {
    if (session?.user) {
      // Сначала используем аватар из сессии
      setAvatarUrl((session.user as any).avatarUrl || null)
      
      // Затем загружаем актуальный из API
      fetch('/api/user/avatar')
        .then(res => res.json())
        .then(data => {
          if (data.avatarUrl) {
            setAvatarUrl(data.avatarUrl)
          }
        })
        .catch(() => {})
    }
  }, [session, pathname])

  // Basic mapping of route -> title + description. Extend as needed.
  const route = pathname.split('?')[0]

  const routes = [
    { match: (p: string) => p === '/' || p === '/dashboard', title: 'Главная', description: 'Обзор всех автоматизированных информационных систем МГУ' },
    { match: (p: string) => p.startsWith('/systems'), title: 'Системы', description: 'Управление автоматизированными информационными системами' },
    { match: (p: string) => p.startsWith('/connections'), title: 'Связи', description: 'Карта связей версий систем и потоков данных' },
    { match: (p: string) => p.startsWith('/schemas'), title: 'Схема данных АИС Интеграция', description: 'Физическая ER-диаграмма базы данных PostgreSQL' },
    { match: (p: string) => p.startsWith('/profile'), title: 'Профиль', description: 'Информация о пользователе' },
    { match: (p: string) => p.startsWith('/settings'), title: 'Настройки', description: 'Настройки приложения' },
    { match: (p: string) => p.startsWith('/admin'), title: 'Администрирование', description: 'Инструменты администрирования' },
    { match: (p: string) => p.startsWith('/classifiers'), title: 'Классификаторы', description: 'Классификаторы и справочники' },
  ]

  let title = 'Приложение'
  let description = ''

  for (const r of routes) {
    if (r.match(route)) {
      title = r.title
      description = r.description
      break
    }
  }

  return (
    <header className="h-16 border-b border-border bg-card">
      <div className="flex items-center justify-between h-full px-4 md:px-6">
        {/* Mobile menu button + Page Title */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Hamburger Menu Button - visible only on mobile */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <FiMenu className="h-5 w-5" />
          </Button>

          {/* Page Title */}
          <div className="min-w-0">
            <h1 className="text-base md:text-lg font-semibold truncate">{title}</h1>
            {description && (
              <p className="hidden md:block text-sm text-muted-foreground truncate">{description}</p>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Темная тема' : 'Светлая тема'}
          >
            {theme === 'light' ? (
              <FiMoon className="h-5 w-5" />
            ) : (
              <FiSun className="h-5 w-5" />
            )}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" title="Уведомления" className="hidden sm:flex">
            <FiBell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 rounded-full hover:bg-accent px-2 md:px-3 py-1.5 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary-foreground text-sm font-medium">
                    {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-sm font-medium">
                  {session?.user?.name || session?.user?.email}
                </div>
                <div className="text-xs text-muted-foreground">
                  {(session?.user as any)?.userLevel === 0 ? 'Администратор' : 'Пользователь'}
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-md shadow-lg z-20">
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiUser className="mr-3 h-4 w-4" />
                      Профиль
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent transition-colors cursor-pointer"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiSettings className="mr-3 h-4 w-4" />
                      Настройки
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors cursor-pointer"
                    >
                      <FiLogOut className="mr-3 h-4 w-4" />
                      Выйти
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
