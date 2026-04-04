import AlphaBanner from '@/components/ui/AlphaBanner'

export default function EquiposLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <AlphaBanner />
      {children}
    </>
  )
}
