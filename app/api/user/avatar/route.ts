import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ avatarUrl: null })
    }

    const userId = typeof session.user.id === 'string' 
      ? parseInt(session.user.id) 
      : session.user.id

    const user = await prisma.allowedUser.findUnique({
      where: { userId },
      select: { avatarUrl: true }
    })

    return NextResponse.json({ avatarUrl: user?.avatarUrl || null })
  } catch (error) {
    return NextResponse.json({ avatarUrl: null })
  }
}
