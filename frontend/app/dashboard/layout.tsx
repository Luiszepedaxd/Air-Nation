import type { ReactNode } from 'react'
import BottomNav from '@/components/dashboard/BottomNav'

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      {children}
      <BottomNav />
    </div>
  )
}
