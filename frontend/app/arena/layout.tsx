import AppShell from '@/components/layout/AppShell'

export default function ArenaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
