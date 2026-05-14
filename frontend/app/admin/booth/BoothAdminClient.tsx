'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createBoothEvent,
  toggleBoothEvent,
  deleteBoothEvent,
} from './actions'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}
const lato = { fontFamily: "'Lato', sans-serif" }

type Evento = {
  id: string
  event_name: string
  active: boolean
  created_at: string
  updated_at: string
  count: number
}

export function BoothAdminClient({
  initialEventos,
}: {
  initialEventos: Evento[]
}) {
  const router = useRouter()
  const [eventos, setEventos] = useState<Evento[]>(initialEventos)

  useEffect(() => {
    setEventos(initialEventos)
  }, [initialEventos])
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const activo = eventos.find((e) => e.active) || null

  function sanitize(input: string): string {
    return input
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_-]/g, '')
      .slice(0, 50)
  }

  async function handleCreate() {
    setError(null)
    const clean = sanitize(nuevoNombre)
    if (!clean || clean.length < 2) {
      setError('Nombre inválido. Mínimo 2 caracteres, solo letras/números/_/-.')
      return
    }
    if (eventos.some((e) => e.event_name === clean)) {
      setError('Ya existe un evento con ese nombre.')
      return
    }
    setCreating(true)
    const res = await createBoothEvent(clean)
    setCreating(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setNuevoNombre('')
    router.refresh()
  }

  async function handleToggle(id: string, newActive: boolean) {
    setError(null)
    setBusyId(id)
    const res = await toggleBoothEvent(id, newActive)
    setBusyId(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  async function handleDelete(id: string) {
    setError(null)
    setBusyId(id)
    const res = await deleteBoothEvent(id)
    setBusyId(null)
    setConfirmDelete(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    router.refresh()
  }

  const boothUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/register/booth`
      : 'https://www.airnation.online/register/booth'

  return (
    <div style={lato}>
      <h1
        className="mb-2 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jost}
      >
        MODO BOOTH
      </h1>
      <p className="mb-8 max-w-[640px] text-[14px] leading-relaxed text-[#666666]">
        Crea eventos para registros presenciales. Activa <strong>uno a la vez</strong> el día del evento. Los usuarios registrados desde <code>/register/booth</code> se crean con email pre-confirmado y quedan marcados con el nombre del evento activo.
      </p>

      {/* Estado global */}
      <div
        className={`mb-8 border-2 p-5 ${
          activo
            ? 'border-[#CC4B37] bg-[rgba(204,75,55,0.05)]'
            : 'border-[#EEEEEE] bg-[#FAFAFA]'
        }`}
      >
        {activo ? (
          <>
            <p
              className="text-[10px] tracking-[0.18em] text-[#999999]"
              style={jost}
            >
              EVENTO ACTIVO AHORA
            </p>
            <p
              className="mt-1 text-[24px] text-[#CC4B37]"
              style={jost}
            >
              ● {activo.event_name}
            </p>
            <p className="mt-2 text-[12px] text-[#666666]">
              URL en tablets:{' '}
              <span className="select-all break-all text-[#CC4B37]">
                {boothUrl}
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== 'undefined' && navigator.clipboard) {
                  navigator.clipboard.writeText(boothUrl)
                }
              }}
              className="mt-3 border border-[#111111] bg-white px-3 py-1.5 text-[10px] tracking-[0.12em] text-[#111111] hover:bg-[#111111] hover:text-white"
              style={jost}
            >
              Copiar URL
            </button>
          </>
        ) : (
          <>
            <p
              className="text-[10px] tracking-[0.18em] text-[#999999]"
              style={jost}
            >
              SIN EVENTO ACTIVO
            </p>
            <p className="mt-1 text-[16px] text-[#666666]" style={lato}>
              Ningún evento está recibiendo registros ahora. <code>/register/booth</code> devuelve 404.
            </p>
          </>
        )}
      </div>

      {/* Crear nuevo evento */}
      <div className="mb-8 border border-[#EEEEEE] bg-white p-5">
        <p
          className="mb-3 text-[11px] tracking-[0.14em] text-[#666666]"
          style={jost}
        >
          CREAR NUEVO EVENTO
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(sanitize(e.target.value))}
            placeholder="EJ. BM2_2026"
            maxLength={50}
            className="flex-1 border border-[#E4E4E4] bg-white px-3 py-2.5 text-[13px] text-[#111111] outline-none focus:border-[#111111]"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating || !nuevoNombre.trim()}
            className="bg-[#111111] px-5 py-2.5 text-[11px] tracking-[0.12em] text-white transition-colors hover:bg-[#CC4B37] disabled:opacity-50"
            style={jost}
          >
            {creating ? 'Creando…' : '+ Crear evento'}
          </button>
        </div>
        <p className="mt-2 text-[11px] text-[#999999]">
          Solo letras (mayúsculas auto), números, guiones bajos y guiones. Sin espacios.
        </p>
      </div>

      {error && (
        <div className="mb-4 border border-[#CC4B37] bg-[#FFF5F4] px-4 py-3">
          <p className="text-[12px] text-[#CC4B37]">{error}</p>
        </div>
      )}

      {/* Lista de eventos */}
      <section>
        <h2
          className="mb-4 text-[11px] tracking-[0.14em] text-[#666666]"
          style={jost}
        >
          MIS EVENTOS ({eventos.length})
        </h2>

        {eventos.length === 0 && (
          <div className="border border-dashed border-[#DDDDDD] bg-[#FAFAFA] p-8 text-center">
            <p className="text-[13px] text-[#999999]" style={lato}>
              Aún no tienes eventos. Crea el primero arriba.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {eventos.map((e) => {
            const isBusy = busyId === e.id
            const askingDelete = confirmDelete === e.id
            return (
              <div
                key={e.id}
                className={`border p-5 transition-colors ${
                  e.active
                    ? 'border-[#CC4B37] bg-[rgba(204,75,55,0.04)]'
                    : 'border-[#EEEEEE] bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-[18px] ${e.active ? 'text-[#CC4B37]' : 'text-[#111111]'}`}
                      style={jost}
                    >
                      {e.active ? '● ' : ''}
                      {e.event_name}
                    </p>
                    <p className="mt-1 text-[12px] text-[#666666]">
                      <span className="font-semibold">{e.count}</span>{' '}
                      {e.count === 1 ? 'registro' : 'registros'} · creado{' '}
                      {new Date(e.created_at).toLocaleDateString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle activo */}
                    <button
                      type="button"
                      onClick={() => handleToggle(e.id, !e.active)}
                      disabled={isBusy}
                      className="relative h-7 w-12 transition-colors disabled:opacity-50"
                      style={{
                        background: e.active ? '#CC4B37' : '#CCCCCC',
                        borderRadius: 100,
                      }}
                      aria-pressed={e.active}
                      title={e.active ? 'Desactivar' : 'Activar (apaga los demás)'}
                    >
                      <span
                        className="absolute top-1 block h-5 w-5 bg-white shadow transition-transform"
                        style={{
                          borderRadius: '50%',
                          transform: e.active
                            ? 'translateX(24px)'
                            : 'translateX(4px)',
                        }}
                      />
                    </button>

                    {/* Eliminar */}
                    {!askingDelete ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(e.id)}
                        disabled={isBusy}
                        className="border border-[#DDDDDD] bg-white px-3 py-2 text-[10px] tracking-[0.12em] text-[#666666] hover:border-[#CC4B37] hover:text-[#CC4B37] disabled:opacity-50"
                        style={jost}
                      >
                        Eliminar
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 border border-[#CC4B37] bg-[#FFF5F4] px-3 py-1.5">
                        <span className="text-[10px] text-[#CC4B37]" style={jost}>
                          ¿Seguro?
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
                          disabled={isBusy}
                          className="bg-[#CC4B37] px-2 py-1 text-[10px] text-white disabled:opacity-50"
                          style={jost}
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(null)}
                          className="text-[10px] text-[#666666] hover:text-[#111111]"
                          style={jost}
                        >
                          No
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {e.count > 0 && askingDelete && (
                  <p className="mt-3 text-[11px] text-[#CC4B37]">
                    ⚠ Este evento tiene <strong>{e.count}</strong> registros. Eliminarlo NO borra usuarios; solo borra el evento del listado. Los usuarios mantienen su marca <code>{e.event_name}</code>.
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
