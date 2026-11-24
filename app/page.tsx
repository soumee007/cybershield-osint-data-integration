import { getOverview } from '@/lib/queries'
import { BarsChart, DonutChart, TimelineChart } from '@/components/charts'
import { NoDataCta, PageHeader, Stat, StatusBadge } from '@/components/page-ui'

export const dynamic = 'force-dynamic'

export default async function OverviewPage() {
  const data = await getOverview()
  const { totals } = data
  const pct = (n: number) => (totals.records ? `${((n / totals.records) * 100).toFixed(1)}% of records` : undefined)

  return (
    <>
      <PageHeader
        title="Overview"
        description="Live totals and distributions computed from authorized records in PostgreSQL. Percentages are shares of imported records, not model accuracy."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Records" value={totals.records} hint={`${totals.datasets} dataset(s)`} />
        <Stat label="Risk-labeled" value={totals.flagged} hint={pct(totals.flagged)} />
        <Stat label="Financial-risk" value={totals.financial} hint={pct(totals.financial)} tone="accent" />
        <Stat label="Human-reviewed" value={totals.reviewed} hint={pct(totals.reviewed)} />
        <Stat label="Redacted identifiers" value={totals.entities} hint="Pseudonymous SHA-256 refs" />
        <Stat label="Evidence files" value={totals.evidence} hint="Hashed, not stored" />
      </div>

      {totals.records === 0 ? (
        <div className="mt-6">
          <NoDataCta />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <DonutChart title="Category distribution" description="From the dataset's category column" data={data.byCategory} />
            <BarsChart title="Records by platform" data={data.byPlatform} horizontal />
            <DonutChart title="Review status" data={data.byStatus} />
            <TimelineChart title="Records over time" description="Observed date, else import date" data={data.overTime} />
          </div>
          <section className="mt-6">
            <h2 className="mb-3 text-sm font-medium">Latest risk-labeled records</h2>
            {data.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records carry a risk label in the imported data.</p>
            ) : (
              <ul className="divide-y rounded-lg border bg-card">
                {data.recent.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 p-3 text-sm">
                    <span className="font-mono text-xs text-muted-foreground">#{r.id}</span>
                    <span className="line-clamp-1 flex-1">{r.content}</span>
                    <span className="text-xs text-primary">{r.riskLabel}</span>
                    <StatusBadge status={r.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}
