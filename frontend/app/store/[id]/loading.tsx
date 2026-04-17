export default function Loading() {
  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="h-14 border-b border-[#EEEEEE] bg-white"/>
      <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="animate-pulse bg-white border border-[#EEEEEE]" style={{ aspectRatio: '1/1' }}/>
          <div className="flex flex-col gap-4">
            <div className="h-3 w-16 animate-pulse bg-[#EEEEEE]"/>
            <div className="h-8 w-3/4 animate-pulse bg-[#EEEEEE]"/>
            <div className="h-10 w-1/2 animate-pulse bg-[#EEEEEE]"/>
            <div className="h-12 w-full animate-pulse bg-[#EEEEEE]"/>
            <div className="h-12 w-full animate-pulse bg-[#EEEEEE]"/>
          </div>
        </div>
      </div>
    </div>
  )
}
