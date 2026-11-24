import Link from 'next/link'
import { deleteDataset } from '@/app/actions'
import { BarsChart, DonutChart, TimelineChart } from '@/components/charts'
import { EmptyState, PageHeader, StatusBadge } from '@/components/page-ui'
import { ImportForm } from '@/components/upload-forms'
import { getDatasets, getRecordCharts, getRecords } from '@/lib/queries'

export const dynamic = 'force-dynamic'

export default async function RecordsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; status?: string; page?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)
  const [list, charts, ds] = await Promise.all([
    getRecords({ q: sp.q?.slice(0, 100), category: sp.category, status: sp.status, page }),
    getRecordCharts(),
    getDatasets(),
  ])
  const pages = Math.max(1, Math.ceil(list.total / list.pageSize))
  const qs = (p: number) => new URLSearchParams({ ...sp, page: String(p) } as Record<string, string>).toString()

  return (
    <>
      <PageHeader
        title="Imported records"
        description="Import authorized datasets, inspect provenance, and search redacted records. Direct identifiers are replaced before storage."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,420px)_1fr]">
        <ImportForm />
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium">Dataset provenance</h2>
          {ds.length === 0 ? (
            <p className="text-sm text-muted-foreground">No datasets imported.</p>
          ) : (
            <ul className="space-y-3">
              {ds.map((d) => (
                <li key={d.id} className="rounded-md border p-3 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.sourceName} · {d.recordCount} records · {d.createdAt.toISOString().slice(0, 10)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">Authorization: {d.authorizationBasis}</p>
                      <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">sha256 {d.fileSha256}</p>
                    </div>
                    <form action={deleteDataset}>
                      <input type="hidden" name="id" value={d.id} />
                      <button className="text-xs text-destructive hover:underline" aria-label={`Delete dataset ${d.name}`}>
                        Delete
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DonutChart title="By category" data={charts.byCategory} />
        <BarsChart title="By source platform" data={charts.byPlatform} horizontal color="var(--chart-3)" />
        <BarsChart title="By review status" data={charts.byStatus} color="var(--chart-2)" />
        <TimelineChart title="Over time" data={charts.overTime} />
      </div>

      <section className="mt-6">
        <form className="mb-3 flex flex-wrap gap-2" role="search">
          <label className="sr-only" htmlFor="q">
            Search content
          </label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q}
            placeholder="Search redacted content…"
            className="h-9 min-w-48 flex-1 rounded-md border bg-background px-3 text-sm"
          />
          <label className="sr-only" htmlFor="category">
            Category
          </label>
          <select id="category" name="category" defaultValue={sp.category ?? ''} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="">All categories</option>
            {list.categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" defaultValue={sp.status ?? ''} className="h-9 rounded-md border bg-background px-2 text-sm">
            <option value="">All statuses</option>
            {['unreviewed', 'confirmed', 'escalated', 'dismissed'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <button className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Filter</button>
        </form>

        {list.rows.length === 0 ? (
          <EmptyState title="No matching records" />
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">ID</th>
                  <th className="p-3">Content (redacted)</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Platform</th>
                  <th className="p-3">Risk</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {list.rows.map((r) => (
                  <tr key={r.id}>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{r.externalId ?? r.id}</td>
                    <td className="max-w-md p-3">
                      <span className="line-clamp-2">{r.content}</span>
                    </td>
                    <td className="p-3">{r.category}</td>
                    <td className="p-3">{r.platform}</td>
                    <td className="p-3">{r.riskLabel ?? '—'}</td>
                    <td className="p-3">
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <nav aria-label="Pagination" className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {list.total} records · page {page} of {pages}
          </span>
          <div className="flex gap-3">
            {page > 1 && <Link href={`?${qs(page - 1)}`} className="text-primary">Previous</Link>}
            {page < pages && <Link href={`?${qs(page + 1)}`} className="text-primary">Next</Link>}
          </div>
        </nav>
      </section>
    </>
  )
}
