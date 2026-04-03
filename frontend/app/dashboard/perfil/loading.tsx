export default function PerfilLoading() {
  return (
    <main className="min-h-full min-w-[375px] bg-[#FFFFFF] px-4 pb-10 pt-6 md:px-6">
      <div className="h-7 w-40 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
      <div className="mt-8 flex flex-col items-center border-b border-solid border-[#EEEEEE] pb-8">
        <div className="h-24 w-24 shrink-0 animate-pulse rounded-full bg-[#F4F4F4] md:h-[120px] md:w-[120px]" />
        <div className="mt-4 h-10 w-36 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-0 md:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="border-b border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-3"
          >
            <div className="h-2.5 w-20 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
            <div className="mt-2 h-4 w-3/4 max-w-[200px] animate-pulse rounded-[2px] bg-[#F4F4F4]" />
          </div>
        ))}
      </div>
    </main>
  )
}
