import { Suspense } from 'react'
import AppShell from '@/components/layout/AppShell'
import { PortalNav } from './PortalNav'

export default function MiCampoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell>
      {/* Suspense porque PortalNav lee el query string (`?tab=`). */}
      <Suspense fallback={null}>
        <PortalNav />
      </Suspense>
      {children}
    </AppShell>
  )
}
