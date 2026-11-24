import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const datasets = pgTable('tf_datasets', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  sourceName: text('source_name').notNull(),
  authorizationBasis: text('authorization_basis').notNull(),
  fileName: text('file_name').notNull(),
  fileSha256: text('file_sha256').notNull(),
  recordCount: integer('record_count').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const records = pgTable('tf_records', {
  id: serial('id').primaryKey(),
  datasetId: integer('dataset_id').notNull(),
  externalId: text('external_id'),
  content: text('content').notNull().default(''),
  category: text('category').notNull().default('uncategorized'),
  platform: text('platform').notNull().default('unknown'),
  riskLabel: text('risk_label'),
  financialFlag: boolean('financial_flag').notNull().default(false),
  status: text('status').notNull().default('unreviewed'),
  reviewNote: text('review_note'),
  observedAt: timestamp('observed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const entities = pgTable('tf_entities', {
  id: serial('id').primaryKey(),
  datasetId: integer('dataset_id').notNull(),
  recordId: integer('record_id').notNull(),
  entityType: text('entity_type').notNull(),
  valueHash: text('value_hash').notNull(),
  masked: text('masked').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const evidence = pgTable('tf_evidence', {
  id: serial('id').primaryKey(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  sha256: text('sha256').notNull(),
  sourceName: text('source_name').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export type RecordRow = typeof records.$inferSelect
