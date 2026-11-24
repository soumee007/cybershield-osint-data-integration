'use server'

import { revalidatePath } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db'
import { datasets, entities, evidence, records } from '@/lib/db/schema'
import { FINANCIAL_ENTITY_TYPES, redactAndExtract, sha256Hex } from '@/lib/redact'
import { detectColumns, parseDate, parseFile, str, truthy } from '@/lib/parse-dataset'

const MAX_ROWS = 5000
const MAX_BYTES = 8 * 1024 * 1024
const REVIEW_STATUSES = ['unreviewed', 'confirmed', 'dismissed', 'escalated'] as const

export type ActionState = { ok: boolean; message: string; details?: string[] } | null

function text(v: FormDataEntryValue | null, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : ''
}

export async function importDataset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const file = formData.get('file')
    const sourceName = text(formData.get('sourceName'))
    const authorizationBasis = text(formData.get('authorizationBasis'), 500)
    const confirmed = formData.get('confirmed') === 'on'

    if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Choose a dataset file.' }
    if (file.size > MAX_BYTES) return { ok: false, message: 'File exceeds the 8 MB limit.' }
    if (!sourceName || !authorizationBasis)
      return { ok: false, message: 'Source name and authorization basis are required.' }
    if (!confirmed) return { ok: false, message: 'You must confirm you are authorized to use this data.' }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = parseFile(file.name, buffer.toString('utf8'))
    if (rows.length === 0) return { ok: false, message: 'No records found in the file.' }
    if (rows.length > MAX_ROWS)
      return { ok: false, message: `File has ${rows.length} rows. Split it into chunks of ${MAX_ROWS}.` }

    const map = detectColumns(rows)
    const fileSha256 = sha256Hex(buffer)

    const result = await db.transaction(async (tx) => {
      const [ds] = await tx
        .insert(datasets)
        .values({
          name: text(formData.get('name')) || file.name,
          sourceName,
          authorizationBasis,
          fileName: file.name,
          fileSha256,
        })
        .returning({ id: datasets.id })

      let entityCount = 0
      const CHUNK = 500
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK)
        const prepared = chunk.map((row) => {
          const rawContent = map.content
            ? str(row[map.content])
            : Object.entries(row)
                .map(([k, v]) => `${k}: ${str(v)}`)
                .join(' | ')
          const { redacted, entities: found } = redactAndExtract(rawContent.slice(0, 10000))
          const hasFinancialEntity = found.some((e) => FINANCIAL_ENTITY_TYPES.has(e.type))
          return {
            found,
            values: {
              datasetId: ds.id,
              externalId: map.externalId ? str(row[map.externalId]).slice(0, 200) || null : null,
              content: redacted,
              category: (map.category && str(row[map.category]).toLowerCase().slice(0, 80)) || 'uncategorized',
              platform: (map.platform && str(row[map.platform]).toLowerCase().slice(0, 80)) || 'unknown',
              riskLabel: (map.riskLabel && str(row[map.riskLabel]).toLowerCase().slice(0, 40)) || null,
              financialFlag: map.financial ? truthy(row[map.financial]) : hasFinancialEntity,
              observedAt: map.observedAt ? parseDate(row[map.observedAt]) : null,
            },
          }
        })
        const inserted = await tx
          .insert(records)
          .values(prepared.map((p) => p.values))
          .returning({ id: records.id })

        const entityRows = inserted.flatMap((r, idx) =>
          prepared[idx].found.map((e) => ({
            datasetId: ds.id,
            recordId: r.id,
            entityType: e.type,
            valueHash: e.hash,
            masked: e.masked,
          })),
        )
        if (entityRows.length) {
          await tx.insert(entities).values(entityRows)
          entityCount += entityRows.length
        }
      }

      await tx.update(datasets).set({ recordCount: rows.length }).where(eq(datasets.id, ds.id))
      return { entityCount }
    })

    revalidatePath('/', 'layout')
    const mapped = Object.entries(map).map(([field, col]) => `${field} ← "${col}"`)
    return {
      ok: true,
      message: `Imported ${rows.length} records and ${result.entityCount} redacted identifiers.`,
      details: [
        `SHA-256: ${fileSha256}`,
        mapped.length ? `Mapped columns: ${mapped.join(', ')}` : 'No known columns detected; full rows stored as content.',
        ...(map.financial ? [] : ['Financial flag derived from detected payment identifiers (rule-based).']),
      ],
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Import failed.' }
  }
}

export async function registerEvidence(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const file = formData.get('file')
    const sourceName = text(formData.get('sourceName'))
    if (!(file instanceof File) || file.size === 0) return { ok: false, message: 'Choose an evidence file.' }
    if (file.size > MAX_BYTES) return { ok: false, message: 'File exceeds the 8 MB limit.' }
    if (!sourceName) return { ok: false, message: 'Source name is required.' }

    const buffer = Buffer.from(await file.arrayBuffer())
    const sha256 = sha256Hex(buffer)
    await db.insert(evidence).values({
      fileName: file.name.slice(0, 200),
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      sha256,
      sourceName,
      note: text(formData.get('note'), 500) || null,
    })
    revalidatePath('/evidence')
    return { ok: true, message: 'Evidence hashed and logged. The file itself was not stored.', details: [`SHA-256: ${sha256}`] }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Hashing failed.' }
  }
}

export async function updateReview(formData: FormData) {
  const id = Number(formData.get('id'))
  const status = text(formData.get('status'))
  if (!Number.isInteger(id) || !REVIEW_STATUSES.includes(status as (typeof REVIEW_STATUSES)[number])) return
  await db
    .update(records)
    .set({ status, reviewNote: text(formData.get('note'), 500) || null })
    .where(eq(records.id, id))
  revalidatePath('/', 'layout')
}

export async function deleteDataset(formData: FormData) {
  const id = Number(formData.get('id'))
  if (!Number.isInteger(id)) return
  await db.transaction(async (tx) => {
    await tx.delete(entities).where(eq(entities.datasetId, id))
    await tx.delete(records).where(eq(records.datasetId, id))
    await tx.delete(datasets).where(eq(datasets.id, id))
  })
  revalidatePath('/', 'layout')
}
