import { useT } from '../../i18n'
import { useSaas } from '../../app/context'
import { PageHeader } from '../../components/primitives/PageHeader'
import { Stack } from '../../components/primitives/Layout'

export function Legal({ kind }: { kind: 'terms' | 'privacy' }) {
  const t = useT(); const { site } = useSaas()
  return (
    <Stack>
      <PageHeader title={t(`legal.${kind}.title`)} />
      <article style={{ maxWidth: '42rem' }}>
        <p role="note" data-testid="legal-template-banner"><strong>{t('legal.template.banner')}</strong></p>
        <p>{t(`legal.${kind}.body`, { email: site.supportEmail })}</p>
        {t(`legal.${kind}.sections`).split('|').map((h) => <section key={h}><h2>{h}</h2><p>[...]</p></section>)}
      </article>
    </Stack>
  )
}
