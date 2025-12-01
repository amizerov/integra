'use client'

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FiAlertTriangle, FiTrash2, FiAlertCircle } from 'react-icons/fi'

type ConfirmVariant = 'danger' | 'warning' | 'info'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: ConfirmVariant
  icon?: ReactNode
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context.confirm
}

interface ConfirmProviderProps {
  children: ReactNode
}

export function ConfirmProvider({ children }: ConfirmProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolveRef, setResolveRef] = useState<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setResolveRef(() => resolve)
      setIsOpen(true)
    })
  }, [])

  const handleConfirm = () => {
    setIsOpen(false)
    resolveRef?.(true)
  }

  const handleCancel = () => {
    setIsOpen(false)
    resolveRef?.(false)
  }

  const getVariantStyles = (variant: ConfirmVariant = 'danger') => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100 dark:bg-red-900/30',
          iconColor: 'text-red-600 dark:text-red-400',
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
          icon: <FiTrash2 className="h-6 w-6" />
        }
      case 'warning':
        return {
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
          iconColor: 'text-yellow-600 dark:text-yellow-400',
          buttonClass: 'bg-yellow-600 hover:bg-yellow-700 text-white',
          icon: <FiAlertTriangle className="h-6 w-6" />
        }
      case 'info':
        return {
          iconBg: 'bg-blue-100 dark:bg-blue-900/30',
          iconColor: 'text-blue-600 dark:text-blue-400',
          buttonClass: 'bg-blue-600 hover:bg-blue-700 text-white',
          icon: <FiAlertCircle className="h-6 w-6" />
        }
    }
  }

  const styles = options ? getVariantStyles(options.variant) : getVariantStyles('danger')

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${styles.iconBg} ${styles.iconColor}`}>
                {options?.icon || styles.icon}
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg">
                  {options?.title || 'Подтверждение'}
                </DialogTitle>
                <DialogDescription className="mt-2 text-sm text-muted-foreground">
                  {options?.message || 'Вы уверены?'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <DialogFooter className="mt-6 gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel}>
              {options?.cancelText || 'Отмена'}
            </Button>
            <Button 
              className={styles.buttonClass}
              onClick={handleConfirm}
            >
              {options?.confirmText || 'Подтвердить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}
