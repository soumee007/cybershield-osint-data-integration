import { createHash } from 'node:crypto'

export type ExtractedEntity = { type: string; hash: string; masked: string }

const PATTERNS: { type: string; regex: RegExp; mask: (v: string) => string }[] = [
  {
    type: 'email',
    regex: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
    mask: (v) => `${v[0]}***@${v.split('@')[1]}`,
  },
  {
    type: 'upi_id',
    regex: /\b[A-Za-z0-9._-]{2,}@(?:ok)?(?:upi|ybl|paytm|axl|ibl|sbi|icici|hdfcbank|apl)\b/gi,
    mask: (v) => `${v.slice(0, 2)}***@${v.split('@')[1]}`,
  },
  {
    type: 'card_or_account',
    regex: /\b(?:\d[ -]?){12,18}\d\b/g,
    mask: (v) => `****${v.replace(/\D/g, '').slice(-4)}`,
  },
  {
    type: 'phone',
    regex: /(?:\+\d{1,3}[ -]?)?\b\d{10}\b/g,
    mask: (v) => `******${v.replace(/\D/g, '').slice(-4)}`,
  },
  {
    type: 'crypto_wallet',
    regex: /\b(?:0x[a-fA-F0-9]{40}|(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39})\b/g,
    mask: (v) => `${v.slice(0, 6)}…${v.slice(-4)}`,
  },
  {
    type: 'url',
    regex: /\bhttps?:\/\/[^\s"'<>]+/gi,
    mask: (v) => {
      try {
        return new URL(v).hostname
      } catch {
        return '[url]'
      }
    },
  },
]

export const FINANCIAL_ENTITY_TYPES = new Set(['upi_id', 'card_or_account', 'crypto_wallet'])

export function sha256Hex(input: string | Buffer) {
  return createHash('sha256').update(input).digest('hex')
}

export function redactAndExtract(text: string) {
  const found: ExtractedEntity[] = []
  let redacted = text
  for (const p of PATTERNS) {
    redacted = redacted.replace(p.regex, (match) => {
      const normalized = match.toLowerCase().replace(/[\s-]/g, '')
      found.push({ type: p.type, hash: sha256Hex(`${p.type}:${normalized}`), masked: p.mask(match) })
      return `[${p.type.toUpperCase()}]`
    })
  }
  return { redacted, entities: found }
}
