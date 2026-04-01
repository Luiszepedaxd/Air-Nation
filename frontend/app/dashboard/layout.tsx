import BottomNav from '@/components/dashboard/BottomNav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen min-h-dvh flex flex-col bg-[#F4F4F4]">
      <div className="flex-1 overflow-y-auto pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-0 md:pt-16">
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
