import { Toast, ToastClose, ToastDescription, ToastRegion, ToastTitle } from '@ui-sdk/react/toast'
import { useToast } from '../app/context'

export function AppToasts() {
  const toast = useToast()
  return (
    <ToastRegion toaster={toast}>
      {() => (<Toast><div><ToastTitle /><ToastDescription /></div><ToastClose /></Toast>)}
    </ToastRegion>
  )
}
