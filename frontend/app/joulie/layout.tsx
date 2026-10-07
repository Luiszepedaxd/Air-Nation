import AppShell from '@/components/layout/AppShell'

export default function JoulieLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
