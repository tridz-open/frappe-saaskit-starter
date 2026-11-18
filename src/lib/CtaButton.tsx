import { Link } from 'react-router-dom'
import { Button } from '@ui-sdk/react/button'
import type { ComponentProps } from 'react'
import type { CtaTarget } from './cta'

type Props = { target: CtaTarget } & Omit<ComponentProps<typeof Button>, 'render' | 'children'>

/** A Button that renders a router Link for internal targets and a plain anchor for external ones (mailto:, URLs). */
export function CtaButton({ target, ...rest }: Props) {
  return <Button {...rest} render={target.external ? <a href={target.to} /> : <Link to={target.to} />}>{target.label}</Button>
}
