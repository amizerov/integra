import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ClassifierEditor } from './classifier-editor'

export default async function ClassifiersPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <ClassifierEditor />
    </div>
  )
}
