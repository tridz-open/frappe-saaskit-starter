import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import type { NavItem } from '../config/site'

/** Stable React key for a nav item. */
export const navKey = (n: NavItem) => n.href ?? n.to!

/** External items carry `href`; everything else is an in-app route. */
export const isExternal = (n: NavItem): n is Extract<NavItem, { href: string }> => typeof n.href === 'string'

const rel = (n: Extract<NavItem, { href: string }>) => (n.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})

/** A plain anchor for an external item, or a router link for an internal one (`render` can swap in NavLink etc.). */
export function NavAnchor({ item, onClick, internal }: { item: NavItem; onClick?: () => void; internal?: (to: string) => ReactElement }) {
  if (isExternal(item)) return <a href={item.href} onClick={onClick} {...rel(item)}>{item.label}</a>
  return internal ? internal(item.to) : <Link to={item.to} onClick={onClick}>{item.label}</Link>
}
