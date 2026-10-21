import { notFound } from 'next/navigation'
import { PagoSimuladoClient } from './PagoSimuladoClient'

export const revalidate = 0
export const metadata = {
  title: 'Pago de prueba — AirNation ARENA',
  robots: { index: false, follow: false },
}

export default function PagoSimuladoPage({ params }: { params: { codigo: string } }) {
  // Pantalla de prueba: nunca en producción.
  if (process.env.NODE_ENV === 'production') notFound()
  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      <PagoSimuladoClient codigo={params.codigo} />
    </div>
  )
}
