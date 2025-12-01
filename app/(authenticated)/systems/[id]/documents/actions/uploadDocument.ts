'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function uploadDocument(
  systemId: number,
  formData: FormData
) {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, error: 'Необходима авторизация' }
  }

  const userId = Number(session.user.id)

  try {
    const file = formData.get('file') as File | null
    const docKindId = formData.get('docKindId') as string | null
    const normativeDocumentNumber = formData.get('normativeDocumentNumber') as string | null
    const normativeDocumentDate = formData.get('normativeDocumentDate') as string | null
    const approvedBy = formData.get('approvedBy') as string | null
    const documentBasicPoints = formData.get('documentBasicPoints') as string | null
    const documentType = formData.get('documentType') as string | null // 'scan' or 'text'

    if (!file) {
      return { success: false, error: 'Файл не выбран' }
    }

    // Get file data
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = file.name
    const fileExtension = path.extname(fileName).replace('.', '')
    const fileSize = buffer.length

    // Get next document_id
    const maxDoc = await prisma.documentFullText.findFirst({
      orderBy: { documentId: 'desc' },
      select: { documentId: true }
    })
    const nextDocumentId = (maxDoc?.documentId || 0) + 1

    // Create document full text record
    await prisma.documentFullText.create({
      data: {
        documentId: nextDocumentId,
        fileName,
        fileExtension,
        fileBody: buffer,
        fileSize,
        userId,
        creationDate: new Date(),
        lastChangeUser: userId,
        lastChangeDate: new Date()
      }
    })

    // Get next normative_document_id for this system
    const maxNormDoc = await prisma.managingDocument.findFirst({
      where: { systemId },
      orderBy: { normativeDocumentId: 'desc' },
      select: { normativeDocumentId: true }
    })
    const nextNormativeDocumentId = (maxNormDoc?.normativeDocumentId || 0) + 1

    // Create managing document record
    await prisma.managingDocument.create({
      data: {
        systemId,
        normativeDocumentId: nextNormativeDocumentId,
        normativeDocumentNumber: normativeDocumentNumber?.trim() || null,
        normativeDocumentDate: normativeDocumentDate ? new Date(normativeDocumentDate) : null,
        approvedBy: approvedBy?.trim() || null,
        documentBasicPoints: documentBasicPoints?.trim() || null,
        docKindId: docKindId ? parseInt(docKindId) : null,
        scanDocumentId: documentType === 'scan' ? nextDocumentId : null,
        textDocumentId: documentType === 'text' ? nextDocumentId : null,
        userId,
        creationDate: new Date(),
        lastChangeUser: userId,
        lastChangeDate: new Date()
      }
    })

    // Save file to public/docs/system[systemId]
    const publicDir = path.join(process.cwd(), 'public', 'docs', `system${systemId}`)
    await mkdir(publicDir, { recursive: true })
    const filePath = path.join(publicDir, fileName)
    await writeFile(filePath, buffer)

    revalidatePath(`/systems/${systemId}`)

    return { success: true, documentId: nextDocumentId }
  } catch (error) {
    console.error('Error uploading document:', error)
    return { success: false, error: 'Ошибка при загрузке документа' }
  }
}
