'use server'

import { prisma } from '@/lib/db'
import { auth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// === Document Kind (c1_doc_kind) ===

export async function getDocumentKinds() {
  return prisma.documentKind.findMany({
    orderBy: { docKindId: 'asc' }
  })
}

export async function createDocumentKind(data: { docKindId: number; documentTypeName: string }) {
  const session = await auth()
  if (!session) throw new Error('Не авторизован')

  const result = await prisma.documentKind.create({
    data: {
      docKindId: data.docKindId,
      documentTypeName: data.documentTypeName
    }
  })
  revalidatePath('/classifiers')
  return result
}

export async function updateDocumentKind(id: number, data: { documentTypeName: string }) {
  const session = await auth()
  if (!session) throw new Error('Не авторизован')

  const result = await prisma.documentKind.update({
    where: { docKindId: id },
    data: { documentTypeName: data.documentTypeName }
  })
  revalidatePath('/classifiers')
  return result
}

export async function deleteDocumentKind(id: number) {
  const session = await auth()
  if (!session) throw new Error('Не авторизован')

  await prisma.documentKind.delete({
    where: { docKindId: id }
  })
  revalidatePath('/classifiers')
}

// === DBMS (c2_dbms) ===

export async function getDbmsList() {
  return prisma.dbms.findMany({
    orderBy: { dbmsId: 'asc' }
  })
}

export async function createDbms(data: { dbmsName: string; dbmsDescription?: string }) {
  const session = await auth()
  if (!session) throw new Error('Не авторизован')

  const result = await prisma.dbms.create({
    data: {
      dbmsName: data.dbmsName,
      dbmsDescription: data.dbmsDescription
    }
  })
  revalidatePath('/classifiers')
  return result
}

export async function updateDbms(id: number, data: { dbmsName: string; dbmsDescription?: string }) {
  const session = await auth()
  if (!session) throw new Error('Не авторизован')

  const result = await prisma.dbms.update({
    where: { dbmsId: id },
    data: { 
      dbmsName: data.dbmsName,
      dbmsDescription: data.dbmsDescription
    }
  })
  revalidatePath('/classifiers')
  return result
}

export async function deleteDbms(id: number) {
  const session = await auth()
  if (!session) throw new Error('Не авторизован')

  await prisma.dbms.delete({
    where: { dbmsId: id }
  })
  revalidatePath('/classifiers')
}

// === Operating Systems (c3_opersys) ===

export async function getOperatingSystems() {
  return prisma.operatingSystem.findMany({
    orderBy: { id: 'asc' }
  })
}

export async function createOperatingSystem(data: { osName: string; vendor?: string; osVersion?: string; osType?: string; description?: string }) {
  const session = await auth()
  if (!session) throw new Error('Не авторизован')

  const result = await prisma.operatingSystem.create({
    data: {
      osName: data.osName,
      vendor: data.vendor,
      osVersion: data.osVersion,
      osType: data.osType,
      description: data.description
    }
  })
  revalidatePath('/classifiers')
  return result
}

export async function updateOperatingSystem(id: number, data: { osName: string; vendor?: string; osVersion?: string; osType?: string; description?: string }) {
  const session = await auth()
  if (!session) throw new Error('Не авторизован')

  const result = await prisma.operatingSystem.update({
    where: { id },
    data: { 
      osName: data.osName,
      vendor: data.vendor,
      osVersion: data.osVersion,
      osType: data.osType,
      description: data.description
    }
  })
  revalidatePath('/classifiers')
  return result
}

export async function deleteOperatingSystem(id: number) {
  const session = await auth()
  if (!session) throw new Error('Не авторизован')

  await prisma.operatingSystem.delete({
    where: { id }
  })
  revalidatePath('/classifiers')
}
