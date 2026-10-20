export default function DashboardLoading() {
  return (
    <main className="min-h-full bg-[#FFFFFF]">
      <div className="w-full px-4 pt-4 pb-2 md:mx-auto md:max-w-[680px] md:px-6">
        <div className="h-5 w-52 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
      </div>
      <div className="w-full px-4 md:mx-auto md:max-w-[680px] md:px-6 pb-10">
        <div className="mt-4 flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="-mx-4 w-[calc(100%+2rem)] border-b border-[#EEEEEE] bg-[#FFFFFF] md:-mx-6 md:w-[calc(100%+3rem)]">
              <div className="mb-3 flex items-center gap-3 px-4 pt-3">
                <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-[#F4F4F4]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
                  <div className="h-2.5 w-20 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
                </div>
              </div>
              <div className="mx-4 mb-3 h-3 w-2/3 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
              <div className="aspect-[4/5] w-full animate-pulse bg-[#F4F4F4]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
