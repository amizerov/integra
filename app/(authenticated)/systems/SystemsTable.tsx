'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

interface SystemsTableProps {
  systems: any[]
}

export default function SystemsTable({ systems }: SystemsTableProps) {
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
            <TableHead className="w-[80px] text-center">Версий</TableHead>
            <TableHead className="w-[80px] text-center">Связей</TableHead>
            <TableHead className="w-[100px] text-center">Документов</TableHead>
            <TableHead className="w-[150px]">Создана кем</TableHead>
            <TableHead className="w-[100px]">Создана когда</TableHead>
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
              >
                <TableCell className="font-medium">
                  <Link href={`/systems/${system.id}`} className="block">
                    <div className="flex items-center gap-2">
                      {system.systemId}
                      {system.hasPersonalData === 1 && (
                        <span className="inline-flex items-center justify-center w-5 h-5 text-xs bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded" title="Содержит персональные данные">
                          ⚠
                        </span>
                      )}
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/systems/${system.id}`} className="block">
                    <div className="font-medium">{system.systemName}</div>
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/systems/${system.id}`} className="block text-muted-foreground">
                    {system.systemShortName || '-'}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/systems/${system.id}`} className="block">
                    {system._count.versions}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/systems/${system.id}`} className="block">
                    {system._count.connections}
                  </Link>
                </TableCell>
                <TableCell className="text-center">
                  <Link href={`/systems/${system.id}`} className="block">
                    {system._count.documents}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/systems/${system.id}`} className="block text-sm truncate">
                    {system.createdBy || '-'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/systems/${system.id}`} className="block text-sm text-muted-foreground">
                    {formatDate(system.createdAt)}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/systems/${system.id}`} className="block text-sm truncate">
                    {system.modifiedBy || '-'}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/systems/${system.id}`} className="block text-sm text-muted-foreground">
                    {formatDate(system.modifiedAt)}
                  </Link>
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
