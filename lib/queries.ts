import 'server-only'
import { and, count, desc, eq, ilike, isNotNull, sql, type SQL } from 'drizzle-orm'
import { db } from '@/lib/db'
import { datasets, entities, evidence, records } from '@/lib/db/schema'

export type Slice = { name: string; value: number }

async function groupCount(column: SQL | typeof records.category, where?: SQL): Promise<Slice[]> {
  const rows = await db
    .select({ name: sql<string>`coalesce(${column}::text, 'unlabeled')`, value: count() })
    .from(records)
    .where(where)
    .groupBy(sql`1`)
    .orderBy(desc(count()))
    .limit(12)
  return rows.map((r) => ({ name: r.name, value: Number(r.value) }))
}

async function timeline(where?: SQL): Promise<Slice[]> {
  const rows = await db
    .select({
      name: sql<string>`to_char(date_trunc('day', coalesce(${records.observedAt}, ${records.createdAt})), 'YYYY-MM-DD')`,
      value: count(),
    })
    .from(records)
    .where(where)
    .groupBy(sql`1`)
    .orderBy(sql`1`)
    .limit(365)
  return rows.map((r) => ({ name: r.name, value: Number(r.value) }))
}

export async function getOverview() {
  const [[totals], [ent], [ev], byCategory, byStatus, byPlatform, overTime, recent] = await Promise.all([
    db
      .select({
        records: count(),
        financial: sql<number>`count(*) filter (where ${records.financialFlag})`,
        flagged: sql<number>`count(*) filter (where ${records.riskLabel} is not null)`,
        reviewed: sql<number>`count(*) filter (where ${records.status} <> 'unreviewed')`,
        datasets: sql<number>`count(distinct ${records.datasetId})`,
      })
      .from(records),
    db.select({ value: count() }).from(entities),
    db.select({ value: count() }).from(evidence),
    groupCount(records.category),
    groupCount(sql`${records.status}`),
    groupCount(sql`${records.platform}`),
    timeline(),
    db
      .select()
      .from(records)
      .where(isNotNull(records.riskLabel))
      .orderBy(desc(records.createdAt))
      .limit(6),
  ])
  return {
    totals: {
      records: Number(totals.records),
      financial: Number(totals.financial),
      flagged: Number(totals.flagged),
      reviewed: Number(totals.reviewed),
      datasets: Number(totals.datasets),
      entities: Number(ent.value),
      evidence: Number(ev.value),
    },
    byCategory,
    byStatus,
    byPlatform,
    overTime,
    recent,
  }
}

export async function getRecords(opts: { q?: string; category?: string; status?: string; page: number }) {
  const filters: SQL[] = []
  if (opts.q) filters.push(ilike(records.content, `%${opts.q}%`))
  if (opts.category) filters.push(eq(records.category, opts.category))
  if (opts.status) filters.push(eq(records.status, opts.status))
  const where = filters.length ? and(...filters) : undefined
  const pageSize = 25
  const [rows, [{ total }], categories] = await Promise.all([
    db
      .select()
      .from(records)
      .where(where)
      .orderBy(desc(records.id))
      .limit(pageSize)
      .offset((opts.page - 1) * pageSize),
    db.select({ total: count() }).from(records).where(where),
    db.selectDistinct({ c: records.category }).from(records).orderBy(records.category).limit(100),
  ])
  return { rows, total: Number(total), pageSize, categories: categories.map((c) => c.c) }
}

export async function getRecordCharts() {
  const [byCategory, byPlatform, byStatus, overTime] = await Promise.all([
    groupCount(records.category),
    groupCount(sql`${records.platform}`),
    groupCount(sql`${records.status}`),
    timeline(),
  ])
  return { byCategory, byPlatform, byStatus, overTime }
}

export async function getDatasets() {
  return db.select().from(datasets).orderBy(desc(datasets.createdAt))
}

export async function getQueue(kind: 'threat' | 'financial') {
  const where =
    kind === 'financial' ? eq(records.financialFlag, true) : and(isNotNull(records.riskLabel), eq(records.financialFlag, false))
  const [rows, byRisk, byStatus, byCategory, overTime] = await Promise.all([
    db
      .select()
      .from(records)
      .where(and(where, eq(records.status, 'unreviewed')))
      .orderBy(desc(records.id))
      .limit(20),
    groupCount(sql`${records.riskLabel}`, where),
    groupCount(sql`${records.status}`, where),
    groupCount(records.category, where),
    timeline(where),
  ])
  const total = byStatus.reduce((s, x) => s + x.value, 0)
  return { rows, byRisk, byStatus, byCategory, overTime, total }
}

export async function getEvidenceAndEntities() {
  const [files, byType, shared, bySource] = await Promise.all([
    db.select().from(evidence).orderBy(desc(evidence.createdAt)).limit(50),
    db
      .select({ name: entities.entityType, value: count() })
      .from(entities)
      .groupBy(entities.entityType)
      .orderBy(desc(count())),
    db
      .select({
        hash: entities.valueHash,
        type: entities.entityType,
        masked: sql<string>`min(${entities.masked})`,
        records: sql<number>`count(distinct ${entities.recordId})`,
        datasets: sql<number>`count(distinct ${entities.datasetId})`,
      })
      .from(entities)
      .groupBy(entities.valueHash, entities.entityType)
      .having(sql`count(distinct ${entities.recordId}) > 1`)
      .orderBy(desc(sql`count(distinct ${entities.recordId})`))
      .limit(15),
    db
      .select({ name: evidence.sourceName, value: count() })
      .from(evidence)
      .groupBy(evidence.sourceName)
      .orderBy(desc(count())),
  ])
  return {
    files,
    byType: byType.map((r) => ({ name: r.name, value: Number(r.value) })),
    bySource: bySource.map((r) => ({ name: r.name, value: Number(r.value) })),
    shared: shared.map((s) => ({ ...s, records: Number(s.records), datasets: Number(s.datasets) })),
  }
}
