import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Sidebar } from '@/components/sidebar'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'TRACE FORGE.ai — Authorized OSINT Analytics',
  description:
    'Real-data OSINT review workspace: import authorized datasets, review threat and financial-risk records, and track evidence integrity with SHA-256.',
  icons: { icon: '/images/traceforge-logo.jpg' },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: '#0f1c3f',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <div className="flex min-h-dvh flex-col md:flex-row">
          <Sidebar />
          <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
