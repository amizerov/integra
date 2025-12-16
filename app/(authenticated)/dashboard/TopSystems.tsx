'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface TopSystem {
  systemId: number
  systemName: string
  systemShortName: string | null
  totalConnections: number
  outgoingCount: number
  incomingCount: number
}

interface TopSystemsProps {
  systems: TopSystem[]
}

export default function TopSystems({ systems }: TopSystemsProps) {
  const [visibleCount, setVisibleCount] = useState(8)

  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth
      
      if (width >= 1920) {
        setVisibleCount(7) // 3xl
      } else if (width >= 1536) {
        setVisibleCount(7) // 2xl
      } else if (width >= 1280) {
        setVisibleCount(6) // xl
      } else if (width >= 1024) {
        setVisibleCount(5) // lg
      } else if (width >= 768) {
        setVisibleCount(4) // md
      } else if (width >= 640) {
        setVisibleCount(3) // sm
      } else if (width >= 480) {
        setVisibleCount(1) // xs
      } else {
        setVisibleCount(1) // mobile
      }
    }

    updateVisibleCount()
    window.addEventListener('resize', updateVisibleCount)
    return () => window.removeEventListener('resize', updateVisibleCount)
  }, [])

  return (
    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 3xl:grid-cols-7 gap-4">
      {systems.slice(0, visibleCount).map((system) => (
        <Card key={system.systemId} className="h-full hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group">
          <Link href={`/systems/${system.systemId}`}>
            <CardHeader className="pb-2 cursor-pointer">
              <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
                {system.systemShortName || system.systemName}
              </CardTitle>
            </CardHeader>
          </Link>
          <Link href={`/connections?filter=${system.systemId}`}>
            <CardContent className="cursor-pointer">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Всего связей</span>
                  <span className="font-bold text-primary text-xl group-hover:scale-110 transition-transform">
                    {system.totalConnections}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Исходящие:</span>
                  <span className="font-semibold">{system.outgoingCount}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Входящие:</span>
                  <span className="font-semibold">{system.incomingCount}</span>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      ))}
    </div>
  )
}
