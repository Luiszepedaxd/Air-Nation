import type { Metadata } from 'next'
import GetClient from './GetClient'

export const metadata: Metadata = {
  title: 'Descargar AirNation',
  description: 'Descarga la app oficial de AirNation para Android e iOS.',
  robots: { index: false, follow: false },
}

export default function GetPage() {
  return <GetClient />
}
