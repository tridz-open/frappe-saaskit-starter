import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertDialog, AlertDialogBackdrop, AlertDialogContent, AlertDialogDescription, AlertDialogTitle } from '@ui-sdk/react/alert-dialog'
import { Button } from '@ui-sdk/react/button'
import { Field, FieldLabel } from '@ui-sdk/react/field'
import { Input } from '@ui-sdk/react/input'
import { Alert } from '../../components/primitives'
import { useT } from '../../i18n'
import type { Instance } from '../../data/types'

/** Type-to-confirm delete. Stays open while the request runs and shows a failure inline. */
export function DeleteDialog({ target, onClose, onConfirm }: { target: Instance | null; onClose: () => void; onConfirm: (i: Instance) => Promise<unknown> | void }) {
  const t = useT()
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  // Reset when the target changes (adjust state during render rather than in an effect).
  const [prevTarget, setPrevTarget] = useState(target)
  if (prevTarget !== target) { setPrevTarget(target); setTyped(''); setBusy(false); setFailed(false) }
  const name = target?.name ?? ''
  const ok = !!target && typed === target.name
  async function go() {
    if (!ok || !target) return
    setBusy(true); setFailed(false)
    try { await onConfirm(target); onClose() } catch { setFailed(true); setBusy(false) }
  }
  return (
    <AlertDialog open={!!target} onOpenChange={(o) => { if (!o && !busy) onClose() }}>
      <AlertDialogBackdrop />
      <AlertDialogContent>
        <div data-slot="stack">
          <AlertDialogTitle>{t('console.delete.title', { name })}</AlertDialogTitle>
          <AlertDialogDescription>{t('console.delete.lost', { name })} {t('console.delete.backupHint')} <Link to="/console/backups" onClick={onClose}>{t('console.detail.dangerBackups')}</Link></AlertDialogDescription>
          <Field name="confirm">
            <FieldLabel id="delete-confirm-label">{t('console.delete.typeLabel', { name })}</FieldLabel>
            <Input value={typed} onValueChange={(v) => setTyped(String(v))} autoComplete="off" autoFocus aria-describedby="delete-confirm-label" data-testid="delete-confirm-input" />
          </Field>
          {failed && <Alert tone="danger">{t('console.delete.error')}</Alert>}
        </div>
        <div data-slot="row">
          <Button type="button" data-variant="ghost" data-testid="delete-cancel" disabled={busy} onClick={onClose}>{t('console.delete.keep')}</Button>
          <Button type="button" data-variant="destructive" data-testid="delete-confirm" disabled={!ok || busy} onClick={() => void go()}>{busy ? t('console.delete.working') : t('console.delete.confirm')}</Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
