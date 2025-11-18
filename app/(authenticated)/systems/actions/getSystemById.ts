'use server'

import { prisma } from '@/lib/db'

export async function getSystemById(systemId: number) {
  try {
    const system = await prisma.informationSystem.findUnique({
      where: { systemId },
      include: {
        creator: {
          select: {
            fio: true,
          },
        },
        modifier: {
          select: {
            fio: true,
          },
        },
        versions: {
          orderBy: {
            versionDevelopmentYear: 'desc',
          },
          include: {
            creator: {
              select: {
                userId: true,
                fio: true,
              },
            },
            modifier: {
              select: {
                userId: true,
                fio: true,
              },
            },
            userGuides: {
              include: {
                intgr4_document_full_text: {
                  select: {
                    fileName: true,
                    fileExtension: true,
                    fileSize: true,
                  }
                }
              }
            },
            schemas: {
              include: {
                intgr4_document_full_text: {
                  select: {
                    fileName: true,
                    fileExtension: true,
                    fileSize: true,
                  }
                }
              }
            },
            dataStreamsSource: true,
            dataStreamsRecipient: true,
          },
        },
        documents: true,
        _count: {
          select: {
            versions: true,
            documents: true,
          },
        },
      },
    })

    if (!system) {
      return null
    }

    return system
  } catch (error) {
    console.error('Error fetching system:', error)
    return null
  }
}
