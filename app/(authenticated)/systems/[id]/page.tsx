import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getSystemById } from '../actions/getSystemById'
import SystemDetailView from './SystemDetailView'

// Обновлять каждые 5 минут
export const revalidate = 300

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SystemDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session) {
    notFound()
  }

  const { id } = await params
  const systemId = parseInt(id)

  if (isNaN(systemId)) {
    notFound()
  }

  const system = await getSystemById(systemId)

  if (!system) {
    notFound()
  }

  return <SystemDetailView system={system} />
}
