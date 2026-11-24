'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Banknote, Database, Fingerprint, LayoutDashboard, ShieldAlert } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/records', label: 'Imported records', icon: Database },
  { href: '/threats', label: 'Threat review', icon: ShieldAlert },
  { href: '/financial', label: 'Financial-risk review', icon: Banknote },
  { href: '/evidence', label: 'Evidence & entities', icon: Fingerprint },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="border-b md:border-b-0 md:border-r bg-card/60 md:w-64 md:shrink-0">
      <div className="flex items-center gap-3 px-4 py-4">
        <Image
          src="/images/traceforge-logo.jpg"
          alt="TRACE FORGE logo"
          width={56}
          height={36}
          className="rounded-md object-cover"
        />
        <div className="leading-tight">
          <p className="font-semibold tracking-wide">
            TRACE <span className="text-accent">FORGE</span>
            <span className="text-muted-foreground">.ai</span>
          </p>
          <p className="text-xs text-muted-foreground">Authorized-data OSINT</p>
        </div>
      </div>
      <nav aria-label="Modules" className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:pb-0">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
      <p className="hidden px-4 py-6 text-xs leading-relaxed text-muted-foreground md:block">
        All figures are computed live from records in your Neon database. No scraping, no synthetic metrics.
      </p>
    </aside>
  )
}
