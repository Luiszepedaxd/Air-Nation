import AppShell from '@/components/layout/AppShell'

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AppShell>{children}</AppShell>
}
