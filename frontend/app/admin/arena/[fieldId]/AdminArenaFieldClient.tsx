'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/apiFetch'
import {
  arenaErrorMessage,
  arenaGet,
  arenaSend,
  type ArenaMember,
  type ArenaPlan,
  type ArenaSettings,
} from '@/lib/arena-api'
import { BlackoutsEditor } from '@/components/arena/BlackoutsEditor'
import { HorarioEditor } from '@/components/arena/HorarioEditor'
import { ItemsList } from '@/components/arena/ItemsList'
import { SettingsForm } from '@/components/arena/SettingsForm'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]'

type Tab = 'config' | 'duenos' | 'catalogo' | 'horario' | 'reservas'

const TABS: { id: Tab; label: string }[] = [
  { id: 'config', label: 'Configuración' },
  { id: 'duenos', label: 'Dueños' },
  { id: 'catalogo', label: 'Catálogo' },
  { id: 'horario', label: 'Horario y días cerrados' },
  { id: 'reservas', label: 'Reservas' },
]

type FieldHeader = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  status: string
  horarios_json: unknown
}

type UsuarioBuscado = { id: string; nombre: string | null; alias: string | null; email: string | null }

function PlanYComision({
  fieldId,
  settings,
  onSaved,
}: {
  fieldId: string
  settings: ArenaSettings | null
  onSaved: (s: ArenaSettings) => void
}) {
  const [plan, setPlan] = useState<ArenaPlan>(settings?.plan ?? 'free')
  const [comision, setComision] = useState(String(settings?.comision_pct ?? 8))
  const [activo, setActivo] = useState(settings?.activo ?? false)
  const [estado, setEstado] = useState<'' | 'guardando' | 'ok'>('')
  const [error, setError] = useState('')

  const guardar = async () => {
    setError('')
    setEstado('guardando')
    try {
      const r = await arenaSend<{ settings: ArenaSettings }>(
        'PUT',
        `/admin/fields/${fieldId}/activate`,
        { plan, comision_pct: Number(comision), activo }
      )
      setEstado('ok')
      onSaved(r.settings)
    } catch (err) {
      setEstado('')
      setError(arenaErrorMessage(err))
    }
  }

  return (
    <div className="flex max-w-[640px] flex-col gap-3 border border-solid border-[#EEEEEE] p-4" style={lato}>
      <p style={jost} className="text-[12px] text-[#111111]">
        Plan y comisión (solo AirNation)
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Plan
          <select
            className={inputClass}
            value={plan}
            onChange={(e) => setPlan(e.target.value as ArenaPlan)}
          >
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="pro">Pro</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Comisión AirNation (%)
          <input
            className={inputClass}
            inputMode="decimal"
            value={comision}
            onChange={(e) => setComision(e.target.value)}
          />
        </label>
      </div>
      <label className="flex items-center gap-2 text-[13px] text-[#111111]">
        <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
        ARENA activo: el campo acepta reservas en línea
      </label>
      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}
      {estado === 'ok' ? <p className="text-[13px] text-[#1B5E20]">Guardado.</p> : null}
      <button
        type="button"
        onClick={() => void guardar()}
        disabled={estado === 'guardando'}
        style={jost}
        className="inline-flex min-h-[44px] w-full items-center justify-center bg-[#111111] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50 sm:w-auto"
      >
        {estado === 'guardando' ? 'GUARDANDO…' : 'GUARDAR PLAN'}
      </button>
    </div>
  )
}

