'use client'

export function MessageButton({
  profileUserId,
  currentUserId,
}: {
  profileUserId: string
  currentUserId: string | null
}) {
  if (!currentUserId || currentUserId === profileUserId) return null

  return (
    <button
      type="button"
      aria-label="Enviar mensaje"
      className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#EEEEEE] transition-colors hover:bg-[#F9F9F9]"
      onClick={() => console.log('mensaje a', profileUserId)}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
          stroke="#999999"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
