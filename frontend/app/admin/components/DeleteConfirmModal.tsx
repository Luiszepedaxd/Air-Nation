'use client'

type DeleteConfirmModalProps = {
  open: boolean
  resourceLabel: string
  loading?: boolean
  error?: string | null
  onClose: () => void
  onConfirm: () => void
}

export default function DeleteConfirmModal({
  open,
  resourceLabel,
  loading = false,
  error = null,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose()
      }}
    >
      <div
        className="w-full max-w-md border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-6 text-[#111111] shadow-lg"
        style={{ borderRadius: 0 }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-confirm-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="delete-confirm-title"
          className="font-body text-sm leading-relaxed text-[#111111]"
        >
          ¿Eliminar {resourceLabel}? Esta acción no se puede deshacer.
        </p>

        {error ? (
          <p className="mt-4 font-body text-sm text-[#CC4B37]">{error}</p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center justify-center bg-[#CC4B37] px-4 py-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.15em] text-white transition-opacity disabled:opacity-60"
            style={{ borderRadius: 2 }}
          >
            {loading ? '…' : 'ELIMINAR'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="inline-flex items-center justify-center border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-2 font-body text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#444444] transition-colors hover:bg-[#F4F4F4] disabled:opacity-60"
            style={{ borderRadius: 2 }}
          >
            CANCELAR
          </button>
        </div>
      </div>
    </div>
  )
}
