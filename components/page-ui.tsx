import Link from 'next/link'
import type { RecordRow } from '@/lib/db/schema'
import { updateReview } from '@/app/actions'
import { cn } from '@/lib/utils'

export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-balance text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-1 max-w-3xl text-pretty text-sm text-muted-foreground">{description}</p>
    </header>
  )
}

export function Stat({ label, value, hint, tone }: { label: string; value: number | string; hint?: string; tone?: 'accent' }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn('mt-1 font-mono text-2xl font-semibold', tone === 'accent' ? 'text-accent' : 'text-primary')}>
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-2 text-sm text-muted-foreground">{children}</div>}
    </div>
  )
}

export function NoDataCta() {
  return (
    <EmptyState title="No authorized data imported yet">
      Every chart on this page is computed from database records. Import a dataset on the{' '}
      <Link href="/records" className="text-primary underline underline-offset-4">
        Imported records
      </Link>{' '}
      page to populate it.
    </EmptyState>
  )
}

const STATUS_STYLES: Record<string, string> = {
  unreviewed: 'bg-muted text-muted-foreground',
  confirmed: 'bg-accent/20 text-accent',
  escalated: 'bg-destructive/20 text-destructive',
  dismissed: 'bg-secondary text-secondary-foreground',
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex rounded px-2 py-0.5 text-xs font-medium', STATUS_STYLES[status] ?? STATUS_STYLES.unreviewed)}>
      {status}
    </span>
  )
}

export function ReviewCard({ record }: { record: RecordRow }) {
  return (
    <li className="rounded-lg border bg-card p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-mono">#{record.id}</span>
        <span>{record.platform}</span>
        <span aria-hidden="true">·</span>
        <span>{record.category}</span>
        {record.riskLabel && (
          <span className="rounded bg-primary/15 px-2 py-0.5 text-primary">risk label: {record.riskLabel}</span>
        )}
        {record.financialFlag && <span className="rounded bg-accent/20 px-2 py-0.5 text-accent">financial</span>}
        <span className="ml-auto">
          {(record.observedAt ?? record.createdAt).toISOString().slice(0, 10)}
        </span>
      </div>
      <p className="mt-2 line-clamp-4 text-sm leading-relaxed">{record.content || '(empty)'}</p>
      <form action={updateReview} className="mt-3 flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={record.id} />
        <label className="sr-only" htmlFor={`note-${record.id}`}>
          Reviewer note
        </label>
        <input
          id={`note-${record.id}`}
          name="note"
          placeholder="Reviewer note (optional)"
          maxLength={500}
          className="h-8 min-w-48 flex-1 rounded-md border bg-background px-2 text-sm"
        />
        {(['confirmed', 'escalated', 'dismissed'] as const).map((s) => (
          <button
            key={s}
            name="status"
            value={s}
            className="h-8 rounded-md border px-3 text-xs capitalize hover:bg-muted"
          >
            {s}
          </button>
        ))}
      </form>
    </li>
  )
}
