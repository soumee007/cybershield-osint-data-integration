import { BarsChart, DonutChart } from '@/components/charts'
import { EmptyState, PageHeader } from '@/components/page-ui'
import { EvidenceForm } from '@/components/upload-forms'
import { getEvidenceAndEntities } from '@/lib/queries'

export const dynamic = 'force-dynamic'

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 ** 2).toFixed(1)} MB`
}

export default async function EvidencePage() {
  const data = await getEvidenceAndEntities()
  const sharedChart = data.shared.map((s) => ({ name: `${s.type}:${s.hash.slice(0, 8)}`, value: s.records }))

  return (
    <>
      <PageHeader
        title="Evidence & entities"
        description="SHA-256 integrity hashes of actual evidence files, plus pseudonymous identifiers extracted from records. A repeated identifier is a link worth reviewing, not proof of wrongdoing."
      />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,380px)_1fr]">
        <EvidenceForm />
        <section className="rounded-lg border bg-card p-4">
          <h2 className="mb-3 text-sm font-medium">Evidence log</h2>
          {data.files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No evidence files hashed yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">File</th>
                    <th className="py-2 pr-3">Size</th>
                    <th className="py-2 pr-3">Source</th>
                    <th className="py-2">SHA-256</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.files.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2 pr-3">
                        <p>{f.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {f.mimeType} · {f.createdAt.toISOString().replace('T', ' ').slice(0, 16)} UTC
                        </p>
                      </td>
                      <td className="py-2 pr-3 font-mono text-xs">{formatBytes(f.sizeBytes)}</td>
                      <td className="py-2 pr-3">{f.sourceName}</td>
                      <td className="py-2 break-all font-mono text-[11px] text-muted-foreground">{f.sha256}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <DonutChart title="Identifier types" description="Extracted and redacted at import" data={data.byType} />
        <BarsChart title="Evidence by source" data={data.bySource} color="var(--chart-2)" />
        <BarsChart
          title="Most-linked identifiers"
          description="Distinct records sharing one identifier"
          data={sharedChart}
          horizontal
          color="var(--chart-4)"
        />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium">Cross-record links</h2>
        {data.shared.length === 0 ? (
          <EmptyState title="No identifier appears in more than one record" />
        ) : (
          <div className="overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Masked</th>
                  <th className="p-3">Pseudonymous ref</th>
                  <th className="p-3">Records</th>
                  <th className="p-3">Datasets</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.shared.map((s) => (
                  <tr key={s.hash}>
                    <td className="p-3">{s.type}</td>
                    <td className="p-3 font-mono text-xs">{s.masked}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{s.hash.slice(0, 16)}…</td>
                    <td className="p-3 font-mono">{s.records}</td>
                    <td className="p-3 font-mono">{s.datasets}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  )
}
