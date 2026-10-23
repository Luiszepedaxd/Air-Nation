import AppShell from '@/components/layout/AppShell'
import { ArenaCartProvider } from '@/components/arena/ArenaCartProvider'
import { CarritoDrawer } from '@/components/arena/CarritoDrawer'
import { ArenaHeader } from './ArenaHeader'

/** Todo /arena/* comparte el carrito, su botón con contador y el drawer. */
export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ArenaCartProvider>
        <ArenaHeader />
        {children}
        <CarritoDrawer />
      </ArenaCartProvider>
    </AppShell>
  )
}
