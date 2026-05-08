'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CredentialCard, type CredentialUserData } from './CredentialCard'
import { CredentialActions } from './CredentialActions'
import { ActivarCredencialModal } from './ActivarCredencialModal'
import { supabase } from '@/lib/supabase'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

function ConfirmDeleteModal({
  onCancel,
  onConfirm,
  loading,
  error,
}: {
  onCancel: () => void
  onConfirm: () => void
  loading: boolean
  error: string | null
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])
  if (!mounted) return null
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/60 pb-6 pt-6 sm:items-center"
      onClick={loading ? undefined : onCancel}
    >
      <div
        className="relative my-auto w-full max-w-md bg-[#FFFFFF] p-5 shadow-xl sm:rounded-[2px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={jost} className="text-[16px] font-extrabold uppercase text-[#111111]">
          ELIMINAR CREDENCIAL
        </h2>
        <p style={lato} className="mt-3 text-[13px] leading-relaxed text-[#666666]">
          Vas a eliminar tu foto institucional, nombre completo y fecha de nacimiento de tu credencial. Tu perfil de jugador NO se verá afectado.
        </p>
        <p style={lato} className="mt-2 text-[13px] leading-relaxed text-[#666666]">
          Podrás volver a activar tu credencial cuando quieras.
        </p>
        {error && (
          <p style={lato} className="mt-3 text-[12px] text-[#CC4B37]">
            {error}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            style={jost}
            className="flex h-12 flex-1 items-center justify-center rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111] disabled:opacity-50"
          >
            CANCELAR
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={jost}
            className="flex h-12 flex-1 items-center justify-center rounded-[2px] bg-[#CC4B37] text-[11px] font-extrabold uppercase tracking-wide text-[#FFFFFF] disabled:opacity-70"
          >
            {loading ? 'ELIMINANDO...' : 'ELIMINAR'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

export function CredencialClient({ data }: { data: CredentialUserData }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [openActivate, setOpenActivate] = useState(false)
  const [openEdit, setOpenEdit] = useState(false)
  const [openDelete, setOpenDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [localData, setLocalData] = useState<CredentialUserData>(data)

  const tieneFoto = !!localData.foto_credencial_url

  const handleDelete = async () => {
    setDeleteLoading(true)
    setDeleteError(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setDeleteError('Sesión expirada. Vuelve a iniciar sesión.')
        setDeleteLoading(false)
        return
      }
      const res = await fetch(`${API_BASE}/credencial`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setDeleteError(j.error || 'No se pudo eliminar la credencial.')
        setDeleteLoading(false)
        return
      }
      setLocalData((prev) => ({
        ...prev,
        foto_credencial_url: null,
        credencial_nombre_completo: null,
        credencial_fecha_nacimiento: null,
      }))
      setOpenDelete(false)
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <>
      {!tieneFoto ? (
        <div className="mx-auto mt-5 w-full max-w-[360px] border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-5">
          <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">
            FOTO INSTITUCIONAL
          </p>
          <p style={lato} className="mt-2 text-[13px] leading-relaxed text-[#666666]">
            Tu credencial AirNation requiere una foto institucional, nombre completo y fecha de nacimiento. Actívala en menos de un minuto.
          </p>
          <button
            type="button"
            onClick={() => setOpenActivate(true)}
            style={jost}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-[2px] bg-[#CC4B37] text-[12px] font-extrabold uppercase tracking-wide text-[#FFFFFF]"
          >
            ACTIVAR CREDENCIAL
          </button>
        </div>
      ) : (
        <>
          <div className="mx-auto mt-5 w-full max-w-[360px]">
            <CredentialCard ref={cardRef} data={localData} />
          </div>

          <div className="mx-auto mt-4 flex w-full max-w-[360px] gap-3">
            <button
              type="button"
              onClick={() => setOpenEdit(true)}
              style={jost}
              className="flex h-11 flex-1 items-center justify-center rounded-[2px] border border-solid border-[#111111] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#111111]"
            >
              EDITAR
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError(null)
                setOpenDelete(true)
              }}
              style={jost}
              className="flex h-11 flex-1 items-center justify-center rounded-[2px] border border-solid border-[#CC4B37] bg-[#FFFFFF] text-[11px] font-extrabold uppercase tracking-wide text-[#CC4B37]"
            >
              ELIMINAR
            </button>
          </div>

          <CredentialActions cardRef={cardRef} data={localData} />
        </>
      )}

      {openActivate && (
        <ActivarCredencialModal
          userId={localData.id}
          mode="create"
          onClose={() => setOpenActivate(false)}
          onActivated={(payload) => {
            setLocalData((prev) => ({
              ...prev,
              foto_credencial_url: payload.fotoUrl,
              credencial_nombre_completo: payload.nombreCompleto,
              credencial_fecha_nacimiento: payload.fechaNacimiento,
            }))
          }}
        />
      )}

      {openEdit && (
        <ActivarCredencialModal
          userId={localData.id}
          mode="edit"
          initialNombre={localData.credencial_nombre_completo}
          initialFechaNac={localData.credencial_fecha_nacimiento}
          initialFotoUrl={localData.foto_credencial_url}
          onClose={() => setOpenEdit(false)}
          onActivated={(payload) => {
            setLocalData((prev) => ({
              ...prev,
              foto_credencial_url: payload.fotoUrl,
              credencial_nombre_completo: payload.nombreCompleto,
              credencial_fecha_nacimiento: payload.fechaNacimiento,
            }))
          }}
        />
      )}

      {openDelete && (
        <ConfirmDeleteModal
          loading={deleteLoading}
          error={deleteError}
          onCancel={() => {
            if (deleteLoading) return
            setOpenDelete(false)
          }}
          onConfirm={() => void handleDelete()}
        />
      )}
    </>
  )
}
