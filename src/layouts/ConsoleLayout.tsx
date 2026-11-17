import { useEffect, useState, type ReactNode } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@ui-sdk/react/avatar'
import { Button } from '@ui-sdk/react/button'
import { Drawer, DrawerBackdrop, DrawerContent, DrawerTitle, DrawerTrigger } from '@ui-sdk/react/drawer'
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@ui-sdk/react/menu'
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@ui-sdk/react/navigation-menu'
import { Brand } from '../components/Brand'
import { AppToasts } from '../components/AppToasts'
import { useSaas } from '../app/context'
import { useAuth, useCapabilities, useNotifications, useSubscription } from '../data'
import { useT } from '../i18n'

/* 16px stroke icons (inline: ui-sdk ships no icon set). */
const P = {
  instances: 'M3 5h18v6H3zM3 13h18v6H3zM7 8h.01M7 16h.01',
  backups: 'M3 12a9 9 0 1 0 3-6.7M3 4v5h5M12 8v4l3 2',
  usage: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  plan: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.4 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  billing: 'M3 6h18v12H3zM3 10h18M7 15h3',
  team: 'M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M20 20v-1.5a3.5 3.5 0 0 0-2.5-3.3M15.5 5.2a3 3 0 0 1 0 5.6',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  support: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01',
  account: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
  bell: 'M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0',
  menu: 'M4 6h16M4 12h16M4 18h16',
  close: 'M18 6 6 18M6 6l12 12',
  chevron: 'm6 9 6 6 6-6',
} as const
type IconName = keyof typeof P

function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <path d={P[name]} />
    </svg>
  )
}

const ICONS: Record<string, IconName> = {
  '/console': 'instances', '/console/backups': 'backups', '/console/usage': 'usage', '/console/plan': 'plan',
  '/console/billing': 'billing', '/console/team': 'team', '/console/settings': 'settings',
  '/console/support': 'support', '/console/account': 'account',
}
const GROUPS: { id: string; paths: string[] }[] = [
  { id: 'workspace', paths: ['/console', '/console/backups'] },
  { id: 'billing', paths: ['/console/billing', '/console/plan', '/console/usage'] },
  { id: 'team', paths: ['/console/team'] },
  { id: 'account', paths: ['/console/account', '/console/settings'] },
  { id: 'help', paths: ['/console/support'] },
]

/** Up to two initials: first letters of the first two words; an email falls back to its first letter. */
function initialsOf(name: string, email: string) {
  const base = name && !name.includes('@') ? name : ''
  const words = base.trim().split(/\s+/).filter(Boolean)
  const x = words.length ? words.slice(0, 2).map((w) => w[0]).join('') : (email || name || '?')[0]
  return x.toUpperCase()
}

