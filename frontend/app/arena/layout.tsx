import AppShell from '@/components/layout/AppShell'
import { ArenaCartProvider } from '@/components/arena/ArenaCartProvider'
import { CarritoDrawer } from '@/components/arena/CarritoDrawer'
import { ArenaHeader } from './ArenaHeader'

/** Todo /arena/* comparte el carrito, su botón con contador y el drawer. */
export default function ArenaLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <ArenaCartProvider>
        {/* Color base oscuro: el texto sin color propio heredaba uno casi blanco. */}
        <div className="text-[#111111]">
          <ArenaHeader />
          {children}
          <CarritoDrawer />
        </div>
      </ArenaCartProvider>
    </AppShell>
  )
}
