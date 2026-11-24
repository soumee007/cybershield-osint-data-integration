import { BarsChart, DonutChart, TimelineChart } from '@/components/charts'
import { NoDataCta, PageHeader, ReviewCard, Stat } from '@/components/page-ui'
import { getQueue } from '@/lib/queries'

export async function ReviewQueue({
  kind,
  title,
  description,
}: {
  kind: 'threat' | 'financial'
  title: string
  description: string
}) {
  const q = await getQueue(kind)
  const pending = q.byStatus.find((s) => s.name === 'unreviewed')?.value ?? 0
  const escalated = q.byStatus.find((s) => s.name === 'escalated')?.value ?? 0

  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="In queue scope" value={q.total} />
        <Stat label="Awaiting review" value={pending} tone="accent" />
        <Stat label="Escalated" value={escalated} />
        <Stat label="Reviewed" value={q.total - pending} />
      </div>
      {q.total === 0 ? (
        <div className="mt-6">
          <NoDataCta />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DonutChart title="By risk label" description="As supplied in the dataset" data={q.byRisk} />
            <BarsChart title="By category" data={q.byCategory} horizontal color="var(--chart-2)" />
            <BarsChart title="Review outcomes" data={q.byStatus} color="var(--chart-3)" />
            <TimelineChart title="Over time" data={q.overTime} />
          </div>
          <section className="mt-6">
            <h2 className="mb-1 text-sm font-medium">Awaiting human review</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              A label or flag is a signal for review, not a finding. Outcomes are recorded only by a reviewer.
            </p>
            {q.rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">Queue is clear.</p>
            ) : (
              <ul className="space-y-3">
                {q.rows.map((r) => (
                  <ReviewCard key={r.id} record={r} />
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}
