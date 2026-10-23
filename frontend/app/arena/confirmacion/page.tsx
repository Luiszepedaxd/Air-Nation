import { ConfirmacionClient } from './ConfirmacionClient'

export const revalidate = 0
export const metadata = {
  title: 'Reservas confirmadas — AirNation ARENA',
  robots: { index: false, follow: false },
}

export default function ArenaConfirmacionPage({
  searchParams,
}: {
  searchParams: { p?: string; t?: string }
}) {
  return <ConfirmacionClient paymentId={searchParams.p ?? ''} token={searchParams.t ?? ''} />
}
