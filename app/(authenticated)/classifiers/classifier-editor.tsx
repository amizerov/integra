'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useConfirm } from '@/components/ui/confirm-dialog'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiTrash2, FiSave, FiX, FiDatabase, FiFileText, FiMonitor } from 'react-icons/fi'
import {
  getDocumentKinds,
  createDocumentKind,
  updateDocumentKind,
  deleteDocumentKind,
  getDbmsList,
  createDbms,
  updateDbms,
  deleteDbms,
  getOperatingSystems,
  createOperatingSystem,
  updateOperatingSystem,
  deleteOperatingSystem
} from './actions'

type ClassifierType = 'doc_kind' | 'dbms' | 'opersys'

interface ClassifierItem {
  id: number
  name: string
  description?: string
  vendor?: string
  version?: string
  osType?: string
}

interface ClassifierConfig {
  key: ClassifierType
  title: string
  tableName: string
  description: string
  icon: React.ReactNode
  idLabel: string
  nameLabel: string
  hasDescription?: boolean
  hasVendor?: boolean
  hasVersion?: boolean
  hasOsType?: boolean
}

const classifiers: ClassifierConfig[] = [
  {
    key: 'doc_kind',
    title: 'Типы документов',
    tableName: 'c1_doc_kind',
    description: 'Классификатор типов нормативных документов',
    icon: <FiFileText className="h-4 w-4" />,
    idLabel: 'Код типа документа',
    nameLabel: 'Наименование типа документа'
  },
  {
    key: 'dbms',
    title: 'Используемые СУБД',
    tableName: 'c2_dbms',
    description: 'Классификатор систем управления базами данных',
    icon: <FiDatabase className="h-4 w-4" />,
    idLabel: 'Код СУБД',
    nameLabel: 'Наименование СУБД',
    hasDescription: true
  },
  {
    key: 'opersys',
    title: 'Операционные системы',
    tableName: 'c3_opersys',
    description: 'Классификатор операционных систем',
    icon: <FiMonitor className="h-4 w-4" />,
    idLabel: 'Код ОС',
    nameLabel: 'Наименование ОС',
    hasDescription: true,
    hasVendor: true,
    hasVersion: true,
    hasOsType: true
  }
]

