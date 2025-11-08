'use client'

import { useSession, signOut } from 'next-auth/react'
import { useTheme } from '@/contexts/ThemeContext'
import { FiSun, FiMoon, FiBell, FiUser, FiLogOut, FiSettings } from 'react-icons/fi'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import Link from 'next/link'

export function Header() {
  const { data: session } = useSession()
  const { theme, toggleTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)

  return (
    <header className="h-16 border-b border-border bg-card">
      <div className="flex items-center justify-between h-full px-6">
        {/* Breadcrumb or Page Title */}
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
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
          <Button variant="ghost" size="icon" title="Уведомления">
            <FiBell className="h-5 w-5" />
          </Button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 rounded-full hover:bg-accent px-3 py-1.5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-sm font-medium">
                  {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="text-left">
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
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiUser className="mr-3 h-4 w-4" />
                      Профиль
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center px-4 py-2 text-sm hover:bg-accent transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <FiSettings className="mr-3 h-4 w-4" />
                      Настройки
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="flex items-center w-full px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors"
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
