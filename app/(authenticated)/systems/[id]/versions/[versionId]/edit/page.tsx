import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import EditVersionForm from './EditVersionForm'
import { auth } from '@/lib/auth'

export default async function EditVersionPage({ 
  params 
}: { 
  params: Promise<{ id: string; versionId: string }> 
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  const { id, versionId } = await params
  const systemId = parseInt(id)
  const versionIdNum = parseInt(versionId)

  const [system, version] = await Promise.all([
    prisma.informationSystem.findUnique({
      where: { systemId }
    }),
    prisma.systemVersion.findUnique({
      where: { versionId: versionIdNum }
    })
  ])

  if (!system || !version) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Редактирование версии</h1>
        <p className="text-muted-foreground">
          {system.systemName} - Версия {version.versionCode || version.versionId}
        </p>
      </div>

      <EditVersionForm 
        systemId={systemId} 
        version={version}
        userId={session.user.id}
      />
    </div>
  )
}
