import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import CreateSystemForm from './CreateSystemForm'

export default async function NewSystemPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">Добавить новую систему</h1>
        <p className="text-muted-foreground">
          Создание новой информационной системы
        </p>
      </div>

      <CreateSystemForm userId={session.user.id} />
    </div>
  )
}
