import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const latestSchema = await prisma.schema.findFirst({
      where: {
        versionId: 0, // Только схемы для АИС Интеграция
      },
      orderBy: {
        dataSchemaVersion: 'desc',
      },
      select: {
        versionId: true,
        dataSchemaVersion: true,
      },
    })

    if (!latestSchema) {
      return NextResponse.json({ 
        success: false, 
        error: 'No saved schemas found' 
      })
    }

    return NextResponse.json({ 
      success: true, 
      schema: latestSchema 
    })
  } catch (error) {
    console.error('Error fetching latest schema:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch latest schema' 
    }, { status: 500 })
  }
}
