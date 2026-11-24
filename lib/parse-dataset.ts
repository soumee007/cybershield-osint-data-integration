import Papa from 'papaparse'

export type Row = Record<string, unknown>

const FIELD_ALIASES = {
  content: ['content', 'text', 'message', 'body', 'description', 'post', 'caption', 'ocr_text'],
  category: ['category', 'label', 'class', 'threat_type', 'type'],
  platform: ['platform', 'source', 'channel', 'site', 'medium'],
  observedAt: ['observed_at', 'timestamp', 'date', 'created_at', 'time', 'posted_at'],
  externalId: ['id', 'record_id', 'post_id', 'external_id', 'uid'],
  riskLabel: ['risk_label', 'risk', 'severity', 'threat_level', 'priority'],
  financial: ['financial_flag', 'financial', 'is_fraud', 'fraud', 'scam', 'is_scam'],
} as const

export type FieldKey = keyof typeof FIELD_ALIASES
export type ColumnMap = Partial<Record<FieldKey, string>>

export function parseFile(name: string, text: string): Row[] {
  const lower = name.toLowerCase()
  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) {
    const result = Papa.parse<Row>(text, { header: true, skipEmptyLines: true, dynamicTyping: false })
    return result.data
  }
  if (lower.endsWith('.jsonl') || lower.endsWith('.ndjson')) {
    return text
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => JSON.parse(l) as Row)
  }
  if (lower.endsWith('.json')) {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) return parsed
    const firstArray = Object.values(parsed).find(Array.isArray)
    if (firstArray) return firstArray as Row[]
    throw new Error('JSON must be an array of records or contain one.')
  }
  throw new Error('Unsupported file type. Use CSV, TSV, JSON, or JSONL.')
}

export function detectColumns(rows: Row[]): ColumnMap {
  const columns = new Set<string>()
  rows.slice(0, 50).forEach((r) => Object.keys(r).forEach((k) => columns.add(k)))
  const byLower = new Map([...columns].map((c) => [c.toLowerCase().trim(), c]))
  const map: ColumnMap = {}
  for (const [field, aliases] of Object.entries(FIELD_ALIASES) as [FieldKey, readonly string[]][]) {
    const hit = aliases.find((a) => byLower.has(a))
    if (hit) map[field] = byLower.get(hit)
  }
  return map
}

export function str(v: unknown) {
  if (v === null || v === undefined) return ''
  return typeof v === 'string' ? v.trim() : JSON.stringify(v)
}

export function truthy(v: unknown) {
  const s = str(v).toLowerCase()
  return ['1', 'true', 'yes', 'y', 'fraud', 'scam'].includes(s)
}

export function parseDate(v: unknown) {
  const s = str(v)
  if (!s) return null
  const d = /^\d{10,13}$/.test(s) ? new Date(Number(s) * (s.length === 10 ? 1000 : 1)) : new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}
