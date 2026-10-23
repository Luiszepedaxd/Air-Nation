import AppShell from '@/components/layout/AppShell'
import { ArenaCartProvider } from '@/components/arena/ArenaCartProvider'
import { ArenaHeader } from './ArenaHeader'

/** Todo /arena/* comparte el carrito y su botón con contador. */
export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ArenaCartProvider>
        <ArenaHeader />
        {children}
      </ArenaCartProvider>
    </AppShell>
  )
}
