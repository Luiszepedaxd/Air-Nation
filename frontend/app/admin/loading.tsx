export default function AdminLoading() {
  return (
    <div>
      <div className="mb-8 h-9 w-52 max-w-full animate-pulse bg-[#1E2226]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="border border-[#1E2226] bg-[#111315] p-4 md:p-5"
          >
            <div className="mb-2 h-9 w-20 animate-pulse bg-[#1E2226]" />
            <div className="h-3 w-28 animate-pulse bg-[#1E2226]" />
          </div>
        ))}
      </div>
      <div className="mt-10 border-t border-[#1E2226] pt-8">
        <div className="mb-4 h-4 w-40 animate-pulse bg-[#1E2226]" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-10 w-36 animate-pulse bg-[#1E2226]"
              style={{ borderRadius: 2 }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
