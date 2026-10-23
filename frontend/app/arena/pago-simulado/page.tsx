import { PagoSimuladoCarritoClient } from './PagoSimuladoCarritoClient'

export const revalidate = 0
export const metadata = {
  title: 'Pago de prueba — AirNation ARENA',
  robots: { index: false, follow: false },
}

export default function ArenaPagoSimuladoPage({
  searchParams,
}: {
  searchParams: { p?: string; t?: string }
}) {
  return <PagoSimuladoCarritoClient paymentId={searchParams.p ?? ''} token={searchParams.t ?? ''} />
}
