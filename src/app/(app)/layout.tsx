'use client'

import { type ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Spinner } from '@arellan-hnos-core-ecosystem/ui'
import { BottomNav } from './bottom-nav'
import { useRealtime } from '@/hooks/use-realtime'

function hasSessionCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((c) => c.trim().startsWith('arellan-auth='))
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  useRealtime()

  if (typeof window !== 'undefined' && !hasSessionCookie()) {
    router.replace('/login')
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav currentPath={pathname} />
    </div>
  )
}
