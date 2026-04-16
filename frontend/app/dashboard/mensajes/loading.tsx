export default function MensajesLoading() {
  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF]">
      <div className="border-b border-[#EEEEEE] px-4 py-4">
        <div className="h-6 w-24 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
      </div>
      <div className="divide-y divide-[#EEEEEE]">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#F4F4F4]" />
            <div className="flex-1 space-y-2 min-w-0">
              <div className="h-3 w-28 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
              <div className="h-2.5 w-48 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
            </div>
            <div className="h-2.5 w-8 shrink-0 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
          </div>
        ))}
      </div>
    </main>
  )
}
