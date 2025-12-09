import { Suspense } from 'react'
import ResetPasswordForm from './ResetPasswordForm'

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Suspense fallback={<div>Загрузка...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  )
}
