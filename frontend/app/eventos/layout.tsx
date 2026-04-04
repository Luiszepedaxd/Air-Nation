import AppShell from '@/components/layout/AppShell'

export default function EventosLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
