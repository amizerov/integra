import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getSystems } from '@/lib/actions/systems'
import SystemsList from './SystemsList'

export default async function SystemsPage() {
  const { systems } = await getSystems()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Системы</h1>
          <p className="text-muted-foreground">
            Управление автоматизированными информационными системами
          </p>
        </div>
        <Button>
          Добавить систему
        </Button>
      </div>

      <SystemsList systems={systems} />
    </div>
  )
}
