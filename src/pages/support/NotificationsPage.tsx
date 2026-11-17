import { Button } from '@ui-sdk/react/button'
import { useNotifications } from '../../data'
import { useT } from '../../i18n'
import { formatWhen as formatDateTime } from '../console/format'
import { Card, CardBody, EmptyState, PageHeader, Skeleton } from '../../components/primitives'

export function NotificationsPage() {
  const t = useT()
  const { notifications, loading, markRead, markAllRead, unread } = useNotifications()
  return (
    <section aria-labelledby="notif-h">
      <PageHeader
        title={<span id="notif-h">{t('notifications.title')}</span>}
        actions={unread > 0 ? <Button data-variant="ghost" onClick={() => void markAllRead()}>{t('notifications.markAll')}</Button> : undefined}
      />
      {loading ? <div role="status"><Skeleton height="1.5rem" /><p>{t('common.loading')}</p></div> : notifications.length === 0 ? <EmptyState title={t('notifications.empty')} description={t('notifications.emptyHelp')} /> : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-3)' }}>
          {notifications.map((n) => (
            <li key={n.id}>
              <Card data-unread={n.read ? undefined : ''} style={n.read ? undefined : { borderInlineStart: '3px solid var(--color-primary, currentColor)' }}>
                <article style={n.read ? { opacity: 0.8 } : undefined}>
                  <CardBody>
                    <h2 style={n.read ? undefined : { fontWeight: 'var(--weight-bold, 700)' }}>{!n.read && <span role="img" aria-label={t('notifications.unread')} style={{ color: 'var(--color-primary, currentColor)' }}>● </span>}{n.title}</h2>
                    <p>{n.body}</p>
                    <time className="muted" dateTime={n.createdAt}>{formatDateTime(n.createdAt)}</time>
                    {!n.read && <div><Button data-variant="ghost" onClick={() => void markRead(n.id)}>{t('notifications.markRead')}</Button></div>}
                  </CardBody>
                </article>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
