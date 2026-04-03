export default function VideosLoading() {
  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between gap-4">
        <div className="h-10 w-40 animate-pulse bg-[#EEEEEE]" />
        <div className="h-10 w-36 animate-pulse bg-[#EEEEEE]" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="border border-solid border-[#EEEEEE] bg-[#F4F4F4]"
          >
            <div className="aspect-video w-full animate-pulse bg-[#EEEEEE]" />
            <div className="space-y-2 border-t border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4">
              <div className="h-3 w-24 animate-pulse bg-[#F4F4F4]" />
              <div className="h-4 w-full animate-pulse bg-[#F4F4F4]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
