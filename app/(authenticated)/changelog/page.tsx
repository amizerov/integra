import { getChangeLogs, markChangeLogsAsViewed } from './actions'
import ChangeLogList from './ChangeLogList'

export const revalidate = 60 // Обновлять каждую минуту

export default async function ChangeLogPage() {
  const result = await getChangeLogs(100)
  
  // Отметить как просмотренное при открытии страницы
  await markChangeLogsAsViewed()

  if (!result.success || !result.data) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">История изменений</h1>
        <div className="text-center py-12 text-muted-foreground">
          Ошибка загрузки истории изменений
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">История изменений</h1>
        <p className="text-sm text-muted-foreground">
          Всего записей: {result.data.length}
        </p>
      </div>
      
      <ChangeLogList logs={result.data} />
    </div>
  )
}
