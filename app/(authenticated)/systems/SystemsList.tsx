'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import SystemCard from './SystemCard'
import SystemsTable from './SystemsTable'
import { FiGrid, FiList, FiChevronDown, FiArrowUp, FiArrowDown } from 'react-icons/fi'

interface SystemsListProps {
  systems: any[]
  showAddButton?: boolean
}

export default function SystemsList({ systems, showAddButton = true }: SystemsListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [sortField, setSortField] = useState<string>('systemId')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [isLoadingView, setIsLoadingView] = useState(true)

  // Load view mode from localStorage on mount
  useEffect(() => {
    const savedViewMode = localStorage.getItem('systemsViewMode') as 'grid' | 'table' | null
    if (savedViewMode) {
      setViewMode(savedViewMode)
    }
    // Задержка для плавной загрузки
    const timer = setTimeout(() => {
      setIsLoadingView(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Save view mode to localStorage when it changes
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setIsLoadingView(true)
    setViewMode(mode)
    localStorage.setItem('systemsViewMode', mode)
    // Небольшая задержка для плавного перехода
    setTimeout(() => {
      setIsLoadingView(false)
    }, 100)
  }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setShowSortMenu(false)
  }

  const sortFields = [
    { value: 'systemId', label: 'ID' },
    { value: 'systemName', label: 'Название' },
    { value: 'systemShortName', label: 'Код' },
    { value: 'createdAt', label: 'Дата создания' },
    { value: 'modifiedAt', label: 'Дата изменения' },
  ]

  const filteredSystems = useMemo(() => {
    const filtered = systems.filter(system => {
      const matchesSearch = searchQuery === '' || 
        system.systemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        system.systemShortName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        system.systemId?.toString().includes(searchQuery)

      return matchesSearch
    })

    // Sort systems
    return filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a]
      let bValue: any = b[sortField as keyof typeof b]

      // Handle null/undefined values
      if (aValue == null) return 1
      if (bValue == null) return -1

      // Convert to comparable values
      if (sortField === 'createdAt' || sortField === 'modifiedAt') {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [systems, searchQuery, sortField, sortDirection])

  return (
    <div className="space-y-6">
      {/* Поиск и кнопки */}
      <div className="flex gap-3">
        <Input
          type="search"
          placeholder="Поиск по названию или коду..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        
        {/* Sort button */}
        <div className="relative">
          <Button
            variant="outline"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="gap-2"
          >
            {sortDirection === 'asc' ? <FiArrowUp className="h-4 w-4" /> : <FiArrowDown className="h-4 w-4" />}
            {sortFields.find(f => f.value === sortField)?.label}
            <FiChevronDown className="h-4 w-4" />
          </Button>
          
          {showSortMenu && (
            <>
              <div 
                className="fixed inset-0 z-10"
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-20 bg-(--color-card) border border-(--color-border)">
                <div className="py-1">
                  {sortFields.map((field) => (
                    <button
                      key={field.value}
                      onClick={() => handleSort(field.value)}
                      className="flex items-center justify-between w-full px-4 py-2 text-sm hover:bg-(--color-accent) transition-colors text-left cursor-pointer"
                    >
                      <span>{field.label}</span>
                      {sortField === field.value && (
                        sortDirection === 'asc' ? <FiArrowUp className="h-4 w-4" /> : <FiArrowDown className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        
        {/* View mode toggle */}
        <div className="flex border border-(--color-border) rounded-md overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewModeChange('grid')}
            title="Карточки"
            className={`rounded-none border-r border-(--color-border) ${
              viewMode === 'grid' ? 'bg-(--color-secondary) hover:bg-(--color-secondary)' : ''
            }`}
          >
            <FiGrid className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleViewModeChange('table')}
            title="Таблица"
            className={`rounded-none ${
              viewMode === 'table' ? 'bg-(--color-secondary) hover:bg-(--color-secondary)' : ''
            }`}
          >
            <FiList className="h-5 w-5" />
          </Button>
        </div>

        {showAddButton && (
          <Button>
            Добавить систему
          </Button>
        )}
      </div>

      {/* Результаты поиска */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          Найдено систем: {filteredSystems.length}
        </div>
      )}

      {/* Loading state */}
      {isLoadingView ? (
        <Card>
          <CardContent className="flex items-center justify-center h-[calc(100vh-16rem)]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground text-sm">Загрузка...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="animate-fade-in">
          {/* Список систем */}
          {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSystems.length > 0 ? (
            filteredSystems.map((system: any) => (
              <SystemCard key={system.id} system={system} />
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? 'По вашему запросу ничего не найдено' : 'Системы не найдены'}
              </p>
              {searchQuery && (
                <Button 
                  variant="link" 
                  onClick={() => setSearchQuery('')}
                  className="mt-2"
                >
                  Очистить поиск
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        <SystemsTable systems={filteredSystems} />
      )}
      
      {viewMode === 'table' && filteredSystems.length === 0 && searchQuery && (
        <div className="text-center py-4">
          <Button 
            variant="link" 
            onClick={() => setSearchQuery('')}
          >
            Очистить поиск
          </Button>
        </div>
      )}
        </div>
      )}
    </div>
  )
}
