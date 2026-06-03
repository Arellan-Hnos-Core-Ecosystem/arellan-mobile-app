'use client'

import Link from 'next/link'
import type { BottomNavTab } from '@/types'

interface BottomNavProps {
  currentPath: string
}

const navItems: { tab: BottomNavTab; label: string; path: string; icon: (active: boolean) => React.ReactNode }[] = [
  {
    tab: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill="none" stroke={active ? '#1B3A6B' : '#6B7280'} strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" />
      </svg>
    ),
  },
  {
    tab: 'approvals',
    label: 'Aprobaciones',
    path: '/approvals',
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill="none" stroke={active ? '#1B3A6B' : '#6B7280'} strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    tab: 'alerts',
    label: 'Alertas',
    path: '/alerts',
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill="none" stroke={active ? '#1B3A6B' : '#6B7280'} strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    tab: 'profile',
    label: 'Perfil',
    path: '/profile',
    icon: (active: boolean) => (
      <svg className="h-6 w-6" fill="none" stroke={active ? '#1B3A6B' : '#6B7280'} strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
]

export function BottomNav({ currentPath }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-sticky border-t border-neutral-200 bg-white safe-area-bottom">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentPath.startsWith(item.path)
          return (
            <Link
              key={item.tab}
              href={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 min-w-0 flex-1 transition-colors ${
                isActive ? 'text-brand-primary' : 'text-neutral-500'
              }`}
            >
              {item.icon(isActive)}
              <span className={`text-2xs font-medium ${isActive ? 'text-brand-primary' : 'text-neutral-500'}`}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
