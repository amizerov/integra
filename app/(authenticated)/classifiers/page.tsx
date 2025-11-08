import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/db'

export default async function ClassifiersPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Получаем типы документов из справочника
  const documentTypes = await prisma.documentKind.findMany({
    orderBy: { docKindId: 'asc' }
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая панель - список классификаторов */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Справочники</CardTitle>
            <CardDescription>
              Выберите классификатор для редактирования
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Тип документа (C1_Doc_Kind)
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors" disabled>
                Полный текст документа (Intgr4_Document_Full_Text)
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors" disabled>
                Методические пособия (Intgr_2_1_User_Guides)
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors" disabled>
                Связи системы (Intgr_2_2_Data_Streams)
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors" disabled>
                Формат обмена (Intgr_2_2_1_Exchange_Formats)
              </button>
              <button className="w-full text-left px-3 py-2 rounded-md hover:bg-accent transition-colors" disabled>
                Схемы данных (Intgr_2_3_Schemas)
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Правая панель - содержимое классификатора */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Тип документа (C1_Doc_Kind)</CardTitle>
                <CardDescription>
                  Классификатор типов нормативных документов
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button size="sm" disabled>Добавить запись</Button>
                <Button size="sm" variant="outline" disabled>Удалить запись</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-24">
                      Код типа документа
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      Наименование типа документа
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {documentTypes.length > 0 ? (
                    documentTypes.map((docType: any) => (
                      <tr 
                        key={docType.docKindId} 
                        className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      >
                        <td className="p-4 align-middle">
                          {docType.docKindId}
                        </td>
                        <td className="p-4 align-middle">
                          {docType.documentTypeName || '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="p-8 text-center text-muted-foreground">
                        Нет записей
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Форма редактирования */}
            {documentTypes.length > 0 && (
              <div className="mt-6 space-y-4 p-4 border rounded-md bg-muted/20">
                <h3 className="font-semibold">Редактирование записи</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Код типа документа
                    </label>
                    <input
                      type="number"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      defaultValue={documentTypes[0]?.docKindId}
                      disabled
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Наименование типа документа
                    </label>
                    <input
                      type="text"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      defaultValue={documentTypes[0]?.documentTypeName || ''}
                      disabled
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <Button size="sm" disabled>Сохранить изменения</Button>
                  <Button size="sm" variant="outline" disabled>Отменить изменения</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
