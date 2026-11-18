import { Link } from 'react-router-dom'
import { useSaas } from '../app/context'

export function Brand() {
  const { site, slots } = useSaas()
  const Logo = slots.Logo
  const isUrl = /^(https?:)?\/|^data:/.test(site.logo)
  const style = { flexShrink: 0, whiteSpace: 'nowrap', minHeight: '2rem' } as const
  const inner = Logo ? <Logo /> : isUrl ? <img src={site.logo} alt="" height={24} style={{ display: 'block', height: 24, width: 'auto' }} /> : site.logo
  return site.logoHref
    ? <a href={site.logoHref} data-slot="brand" aria-label={site.name} style={style}>{inner}</a>
    : <Link to="/" data-slot="brand" aria-label={site.name} style={style}>{inner}</Link>
}
