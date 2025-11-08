// Основные типы экспортируются из Prisma Client автоматически
// import { System, SystemVersion, Connection, Document, User } from '@prisma/client'

// Расширенные типы для систем
export interface SystemWithVersions {
  id: number
  systemCode: string
  systemName: string
  shortName: string | null
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdById: string
  updatedById: string
  versions: any[]
  _count: {
    versions: number
    outgoingConnections: number
    incomingConnections: number
  }
}

export interface SystemWithRelations {
  id: number
  systemCode: string
  systemName: string
  shortName: string | null
  description: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  createdById: string
  updatedById: string
  versions: any[]
  outgoingConnections: any[]
  incomingConnections: any[]
  creator: any
  modifier: any
}

// Типы для версий
export interface VersionWithSystem {
  id: number
  systemId: number
  versionNumber: number
  versionCode: string
  system: any
}

export interface VersionWithRelations {
  id: number
  systemId: number
  versionNumber: number
  versionCode: string
  system: any
  creator: any
  modifier: any
  outgoingConnections: any[]
  incomingConnections: any[]
}

// Типы для связей
export interface ConnectionWithSystems {
  id: number
  sourceSystemId: number
  targetSystemId: number
  sourceVersionId: number | null
  targetVersionId: number | null
  sourceSystem: any
  targetSystem: any
  sourceVersion: any | null
  targetVersion: any | null
}

// Типы для графов
export interface GraphNode {
  id: string
  label: string
  systemId: number
  type: 'system'
  data: {
    systemCode: string
    systemName: string
    versionsCount: number
    isActive: boolean
  }
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  label?: string
  data: {
    connectionId: number
    dataFormat: string
    isBidirectional: boolean
  }
}

// Типы для фильтров
export interface SystemFilters {
  search?: string
  isActive?: boolean
  hasVersions?: boolean
}

export interface VersionFilters {
  systemId?: number
  versionType?: string
  platformType?: string
  isActive?: boolean
  yearFrom?: number
  yearTo?: number
}

export interface ConnectionFilters {
  sourceSystemId?: number
  targetSystemId?: number
  dataFormat?: string
  isActive?: boolean
}

// Типы для форм
export interface SystemFormData {
  systemCode: string
  systemName: string
  shortName?: string
  description?: string
  isActive: boolean
}

export interface VersionFormData {
  systemId: number
  versionNumber: number
  versionCode: string
  versionType: string
  platformType: string
  yearDevelopmentStart?: number
  yearDevelopmentEnd?: number
  yearOperationStart?: number
  yearOperationEnd?: number
  developerDepartment?: string
  operatorDepartment?: string
  authorTeam?: string
  publisher?: string
  deploymentLocation?: string
  technologies?: string[]
  functionalEnvironment?: string
  isCompatibleWithOthers: boolean
  databaseType: string
  databaseShared: boolean
  isActive: boolean
  isMaster: boolean
  comment?: string
}

export interface ConnectionFormData {
  sourceSystemId: number
  targetSystemId: number
  sourceVersionId?: number
  targetVersionId?: number
  connectionName?: string
  description?: string
  dataFormat: string
  exchangeFormat?: string
  masterVersionId?: number
  isActive: boolean
  isBidirectional: boolean
}

// Статистика для дашборда
export interface DashboardStats {
  totalSystems: number
  activeSystems: number
  totalVersions: number
  activeVersions: number
  totalConnections: number
  systemsByPlatform: {
    platform: string
    count: number
  }[]
  recentChanges: {
    type: 'system' | 'version' | 'connection'
    id: number
    name: string
    action: string
    timestamp: Date
  }[]
}

// Типы для уведомлений
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

export interface Notification {
  id: string
  type: NotificationType
  message: string
  description?: string
  timestamp: Date
}
