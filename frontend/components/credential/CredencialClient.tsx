'use client'

import { useRef, useState } from 'react'
import { CredentialCard, type CredentialUserData } from './CredentialCard'
import { CredentialActions } from './CredentialActions'
import { ActivarCredencialModal } from './ActivarCredencialModal'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export function CredencialClient({ data }: { data: CredentialUserData }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [localData, setLocalData] = useState<CredentialUserData>(data)
  const tieneFoto = !!localData.foto_credencial_url

  return (
    <>
      {!tieneFoto ? (
        <div className="mx-auto mt-5 w-full max-w-[360px] border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-4">
          <p style={jost} className="text-[12px] font-extrabold uppercase text-[#111111]">
            FOTO INSTITUCIONAL
          </p>
          <p style={lato} className="mt-1.5 text-[12px] leading-relaxed text-[#666666]">
            Activa tu credencial con foto institucional validada. Queda lista al instante.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            style={jost}
            className="mt-3 flex h-11 w-full items-center justify-center rounded-[2px] bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
          >
            ACTIVAR CREDENCIAL
          </button>
        </div>
      ) : null}

      <div className="mx-auto mt-5 w-full max-w-[360px]">
        <CredentialCard ref={cardRef} data={localData} />
      </div>
      <CredentialActions cardRef={cardRef} data={localData} />

      {open && (
        <ActivarCredencialModal
          userId={localData.id}
          onClose={() => setOpen(false)}
          onActivated={(signedUrl) => {
            setLocalData((prev) => ({ ...prev, foto_credencial_url: signedUrl }))
          }}
        />
      )}
    </>
  )
}
