function SkeletonLine({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-[2px] bg-[#F4F4F4] ${className ?? ''}`}
    />
  )
}

export default function BlogLoading() {
  return (
    <div className="min-h-screen min-w-[375px] bg-[#FFFFFF]">
      <header className="border-b border-solid border-[#EEEEEE] px-6 py-6">
        <div className="h-9 w-40 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
        <SkeletonLine className="mt-3 h-4 w-full max-w-md" />
      </header>

      <div className="flex flex-wrap gap-2 px-6 pt-6">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-[30px] w-[88px] animate-pulse rounded-[2px] border border-solid border-[#EEEEEE] bg-[#F4F4F4]"
          />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[2px] border border-solid border-[#EEEEEE] bg-[#FFFFFF]"
          >
            <div className="aspect-video w-full animate-pulse bg-[#F4F4F4]" />
            <div className="px-3 pb-3 pt-3">
              <SkeletonLine className="h-2.5 w-16" />
              <SkeletonLine className="mt-3 h-4 w-full" />
              <SkeletonLine className="mt-2 h-4 w-11/12" />
              <SkeletonLine className="mt-2 h-3 w-2/3" />
              <SkeletonLine className="mt-3 h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
