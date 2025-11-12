import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import EditVersionForm from './EditVersionForm'
import { auth } from '@/lib/auth'
import Link from 'next/link'

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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/systems" className="hover:text-foreground transition-colors">
          Системы
        </Link>
        <span>/</span>
        <Link href={`/systems/${systemId}`} className="hover:text-foreground transition-colors">
          {system.systemName}
        </Link>
        <span>/</span>
        <span className="text-foreground">Версия {version.versionCode || version.versionId}</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {system.systemName} — Версия {version.versionCode || version.versionId}
        </h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          {version.versionDevelopmentYear && (
            <span>Год разработки: <span className="text-foreground">{version.versionDevelopmentYear}</span></span>
          )}
          {version.productionStartYear && (
            <span>Начало эксплуатации: <span className="text-foreground">{version.productionStartYear}</span></span>
          )}
          {version.endOfUsageYear && (
            <span>Окончание: <span className="text-foreground">{version.endOfUsageYear}</span></span>
          )}
        </div>
      </div>

      <EditVersionForm 
        systemId={systemId} 
        version={version}
        userId={session.user.id}
      />
    </div>
  )
}
