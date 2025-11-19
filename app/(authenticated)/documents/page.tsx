import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getAllDocuments } from './actions/getAllDocuments'
import { FiFile, FiDownload } from 'react-icons/fi'

export default async function DocumentsPage() {
  const result = await getAllDocuments()

  if (!result.success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Документы</h1>
        </div>
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-destructive">Ошибка при загрузке документов</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const documents = result.data || []

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Б'
    const k = 1024
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Документы</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          {documents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тип</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead>Система</TableHead>
                    <TableHead>Файл</TableHead>
                    <TableHead>Размер</TableHead>
                    <TableHead>Дата создания</TableHead>
                    <TableHead className="text-right">Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc, index) => (
                    <TableRow key={`${doc.id}-${index}`}>
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          <FiFile className="h-4 w-4" />
                          {doc.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{doc.title}</p>
                          {doc.additionalInfo && doc.additionalInfo !== '-' && (
                            <p className="text-sm text-muted-foreground">{doc.additionalInfo}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{doc.systemShortName}</p>
                          <p className="text-sm text-muted-foreground">{doc.systemName}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{doc.fileName}</span>
                          {doc.fileExtension && (
                            <span className="text-xs px-2 py-0.5 bg-muted rounded">
                              .{doc.fileExtension}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(doc.creationDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`/docs/${doc.fileName}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                          <FiDownload className="h-4 w-4" />
                          Скачать
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Нет документов</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
