import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProfileClient } from './ProfileClient'
import { getUserProfile } from './actions'

export default async function ProfilePage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Получаем полные данные пользователя из базы
  const userFromDb = await getUserProfile()

  const user = {
    id: userFromDb?.userId || session.user?.id,
    fio: userFromDb?.fio,
    name: (session.user as any)?.name,
    eMail: userFromDb?.eMail,
    phoneNumber: userFromDb?.phoneNumber,
    userLevel: userFromDb?.userLevel,
    userLogin: userFromDb?.userLogin,
    avatarUrl: userFromDb?.avatarUrl,
    emailVerified: userFromDb?.emailVerified
  }

  return <ProfileClient user={user} />
}
