export default function PostsLoading() {
  return (
    <div className="bg-[#F4F4F4] p-6">
      <div className="mb-8 flex justify-between gap-4">
        <div className="h-10 w-40 animate-pulse bg-[#EEEEEE]" />
        <div className="h-10 w-32 animate-pulse bg-[#EEEEEE]" />
      </div>
      <div className="flex w-full flex-col gap-1">
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="flex w-full gap-1">
            {Array.from({ length: 5 }).map((_, cell) => (
              <div
                key={cell}
                className="h-[44px] min-w-0 flex-1 animate-pulse bg-[#EEEEEE]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
