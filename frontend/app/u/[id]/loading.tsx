/**
 * Loading boundary for /u/:id.
 *
 * The profile page is `force-dynamic`, so Next.js can only prefetch a dynamic
 * route down to its nearest loading boundary. Without this file a tap on an
 * author name in the feed had nothing to render and the router simply waited
 * for the full server response, which made navigation feel frozen.
 */
export default function PublicProfileLoading() {
  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] text-[#111111]">
      {/* Portada */}
      <div className="h-[120px] w-full animate-pulse bg-[#E9E9E9] md:h-[200px]" />

      <div className="relative mx-auto max-w-[960px] px-4 pb-2 pt-4 md:px-6 md:pt-0">
        {/* Avatar + stats */}
        <div className="mb-3 flex items-center gap-4">
          <div className="relative z-10 -mt-10 h-[80px] w-[80px] shrink-0 animate-pulse rounded-full border-[3px] border-[#EEEEEE] bg-[#E9E9E9] md:border-white" />
          <div className="flex min-w-0 flex-1 items-center gap-6">
            {[0, 1].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <div className="h-4 w-8 animate-pulse rounded-[2px] bg-[#F0F0F0]" />
                <div className="h-3 w-16 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
              </div>
            ))}
          </div>
        </div>

        {/* Nombre + subtítulo */}
        <div className="mb-1 h-5 w-44 animate-pulse rounded-[2px] bg-[#F0F0F0]" />
        <div className="mb-4 h-3 w-32 animate-pulse rounded-[2px] bg-[#F4F4F4]" />

        {/* Botones de acción */}
        <div className="mb-5 flex items-center gap-2">
          <div className="h-9 flex-1 animate-pulse rounded-[6px] bg-[#F0F0F0]" />
          <div className="h-9 w-[42px] shrink-0 animate-pulse rounded-[6px] bg-[#F4F4F4]" />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[#EEEEEE] pb-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-3 w-16 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-4 py-4">
          {[0, 1].map((i) => (
            <div key={i} className="border border-[#EEEEEE] bg-[#FFFFFF] p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#F4F4F4]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-28 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
                  <div className="h-2.5 w-16 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
                </div>
              </div>
              <div className="mb-3 space-y-2">
                <div className="h-3 w-full animate-pulse rounded-[2px] bg-[#F4F4F4]" />
                <div className="h-3 w-3/5 animate-pulse rounded-[2px] bg-[#F4F4F4]" />
              </div>
              <div className="aspect-video w-full animate-pulse rounded-[2px] bg-[#F4F4F4]" />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
