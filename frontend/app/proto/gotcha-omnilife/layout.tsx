import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gotcha Omnilife — ARENA Prototipo',
  description: 'Prototipo de landing comercial para campos de gotcha en AirNation ARENA.',
}

export default function GotchaOmnilifeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