export function ClassifierEditor() {
  const confirm = useConfirm()
  const [activeClassifier, setActiveClassifier] = useState<ClassifierType>('doc_kind')
  const [items, setItems] = useState<ClassifierItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ClassifierItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  
  // Form state
  const [formId, setFormId] = useState<number>(0)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formVendor, setFormVendor] = useState('')
  const [formVersion, setFormVersion] = useState('')
  const [formOsType, setFormOsType] = useState('')
  const [saving, setSaving] = useState(false)

  const currentConfig = classifiers.find(c => c.key === activeClassifier)!

  // Load data when classifier changes
  useEffect(() => {
    loadData()
  }, [activeClassifier])

  const loadData = async () => {
    setLoading(true)
    try {
      let data: any[] = []
      switch (activeClassifier) {
        case 'doc_kind':
          data = await getDocumentKinds()
          setItems(data.map(d => ({ id: d.docKindId, name: d.documentTypeName || '' })))
          break
        case 'dbms':
          data = await getDbmsList()
          setItems(data.map(d => ({ 
            id: d.dbmsId, 
            name: d.dbmsName || '',
            description: d.dbmsDescription || ''
          })))
          break
        case 'opersys':
          data = await getOperatingSystems()
          setItems(data.map(d => ({ 
            id: d.id, 
            name: d.osName || '',
            description: d.description || '',
            vendor: d.vendor || '',
            version: d.osVersion || '',
            osType: d.osType || ''
          })))
          break
      }
    } catch (error) {
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectClassifier = (key: ClassifierType) => {
    setActiveClassifier(key)
    setSelectedItem(null)
    setSheetOpen(false)
  }

  const handleRowClick = (item: ClassifierItem) => {
    setSelectedItem(item)
    setFormId(item.id)
    setFormName(item.name)
    setFormDescription(item.description || '')
    setFormVendor(item.vendor || '')
    setFormVersion(item.version || '')
    setFormOsType(item.osType || '')
    setIsEditing(true)
    setIsCreating(false)
    setSheetOpen(true)
  }

  const handleAddNew = () => {
    const maxId = items.length > 0 ? Math.max(...items.map(i => i.id)) : 0
    setFormId(maxId + 1)
    setFormName('')
    setFormDescription('')
    setFormVendor('')
    setFormVersion('')
    setFormOsType('')
    setSelectedItem(null)
    setIsEditing(false)
    setIsCreating(true)
    setSheetOpen(true)
  }

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Наименование не может быть пустым')
      return
    }

    setSaving(true)
    try {
      if (isCreating) {
        switch (activeClassifier) {
          case 'doc_kind':
            await createDocumentKind({ docKindId: formId, documentTypeName: formName })
            break
          case 'dbms':
            await createDbms({ dbmsName: formName, dbmsDescription: formDescription || undefined })
            break
          case 'opersys':
            await createOperatingSystem({ 
              osName: formName, 
              description: formDescription || undefined,
              vendor: formVendor || undefined,
              osVersion: formVersion || undefined,
              osType: formOsType || undefined
            })
            break
        }
        toast.success('Запись успешно создана')
      } else if (isEditing && selectedItem) {
        switch (activeClassifier) {
          case 'doc_kind':
            await updateDocumentKind(selectedItem.id, { documentTypeName: formName })
            break
          case 'dbms':
            await updateDbms(selectedItem.id, { dbmsName: formName, dbmsDescription: formDescription || undefined })
            break
          case 'opersys':
            await updateOperatingSystem(selectedItem.id, { 
              osName: formName,
              description: formDescription || undefined,
              vendor: formVendor || undefined,
              osVersion: formVersion || undefined,
              osType: formOsType || undefined
            })
            break
        }
        toast.success('Запись успешно обновлена')
      }
      await loadData()
      setSheetOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = async () => {
    if (!selectedItem) return

    const confirmed = await confirm({
      title: 'Удаление записи',
      message: `Вы действительно хотите удалить запись "${selectedItem.name || selectedItem.id}"? Это действие нельзя отменить.`,
      confirmText: 'Удалить',
      cancelText: 'Отмена',
      variant: 'danger'
    })

    if (confirmed) {
      try {
        switch (activeClassifier) {
          case 'doc_kind':
            await deleteDocumentKind(selectedItem.id)
            break
          case 'dbms':
            await deleteDbms(selectedItem.id)
            break
          case 'opersys':
            await deleteOperatingSystem(selectedItem.id)
            break
        }
        toast.success('Запись успешно удалена')
        await loadData()
        setSheetOpen(false)
        setSelectedItem(null)
      } catch (error: any) {
        toast.error(error.message || 'Ошибка удаления')
      }
    }
  }

  const handleCancel = () => {
    setSheetOpen(false)
    setIsCreating(false)
    setIsEditing(false)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая панель - список классификаторов */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Справочники</CardTitle>
            <CardDescription>
              Выберите справочник для редактирования
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {classifiers.map((classifier) => (
                <button
                  key={classifier.key}
                  onClick={() => handleSelectClassifier(classifier.key)}
                  className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 cursor-pointer ${
                    activeClassifier === classifier.key
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'hover:bg-accent'
                  }`}
                >
                  {classifier.icon}
                  <div className="flex flex-col">
                    <span className="font-medium">{classifier.title}</span>
                    <span className={`text-xs ${
                      activeClassifier === classifier.key 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {classifier.tableName}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Правая панель - содержимое классификатора */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentConfig.icon}
                  {currentConfig.title}
                </CardTitle>
                <CardDescription>
                  {currentConfig.description} ({currentConfig.tableName})
                </CardDescription>
              </div>
              <Button size="sm" onClick={handleAddNew}>
                <FiPlus className="h-4 w-4 mr-1" />
                Добавить запись
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-20">
                      ID
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                      {currentConfig.nameLabel}
                    </th>
                    {currentConfig.hasDescription && (
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden md:table-cell">
                        Описание
                      </th>
                    )}
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground w-24">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={currentConfig.hasDescription ? 4 : 3} className="p-8 text-center text-muted-foreground">
                        Загрузка...
                      </td>
                    </tr>
                  ) : items.length > 0 ? (
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b transition-colors hover:bg-muted/50 cursor-pointer ${
                          selectedItem?.id === item.id ? 'bg-muted/50' : ''
                        }`}
                        onClick={() => handleRowClick(item)}
                      >
                        <td className="p-4 align-middle font-mono text-sm">
                          {item.id}
                        </td>
                        <td className="p-4 align-middle">
                          {item.name || '—'}
                        </td>
                        {currentConfig.hasDescription && (
                          <td className="p-4 align-middle text-muted-foreground text-sm hidden md:table-cell">
                            {item.description || '—'}
                          </td>
                        )}
                        <td className="p-4 align-middle text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRowClick(item)
                            }}
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={currentConfig.hasDescription ? 4 : 3} className="p-8 text-center text-muted-foreground">
                        Нет записей
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm text-muted-foreground">
              Всего записей: {items.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sheet для редактирования */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              {currentConfig.icon}
              {isCreating ? 'Новая запись' : 'Редактирование записи'}
            </SheetTitle>
            <SheetDescription>
              {currentConfig.title} ({currentConfig.tableName})
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="itemId">{currentConfig.idLabel}</Label>
              <Input
                id="itemId"
                type="number"
                value={formId}
                onChange={(e) => setFormId(parseInt(e.target.value) || 0)}
                disabled={isEditing || activeClassifier !== 'doc_kind'}
                className="font-mono"
              />
              {(isEditing || activeClassifier !== 'doc_kind') && (
                <p className="text-xs text-muted-foreground">
                  {activeClassifier === 'doc_kind' ? 'Код записи нельзя изменить' : 'ID генерируется автоматически'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemName">{currentConfig.nameLabel} *</Label>
              <Input
                id="itemName"
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Введите наименование..."
              />
            </div>

            {currentConfig.hasVendor && (
              <div className="space-y-2">
                <Label htmlFor="itemVendor">Производитель</Label>
                <Input
                  id="itemVendor"
                  type="text"
                  value={formVendor}
                  onChange={(e) => setFormVendor(e.target.value)}
                  placeholder="Например: Microsoft, Oracle, Linux Foundation..."
                />
              </div>
            )}

            {currentConfig.hasVersion && (
              <div className="space-y-2">
                <Label htmlFor="itemVersion">Версия</Label>
                <Input
                  id="itemVersion"
                  type="text"
                  value={formVersion}
                  onChange={(e) => setFormVersion(e.target.value)}
                  placeholder="Например: 10, 11, 22.04..."
                />
              </div>
            )}

            {currentConfig.hasOsType && (
              <div className="space-y-2">
                <Label htmlFor="itemOsType">Тип ОС</Label>
                <Input
                  id="itemOsType"
                  type="text"
                  value={formOsType}
                  onChange={(e) => setFormOsType(e.target.value)}
                  placeholder="Например: Desktop, Server, Mobile..."
                />
              </div>
            )}

            {currentConfig.hasDescription && (
              <div className="space-y-2">
                <Label htmlFor="itemDescription">Описание</Label>
                <Input
                  id="itemDescription"
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Введите описание..."
                />
              </div>
            )}

            <div className="flex flex-col gap-3 pt-6 border-t">
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  <FiSave className="h-4 w-4 mr-1" />
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </Button>
                <Button variant="outline" onClick={handleCancel} className="flex-1">
                  <FiX className="h-4 w-4 mr-1" />
                  Отмена
                </Button>
              </div>

              {isEditing && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteClick}
                  className="w-full"
                >
                  <FiTrash2 className="h-4 w-4 mr-1" />
                  Удалить запись
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