function Duenos({ fieldId }: { fieldId: string }) {
  const [members, setMembers] = useState<ArenaMember[] | null>(null)
  const [q, setQ] = useState('')
  const [resultados, setResultados] = useState<UsuarioBuscado[]>([])
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState('')

  const cargar = useCallback(() => {
    arenaGet<{ members: ArenaMember[] }>(`/admin/fields/${fieldId}/members`)
      .then((r) => setMembers(r.members))
      .catch((err) => setError(arenaErrorMessage(err)))
  }, [fieldId])

  useEffect(cargar, [cargar])

  const buscar = async () => {
    setError('')
    if (q.trim().length < 2) return setResultados([])
    setBuscando(true)
    try {
      const res = await apiFetch(`/users/search?q=${encodeURIComponent(q.trim())}`)
      const json = (await res.json()) as { users?: UsuarioBuscado[]; error?: string }
      if (!res.ok) throw new Error(json.error || 'No se pudo buscar')
      setResultados(json.users ?? [])
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setBuscando(false)
    }
  }

  const ligar = async (u: UsuarioBuscado) => {
    setError('')
    try {
      await arenaSend('POST', `/admin/fields/${fieldId}/members`, { user_id: u.id })
      setResultados([])
      setQ('')
      cargar()
    } catch (err) {
      setError(arenaErrorMessage(err))
    }
  }

  const desligar = async (userId: string) => {
    setError('')
    try {
      await arenaSend('DELETE', `/admin/fields/${fieldId}/members/${userId}`)
      cargar()
    } catch (err) {
      setError(arenaErrorMessage(err))
    }
  }

  return (
    <div className="flex max-w-[640px] flex-col gap-4" style={lato}>
      <p className="text-[13px] text-[#666666]">
        Al ligar una cuenta le llega un correo con el link a su panel ARENA.
      </p>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-[12px] text-[#666666]">
          Buscar por alias, nombre o email
          <input
            className={inputClass}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void buscar()
            }}
          />
        </label>
        <button
          type="button"
          onClick={() => void buscar()}
          disabled={buscando}
          style={jost}
          className="inline-flex min-h-[44px] items-center justify-center bg-[#111111] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50"
        >
          BUSCAR
        </button>
      </div>

      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}

      {resultados.length > 0 ? (
        <ul className="flex flex-col divide-y divide-[#EEEEEE] border border-solid border-[#EEEEEE]">
          {resultados.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-3 px-3 py-3">
              <span className="min-w-0 text-[13px] text-[#111111]">
                {u.alias || u.nombre || 'Sin nombre'}
                <span className="block text-[12px] text-[#666666]">{u.email}</span>
              </span>
              <button
                type="button"
                onClick={() => void ligar(u)}
                style={jost}
                className="min-h-[36px] shrink-0 bg-[#CC4B37] px-3 text-[10px] text-[#FFFFFF]"
              >
                LIGAR
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div>
        <p style={jost} className="mb-2 text-[12px] text-[#111111]">
          Cuentas ligadas
        </p>
        {members === null ? (
          <p className="text-[13px] text-[#666666]">Cargando…</p>
        ) : members.length === 0 ? (
          <p className="text-[13px] text-[#666666]">Este campo no tiene cuentas ligadas.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-[#EEEEEE] border border-solid border-[#EEEEEE]">
            {members.map((m) => (
              <li key={m.user_id} className="flex items-center justify-between gap-3 px-3 py-3">
                <span className="min-w-0 text-[13px] text-[#111111]">
                  {m.usuario?.alias || m.usuario?.nombre || m.user_id}
                  <span className="block text-[12px] text-[#666666]">
                    {m.usuario?.email} · {m.rol} · {m.status}
                  </span>
                </span>
                {m.status === 'activo' ? (
                  <button
                    type="button"
                    onClick={() => void desligar(m.user_id)}
                    style={jost}
                    className="min-h-[36px] shrink-0 border border-solid border-[#CC4B37] px-3 text-[10px] text-[#CC4B37]"
                  >
                    DESLIGAR
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function AdminArenaFieldClient({ field }: { field: FieldHeader }) {
  const [tab, setTab] = useState<Tab>('config')
  const [settings, setSettings] = useState<ArenaSettings | null>(null)
  const [cargado, setCargado] = useState(false)

  useEffect(() => {
    let vivo = true
    arenaGet<{ settings: ArenaSettings }>(`/owner/fields/${field.id}/settings`)
      .then((r) => vivo && setSettings(r.settings))
      .catch(() => {
        /* 404: el campo todavía no tiene ARENA */
      })
      .finally(() => vivo && setCargado(true))
    return () => {
      vivo = false
    }
  }, [field.id])

  const sinArena = cargado && !settings

  return (
    <div className="mt-4" style={lato}>
      <h1 style={jost} className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl">
        {field.nombre}
      </h1>
      <p className="mt-1 text-[13px] text-[#666666]">
        {field.ciudad ?? 'Sin ciudad'} · /campos/{field.slug}
      </p>

      <div className="mt-5 flex flex-wrap gap-2 border-b border-solid border-[#EEEEEE] pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={jost}
            className={`px-3 py-2 text-[11px] tracking-[0.12em] ${
              tab === t.id
                ? 'bg-[#111111] text-[#FFFFFF]'
                : 'border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'config' ? (
          <div className="flex flex-col gap-6">
            <PlanYComision fieldId={field.id} settings={settings} onSaved={setSettings} />
            {settings ? (
              <SettingsForm fieldId={field.id} settings={settings} onSaved={setSettings} />
            ) : (
              <p className="text-[13px] text-[#666666]">
                {cargado
                  ? 'Activa ARENA en este campo para configurar su política de cancelación y sus datos de liquidación.'
                  : 'Cargando configuración…'}
              </p>
            )}
          </div>
        ) : null}

        {tab === 'duenos' ? <Duenos fieldId={field.id} /> : null}

        {tab === 'catalogo' ? <ItemsList fieldId={field.id} /> : null}

        {tab === 'horario' ? (
          <div className="flex flex-col gap-8">
            <HorarioEditor fieldId={field.id} horariosJson={field.horarios_json} />
            {sinArena ? null : <BlackoutsEditor fieldId={field.id} />}
          </div>
        ) : null}

        {tab === 'reservas' ? (
          <p className="py-8 text-[13px] text-[#666666]">
            Las reservas de todos los campos se ven en{' '}
            <a href="/admin/arena/reservas" className="text-[#CC4B37] underline">
              ARENA · Reservas
            </a>
            .
          </p>
        ) : null}
      </div>
    </div>
  )
}
