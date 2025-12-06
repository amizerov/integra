import { redirect } from 'next/navigation'
import { verifyEmail } from '@/app/(authenticated)/profile/actions'

interface Props {
  searchParams: Promise<{ token?: string; userId?: string }>
}

export default async function VerifyEmailPage({ searchParams }: Props) {
  const params = await searchParams
  const { token, userId } = params

  if (!token || !userId) {
    redirect('/profile?error=' + encodeURIComponent('Неверная ссылка подтверждения'))
  }

  try {
    await verifyEmail(token, parseInt(userId))
    redirect('/profile?verified=true')
  } catch (error: any) {
    redirect('/profile?error=' + encodeURIComponent(error.message || 'Ошибка подтверждения'))
  }
}
