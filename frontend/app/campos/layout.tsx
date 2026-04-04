import AppShell from '@/components/layout/AppShell'

export default function CamposLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
