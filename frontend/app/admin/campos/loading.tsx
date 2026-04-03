export default function CamposLoading() {
  return (
    <div className="bg-[#FFFFFF] p-6">
      <div className="mb-6 flex flex-col gap-4">
        <div className="h-9 w-48 animate-pulse bg-[#F4F4F4]" />
        <div className="flex flex-wrap gap-3">
          <div className="h-8 w-28 animate-pulse bg-[#F4F4F4]" />
          <div className="h-8 w-28 animate-pulse bg-[#F4F4F4]" />
          <div className="h-8 w-28 animate-pulse bg-[#F4F4F4]" />
        </div>
      </div>
      <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]">
        <div className="flex w-full gap-px bg-[#EEEEEE]">
          {Array.from({ length: 6 }).map((_, cell) => (
            <div
              key={cell}
              className="h-11 min-w-[4rem] flex-1 animate-pulse bg-[#F4F4F4]"
            />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="flex w-full gap-px bg-[#EEEEEE]">
            {Array.from({ length: 6 }).map((_, cell) => (
              <div
                key={cell}
                className="h-14 min-w-[4rem] flex-1 animate-pulse bg-[#F4F4F4]"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
