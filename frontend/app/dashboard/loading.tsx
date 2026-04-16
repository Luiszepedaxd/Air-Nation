export default function DashboardLoading() {
  return (
    <main className="min-h-full bg-[#FFFFFF]">
      <div className="w-full px-4 pt-4 pb-2 md:mx-auto md:max-w-[680px] md:px-6">
        <div className="h-5 w-52 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
      </div>
      <div className="w-full px-4 md:mx-auto md:max-w-[680px] md:px-6 pb-10">
        <div className="mt-4 space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 animate-pulse rounded-full bg-[#F4F4F4] shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-3 w-32 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
                  <div className="h-2.5 w-20 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
                </div>
              </div>
              <div className="space-y-2 mb-3">
                <div className="h-3 w-full animate-pulse rounded-[2px] bg-[#F4F4F4]" />
                <div className="h-3 w-4/5 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
              </div>
              <div className="aspect-video w-full animate-pulse rounded-[2px] bg-[#F4F4F4]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
