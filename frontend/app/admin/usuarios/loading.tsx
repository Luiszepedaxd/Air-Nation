export default function UsuariosLoading() {
  return (
    <div className="p-6">
      <div className="mb-6 h-10 w-full max-w-[400px] animate-pulse bg-[#F4F4F4]" />
      <div className="flex w-full flex-col gap-1">
        {Array.from({ length: 5 }).map((_, row) => (
          <div key={row} className="flex w-full gap-1">
            {Array.from({ length: 8 }).map((_, cell) => (
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
