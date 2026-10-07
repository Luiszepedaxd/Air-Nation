import type { Metadata } from 'next'
import dynamic from 'next/dynamic'

const JouliePageClient = dynamic(() => import('./JouliePageClient'), { ssr: false })

export const metadata: Metadata = {
  title: 'Joulie',
  robots: { index: false, follow: false },
}

export default function JouliePage() {
  return <JouliePageClient />
}
