import { notFound } from 'next/navigation'
import { getSystemById } from '@/lib/actions/systems'
import EditSystemForm from './EditSystemForm'

export default async function EditSystemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const systemId = parseInt(id)
  const system = await getSystemById(systemId)

  if (!system) {
    notFound()
  }

  return <EditSystemForm system={system} />
}
