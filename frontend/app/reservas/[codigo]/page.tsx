import PublicSiteHeader from '@/components/layout/PublicSiteHeader'
import { ReservaClient } from './ReservaClient'

export const revalidate = 0
export const metadata = {
  title: 'Mi reserva — AirNation ARENA',
  robots: { index: false, follow: false },
}

export default function ReservaPage({ params }: { params: { codigo: string } }) {
  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PublicSiteHeader />
      <ReservaClient codigo={params.codigo} />
    </div>
  )
}
