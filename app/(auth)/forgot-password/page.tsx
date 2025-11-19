import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Восстановление пароля</CardTitle>
          <CardDescription>
            Функция восстановления пароля находится в разработке
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Для восстановления доступа обратитесь к администратору системы
          </p>
          <Link href="/login" className="block">
            <Button className="w-full" variant="outline">
              Вернуться на страницу входа
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
