export default function ArsenalLoading() {
  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] pb-28 md:pb-10">
      <div className="sticky top-0 z-30 border-b border-[#EEEEEE] bg-[#FFFFFF] px-4 flex gap-6 h-[44px] items-center">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-3 w-20 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
        ))}
      </div>
      <div className="px-4 pt-6 md:px-6 max-w-[1200px] mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-2">
            <div className="h-6 w-28 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
            <div className="h-3 w-36 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
          </div>
          <div className="h-9 w-24 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border border-[#EEEEEE] overflow-hidden">
              <div className="aspect-video w-full animate-pulse bg-[#F4F4F4]" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-3/4 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
                <div className="h-2.5 w-1/2 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
