import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Необходима авторизация' },
        { status: 401 }
      )
    }

    const { id } = await params
    const systemId = parseInt(id)
    
    if (isNaN(systemId)) {
      return NextResponse.json(
        { error: 'Неверный ID системы' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { systemName, systemShortName, systemPurpose, hasPersonalData } = body

    const updatedSystem = await prisma.informationSystem.update({
      where: { systemId },
      data: {
        systemName,
        systemShortName,
        systemPurpose,
        hasPersonalData,
        lastChangeUser: Number(session.user.id),
        lastChangeDate: new Date(),
      },
    })

    return NextResponse.json(updatedSystem)
  } catch (error) {
    console.error('Error updating system:', error)
    return NextResponse.json(
      { error: 'Ошибка при обновлении системы' },
      { status: 500 }
    )
  }
}
