'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { FiDatabase, FiRefreshCw, FiAlertCircle } from 'react-icons/fi'

export default function DatabaseErrorScreen() {
  const router = useRouter()

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <FiDatabase className="w-20 h-20 text-muted-foreground animate-pulse" />
              <FiAlertCircle className="w-8 h-8 text-destructive absolute -top-1 -right-1 animate-bounce" />
            </div>
          </div>
          <CardTitle className="text-2xl">Нет подключения к базе данных</CardTitle>
          <CardDescription className="text-base mt-2">
            Не удалось установить соединение с сервером базы данных
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                1
              </div>
              <div>
                <p className="font-medium">Проверьте SSH-туннель</p>
                <p className="text-sm text-muted-foreground mt-1">
                  База данных доступна через SSH-туннель на порту 5433. Убедитесь, что туннель запущен.
                </p>
                <code className="block mt-2 p-2 bg-background rounded text-xs">
                  ssh -L 5433:localhost:5432 user@server
                </code>
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                2
              </div>
              <div>
                <p className="font-medium">Проверьте PostgreSQL</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Убедитесь, что PostgreSQL запущен на удалённом сервере и доступен на порту 5432.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                3
              </div>
              <div>
                <p className="font-medium">Проверьте настройки подключения</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Строка подключения: <code className="text-xs bg-background px-1 py-0.5 rounded">localhost:5433</code>
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              onClick={() => router.refresh()} 
              className="flex-1"
            >
              <FiRefreshCw className="w-4 h-4 mr-2" />
              Повторить попытку
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex-1"
            >
              На главную
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Если проблема не устраняется, обратитесь к администратору системы
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
