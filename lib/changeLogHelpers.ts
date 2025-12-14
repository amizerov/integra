import { logChange } from '@/app/(authenticated)/changelog/actions'

// Хелпер для логирования изменений систем
export async function logSystemChange(
  systemId: number, 
  action: 'created' | 'updated' | 'deleted',
  systemName: string,
  metadata?: Record<string, any>
) {
  await logChange({
    entityType: 'system',
    entityId: systemId,
    action,
    description: `Система "${systemName}" была ${
      action === 'created' ? 'создана' : 
      action === 'updated' ? 'обновлена' : 
      'удалена'
    }`,
    metadata
  })
}

// Хелпер для логирования изменений версий
export async function logVersionChange(
  versionId: number,
  action: 'created' | 'updated' | 'deleted', 
  systemName: string,
  versionName: string,
  metadata?: Record<string, any>
) {
  await logChange({
    entityType: 'version',
    entityId: versionId,
    action,
    description: `Версия "${versionName}" системы "${systemName}" была ${
      action === 'created' ? 'создана' : 
      action === 'updated' ? 'обновлена' : 
      'удалена'
    }`,
    metadata
  })
}

// Хелпер для логирования изменений потоков данных
export async function logStreamChange(
  streamId: number,
  action: 'created' | 'updated' | 'deleted',
  description: string,
  metadata?: Record<string, any>
) {
  await logChange({
    entityType: 'stream',
    entityId: streamId,
    action,
    description,
    metadata
  })
}

// Хелпер для логирования изменений документов
export async function logDocumentChange(
  documentId: number,
  action: 'created' | 'updated' | 'deleted',
  documentTitle: string,
  metadata?: Record<string, any>
) {
  await logChange({
    entityType: 'document',
    entityId: documentId,
    action,
    description: `Документ "${documentTitle}" был ${
      action === 'created' ? 'создан' : 
      action === 'updated' ? 'обновлен' : 
      'удален'
    }`,
    metadata
  })
}
