'use client'

import { useState } from 'react'
import Common from './versions/Common'
import Organization from './versions/Organization'
import Technical from './versions/Technical'
import Documents from './versions/Documents'
import Connections from './versions/Connections'

interface VersionProps {
  version: any
  systemId: number
}

export default function Version({ version, systemId }: VersionProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'organizational' | 'technical' | 'documents' | 'connections'>('info')

  const versionTabs = [
    { id: 'info' as const, label: 'Общая информация' },
    { id: 'organizational' as const, label: 'Организационная информация' },
    { id: 'technical' as const, label: 'Техническая информация' },
    { id: 'documents' as const, label: 'Документы' },
    { id: 'connections' as const, label: 'Связи' },
  ]

  return (
    <div className="space-y-6">
      {/* Version Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-6">
          {versionTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-1 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground cursor-pointer'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && <Common version={version} systemId={systemId} />}
      {activeTab === 'organizational' && <Organization version={version} systemId={systemId} />}
      {activeTab === 'technical' && <Technical version={version} systemId={systemId} />}
      {activeTab === 'documents' && <Documents version={version} systemId={systemId} />}
      {activeTab === 'connections' && <Connections version={version} systemId={systemId} />}
    </div>
  )
}
