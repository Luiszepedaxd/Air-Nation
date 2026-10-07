import type { Metadata } from 'next'
import JouliePageClient from './JouliePageClient'

export const metadata: Metadata = {
  title: 'Joulie',
  robots: { index: false, follow: false },
}

export default function JouliePage() {
  return <JouliePageClient />
}
