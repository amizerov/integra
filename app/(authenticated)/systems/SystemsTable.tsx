'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useRouter } from 'next/navigation'

interface SystemsTableProps {
  systems: any[]
}

export default function SystemsTable({ systems }: SystemsTableProps) {
  const router = useRouter()

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="rounded-md border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[60px]">ID</TableHead>
            <TableHead>Название</TableHead>
            <TableHead className="w-[150px]">Код</TableHead>
            <TableHead className="w-20 text-center">Версий</TableHead>
            <TableHead className="w-20 text-center">Связей</TableHead>
            <TableHead className="w-20 text-center">Документов</TableHead>
            <TableHead className="w-[150px]">Запись добавлена</TableHead>
            <TableHead className="w-[100px]">Добавлена когда</TableHead>
            <TableHead className="w-[150px]">Изменена кем</TableHead>
            <TableHead className="w-[100px]">Изменена когда</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {systems.length > 0 ? (
            systems.map((system: any) => (
              <TableRow
                key={system.id}
                className="cursor-pointer hover:bg-accent"
                onClick={() => router.push(`/systems/${system.id}`)}
              >
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {system.systemId}
                    {system.hasPersonalData === 1 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded" title="Содержит персональные данные">
                        ⚠
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{system.systemName}</div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {system.systemShortName || '-'}
                </TableCell>
                <TableCell className="text-center">
                  {system._count.versions}
                </TableCell>
                <TableCell className="text-center">
                  {system._count.connections}
                </TableCell>
                <TableCell className="text-center">
                  {system._count.documents}
                </TableCell>
                <TableCell className="text-sm truncate">
                  {system.createdBy || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(system.createdAt)}
                </TableCell>
                <TableCell className="text-sm truncate">
                  {system.modifiedBy || '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(system.modifiedAt)}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                Системы не найдены
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