function useIsMobile() {
  const q = '(max-width: 767px)'
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => {
    const mq = window.matchMedia(q)
    const on = () => setM(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return m
}

const groupHeading = { margin: 0, padding: '0 var(--space-3) var(--space-1)', fontSize: 'var(--text-xs)', fontWeight: 'var(--weight-medium)', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--color-muted-fg)' } as const
const linkInner = { display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minHeight: '1.75rem' } as const

export function ConsoleLayout() {
  const { site } = useSaas()
  const t = useT()
  const caps = useCapabilities()
  const L = site.labels
  const { user, logout } = useAuth()
  const { unread } = useNotifications()
  const { subscription } = useSubscription()
  const { pathname } = useLocation()
  const isMobile = useIsMobile()
  const isCurrent = (to: string) => (to === '/console' ? pathname === to : pathname === to || pathname.startsWith(to + '/'))
  const [open, setOpen] = useState(false)
  const blocked = subscription.status === 'past_due' || subscription.status === 'suspended'
  const initials = user ? initialsOf(user.name, user.email) : ''


  const known = new Set(GROUPS.flatMap((g) => g.paths))
  const items = site.consoleNav
  const groups = GROUPS.map((g) => ({ ...g, items: g.paths.map((p) => items.find((n) => n.to === p)).filter((n): n is (typeof items)[number] => !!n) }))
  const extra = items.filter((n) => !known.has(n.to))
  if (extra.length) groups.push({ id: 'more', paths: [], items: extra })
  if (site.adminNav.length && user?.roles?.includes(site.adminRole)) groups.push({ id: 'admin', paths: [], items: site.adminNav })

  const nav: ReactNode = (
    <NavigationMenu aria-label={L.consoleNav} orientation="vertical">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {groups.filter((g) => g.items.length).map((g) => (
          <div key={g.id} role="group" aria-labelledby={`nav-${g.id}`}>
            <p id={`nav-${g.id}`} style={groupHeading}>{g.id === 'more' ? 'More' : g.id === 'admin' ? t('shell.group.admin') : t(`shell.group.${g.id}`)}</p>
            <NavigationMenuList>
              {g.items.map((n) => (
                <NavigationMenuItem key={n.to}>
                  <NavigationMenuLink current={isCurrent(n.to)} render={<Link to={n.to} onClick={() => setOpen(false)} />}>
                    <span style={linkInner}>
                      <Icon name={ICONS[n.to] ?? 'instances'} />
                      <span>{n.label}</span>
                    </span>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </div>
        ))}
      </div>
    </NavigationMenu>
  )

  const bell = !caps.notifications ? null : (
    <Button
      render={<Link to="/console/notifications" />}
      aria-label={unread ? t('shell.unread', { label: L.notifications, n: unread }) : L.notifications}
      style={{ position: 'relative', width: 'var(--control-md)', height: 'var(--control-md)', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name="bell" size={18} />
      {unread ? (
        <span aria-hidden="true" data-testid="bell-badge" style={{ position: 'absolute', top: -4, insetInlineEnd: -4, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 999, background: 'var(--color-destructive)', color: '#fff', fontSize: 10, fontWeight: 600, lineHeight: '16px', textAlign: 'center', boxShadow: '0 0 0 2px var(--color-bg)' }}>{unread > 9 ? '9+' : unread}</span>
      ) : null}
    </Button>
  )

  return (
    <>
      <a href="#main">{L.skip}</a>
      <header data-slot="app-header">
        {isMobile && (
          <Drawer open={open && isMobile} onOpenChange={setOpen} side="left">
            <span data-slot="sidebar-toggle">
              <DrawerTrigger aria-label={L.consoleNav} aria-expanded={open && isMobile} style={{ width: 'var(--control-md)', height: 'var(--control-md)', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="menu" size={18} />
              </DrawerTrigger>
            </span>
            <DrawerBackdrop style={{ background: 'rgb(0 0 0 / .4)' }} />
            <DrawerContent style={{ width: 'min(85vw, 20rem)', height: '100%', overflowY: 'auto', background: 'var(--color-bg)', padding: 'var(--space-4) var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 var(--space-3)' }}>
                <DrawerTitle style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)' }}>{L.consoleNav}</DrawerTitle>
              </div>
              <div data-slot="sidebar" data-open="true" style={{ position: 'static', transform: 'none', visibility: 'visible', width: '100%', border: 0, padding: 0, background: 'transparent', overflow: 'visible' }}>
                {nav}
              </div>
            </DrawerContent>
          </Drawer>
        )}
        <Brand />
        <div data-slot="header-end">
          {bell}
          <Menu>
            <MenuTrigger aria-label={L.accountMenu} style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)', padding: 'var(--space-1)', borderRadius: 999, background: 'transparent', border: 0, cursor: 'pointer', color: 'var(--color-muted-fg)' }}>
              <Avatar style={{ borderRadius: 999 }}><AvatarFallback style={{ borderRadius: 999 }}>{initials || '?'}</AvatarFallback></Avatar>
              <Icon name="chevron" size={14} />
            </MenuTrigger>
            <MenuContent>
              <MenuItem value="account" render={<Link to="/console/account" />}>{t('shell.menu.account')}</MenuItem>
              <MenuItem value="billing" render={<Link to="/console/billing" />}>{t('shell.menu.billing')}</MenuItem>
              <MenuItem value="support" render={<Link to="/console/support" />}>{t('shell.menu.support')}</MenuItem>
              {caps.notifications && <MenuItem value="notifications" render={<Link to="/console/notifications" />}>{t('shell.menu.notifications')}</MenuItem>}
              <MenuItem value="logout" onSelect={() => logout()}>{L.logout}</MenuItem>
            </MenuContent>
          </Menu>
        </div>
      </header>
      {blocked && (
        <div role="alert" data-slot="status-banner">
          {t(`shell.alert.${subscription.status}`)} <Link to="/console/billing">{t('shell.alert.fix')}</Link>
        </div>
      )}
      <div data-slot="console-body">
        {!isMobile && (
          <aside data-slot="sidebar" aria-label={L.consoleNav}>
            {nav}
          </aside>
        )}
        <main id="main"><Outlet /></main>
      </div>
      <AppToasts />
    </>
  )
}
