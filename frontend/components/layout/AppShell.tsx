import BottomNav from '@/components/dashboard/BottomNav'
import AlphaBanner from '@/components/ui/AlphaBanner'

export default function AppShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-[100dvh] flex flex-col bg-[#F4F4F4]">
      <div
        id="dashboard-scroll-root"
        className="flex-1 overflow-y-auto md:pb-0 md:pt-16"
        style={{ paddingBottom: 'max(calc(3.5rem + env(safe-area-inset-bottom)), calc(3.5rem + 12px))' }}
      >
        <AlphaBanner />
        {children}
      </div>
      <BottomNav />
    </div>
  )
}
