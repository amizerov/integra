import { getUserById } from '../actions'
import { redirect } from 'next/navigation'
import UserEditClient from './UserEditClient'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function UserEditPage({ params }: PageProps) {
  const { id } = await params
  const userId = parseInt(id)

  if (isNaN(userId)) {
    redirect('/users')
  }

  const result = await getUserById(userId)

  if (!result.success || !result.data) {
    redirect('/users')
  }

  return <UserEditClient user={result.data} />
}
