import type { ReactNode } from 'react'
import { AlertDialog, AlertDialogBackdrop, AlertDialogClose, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@ui-sdk/react/alert-dialog'
import { useT } from '../i18n'

/** Confirm dialog. `destructive` styles the confirm button as destructive; `cancelLabel` names the safe choice explicitly. */
export function ConfirmDialog({ open, title, description, confirmLabel, cancelLabel, destructive, onConfirm, onClose }: { open: boolean; title: string; description: ReactNode; confirmLabel: string; cancelLabel?: string; destructive?: boolean; onConfirm: () => void; onClose: () => void }) {
  const t = useT()
  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <div data-slot="stack">
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </div>
        <div data-slot="row">
          <AlertDialogClose data-testid="confirm-cancel">{cancelLabel ?? t('common.cancel')}</AlertDialogClose>
          <AlertDialogClose data-variant={destructive ? 'destructive' : 'solid'} value="confirm" data-testid="confirm-ok" onClick={onConfirm}>{confirmLabel}</AlertDialogClose>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
