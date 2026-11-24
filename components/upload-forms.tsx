'use client'

import { useActionState } from 'react'
import { Loader2 } from 'lucide-react'
import { importDataset, registerEvidence, type ActionState } from '@/app/actions'
import { Button } from '@/components/ui/button'

const field = 'h-9 w-full rounded-md border bg-background px-3 text-sm'

function Result({ state }: { state: ActionState }) {
  if (!state) return null
  return (
    <div
      role="status"
      className={`rounded-md border p-3 text-sm ${state.ok ? 'border-primary/40 bg-primary/10' : 'border-destructive/40 bg-destructive/10'}`}
    >
      <p className="font-medium">{state.message}</p>
      {state.details?.map((d) => (
        <p key={d} className="mt-1 break-all font-mono text-xs text-muted-foreground">
          {d}
        </p>
      ))}
    </div>
  )
}

export function ImportForm() {
  const [state, action, pending] = useActionState(importDataset, null)
  return (
    <form action={action} className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-medium">Import authorized dataset</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs text-muted-foreground">
          Dataset name
          <input name="name" className={field} placeholder="e.g. R4C hackathon sample" maxLength={200} />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          Source name *
          <input name="sourceName" required className={field} placeholder="e.g. R4C organizers" maxLength={200} />
        </label>
      </div>
      <label className="block space-y-1 text-xs text-muted-foreground">
        Authorization basis *
        <input
          name="authorizationBasis"
          required
          className={field}
          placeholder="e.g. Hackathon data-use agreement, 2026"
          maxLength={500}
        />
      </label>
      <label className="block space-y-1 text-xs text-muted-foreground">
        File (CSV, TSV, JSON, JSONL — max 8 MB / 5,000 rows) *
        <input
          type="file"
          name="file"
          required
          accept=".csv,.tsv,.json,.jsonl,.ndjson"
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-foreground"
        />
      </label>
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <input type="checkbox" name="confirmed" required className="mt-0.5" />I confirm this data was lawfully obtained,
        I am authorized to use it, and it was not scraped in breach of platform terms.
      </label>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {pending ? 'Importing…' : 'Import dataset'}
      </Button>
      <Result state={state} />
    </form>
  )
}

export function EvidenceForm() {
  const [state, action, pending] = useActionState(registerEvidence, null)
  return (
    <form action={action} className="space-y-3 rounded-lg border bg-card p-4">
      <h2 className="text-sm font-medium">Hash evidence file</h2>
      <p className="text-xs text-muted-foreground">
        The file is hashed server-side with SHA-256 and only its metadata and hash are logged.
      </p>
      <label className="block space-y-1 text-xs text-muted-foreground">
        Source name *
        <input name="sourceName" required className={field} placeholder="e.g. Case intake upload" maxLength={200} />
      </label>
      <label className="block space-y-1 text-xs text-muted-foreground">
        Note
        <input name="note" className={field} maxLength={500} placeholder="Chain-of-custody note" />
      </label>
      <label className="block space-y-1 text-xs text-muted-foreground">
        File (max 8 MB) *
        <input
          type="file"
          name="file"
          required
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-foreground"
        />
      </label>
      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        {pending ? 'Hashing…' : 'Compute SHA-256'}
      </Button>
      <Result state={state} />
    </form>
  )
}
