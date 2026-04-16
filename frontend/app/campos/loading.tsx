export default function CamposLoading() {
  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] pb-28">
      <div className="px-4 pt-6 pb-4 border-b border-[#EEEEEE]">
        <div className="h-7 w-36 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
        <div className="mt-3 flex gap-2">
          <div className="h-9 flex-1 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
          <div className="h-9 w-24 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
        </div>
      </div>
      <div className="divide-y divide-[#EEEEEE]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 p-4">
            <div className="h-16 w-16 shrink-0 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
              <div className="h-3 w-1/2 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
              <div className="h-2.5 w-1/3 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
