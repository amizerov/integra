'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

interface SystemsListProps {
  systems: any[]
}

export default function SystemsList({ systems }: SystemsListProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredSystems = useMemo(() => {
    return systems.filter(system => {
      const matchesSearch = searchQuery === '' || 
        system.systemName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        system.systemShortName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        system.systemId?.toString().includes(searchQuery)

      return matchesSearch
    })
  }, [systems, searchQuery])

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <Card>
        <CardContent className="pt-6">
          <Input
            type="search"
            placeholder="Поиск по названию или коду..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </CardContent>
      </Card>

      {/* Результаты поиска */}
      {searchQuery && (
        <div className="text-sm text-muted-foreground">
          Найдено систем: {filteredSystems.length}
        </div>
      )}

      {/* Список систем */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSystems.length > 0 ? (
          filteredSystems.map((system: any) => (
            <Link key={system.id} href={`/systems/${system.id}`}>
              <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{system.systemName}</CardTitle>
                      <CardDescription className="mt-1">
                        ID: {system.systemId}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Версий:</span>
                      <span className="font-medium">{system._count?.versions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Документов:</span>
                      <span className="font-medium">{system._count?.documents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Связей:</span>
                      <span className="font-medium">
                        {system._count?.connections || 0}
                      </span>
                    </div>
                    {system.hasPersonalData === 1 && (
                      <div className="pt-2 border-t">
                        <span className="inline-flex items-center text-xs text-orange-600 dark:text-orange-400">
                          ⚠️ Содержит персональные данные
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
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
    </div>
  )
}
