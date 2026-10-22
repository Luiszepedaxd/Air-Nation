'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  arenaErrorMessage,
  arenaGet,
  arenaSend,
  arenaUploadFotoAdmin,
  type ArenaAdminField,
  type ArenaLandingMedia,
  type ArenaSettings,
} from '@/lib/arena-api'
import { PhotoUploader } from '@/components/arena/PhotoUploader'

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[14px] text-[#111111] outline-none focus:border-[#CC4B37]'

const SLOTS: ArenaLandingMedia['slot'][] = ['hero', 'banner', 'promo']

const SLOT_LABEL: Record<ArenaLandingMedia['slot'], string> = {
  hero: 'Hero (arriba de /arena)',
  banner: 'Banner',
  promo: 'Promo',
}

type NuevoBloque = {
  slot: ArenaLandingMedia['slot']
  url: string
  titulo: string
  subtitulo: string
  cta_label: string
  cta_href: string
  orden: string
}

const BLOQUE_VACIO: NuevoBloque = {
  slot: 'banner',
  url: '',
  titulo: '',
  subtitulo: '',
  cta_label: '',
  cta_href: '',
  orden: '0',
}

/** Hero, banners y promos de /arena. */
function Bloques() {
  const [media, setMedia] = useState<ArenaLandingMedia[] | null>(null)
  const [nuevo, setNuevo] = useState<NuevoBloque>(BLOQUE_VACIO)
  const [subiendo, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const cargar = useCallback(() => {
    arenaGet<{ media: ArenaLandingMedia[] }>('/admin/landing-media')
      .then((r) => setMedia(r.media))
      .catch((err) => {
        setMedia([])
        setError(arenaErrorMessage(err))
      })
  }, [])

  useEffect(cargar, [cargar])

  const subir = async (file: File | undefined) => {
    if (!file) return
    setError('')
    setSubiendo(true)
    try {
      setNuevo((n) => ({ ...n, url: '' }))
      const url = await arenaUploadFotoAdmin(file)
      setNuevo((n) => ({ ...n, url }))
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setSubiendo(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const crear = async () => {
    setError('')
    setGuardando(true)
    try {
      await arenaSend('POST', '/admin/landing-media', {
        slot: nuevo.slot,
        url: nuevo.url,
        titulo: nuevo.titulo.trim() || null,
        subtitulo: nuevo.subtitulo.trim() || null,
        cta_label: nuevo.cta_label.trim() || null,
        cta_href: nuevo.cta_href.trim() || null,
        orden: Number(nuevo.orden) || 0,
      })
      setNuevo(BLOQUE_VACIO)
      cargar()
    } catch (err) {
      setError(arenaErrorMessage(err))
    } finally {
      setGuardando(false)
    }
  }

  const actualizar = async (m: ArenaLandingMedia, cambios: Partial<ArenaLandingMedia>) => {
    setError('')
    try {
      await arenaSend('PATCH', `/admin/landing-media/${m.id}`, cambios)
      cargar()
    } catch (err) {
      setError(arenaErrorMessage(err))
    }
  }

  const borrar = async (m: ArenaLandingMedia) => {
    setError('')
    if (!window.confirm('¿Borrar este bloque de la landing?')) return
    try {
      await arenaSend('DELETE', `/admin/landing-media/${m.id}`)
      cargar()
    } catch (err) {
      setError(arenaErrorMessage(err))
    }
  }

  return (
    <section className="flex max-w-[760px] flex-col gap-4">
      <div className="flex flex-col gap-3 border border-solid border-[#EEEEEE] p-4">
        <p style={jost} className="text-[12px] text-[#111111]">
          Nuevo bloque
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Dónde va
            <select
              className={inputClass}
              value={nuevo.slot}
              onChange={(e) =>
                setNuevo({ ...nuevo, slot: e.target.value as ArenaLandingMedia['slot'] })
              }
            >
              {SLOTS.map((s) => (
                <option key={s} value={s}>
                  {SLOT_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Orden
            <input
              className={inputClass}
              inputMode="numeric"
              value={nuevo.orden}
              onChange={(e) => setNuevo({ ...nuevo, orden: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Título
            <input
              className={inputClass}
              maxLength={120}
              value={nuevo.titulo}
              onChange={(e) => setNuevo({ ...nuevo, titulo: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Subtítulo
            <input
              className={inputClass}
              maxLength={240}
              value={nuevo.subtitulo}
              onChange={(e) => setNuevo({ ...nuevo, subtitulo: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Texto del botón
            <input
              className={inputClass}
              maxLength={40}
              value={nuevo.cta_label}
              onChange={(e) => setNuevo({ ...nuevo, cta_label: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
            Link (ruta del sitio, ej. /arena)
            <input
              className={inputClass}
              value={nuevo.cta_href}
              onChange={(e) => setNuevo({ ...nuevo, cta_href: e.target.value })}
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="text-[12px]"
            onChange={(e) => void subir(e.target.files?.[0])}
          />
          {subiendo ? <span className="text-[12px] text-[#666666]">Subiendo…</span> : null}
          {nuevo.url ? (
            <img src={nuevo.url} alt="" className="h-16 w-24 object-cover" />
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => void crear()}
          disabled={guardando || !nuevo.url}
          style={jost}
          className="inline-flex min-h-[44px] w-full items-center justify-center bg-[#111111] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50 sm:w-auto"
        >
          {guardando ? 'GUARDANDO…' : 'AGREGAR BLOQUE'}
        </button>
      </div>

      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}

      {media === null ? (
        <p className="text-[13px] text-[#666666]">Cargando bloques…</p>
      ) : media.length === 0 ? (
        <p className="text-[13px] text-[#666666]">
          La landing no tiene bloques: se muestra con su texto por defecto.
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[#EEEEEE] border border-solid border-[#EEEEEE]">
          {media.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 px-3 py-3">
              <img src={m.url} alt="" className="h-16 w-24 shrink-0 object-cover" />
              <span className="min-w-0 flex-1 text-[13px] text-[#111111]">
                {m.titulo || '(sin título)'}
                <span className="block text-[12px] text-[#666666]">
                  {SLOT_LABEL[m.slot]} · orden {m.orden}
                  {m.cta_href ? ` · ${m.cta_href}` : ''}
                </span>
              </span>
              <label className="flex shrink-0 items-center gap-2 text-[12px] text-[#666666]">
                <input
                  type="checkbox"
                  checked={m.activo !== false}
                  onChange={(e) => void actualizar(m, { activo: e.target.checked })}
                />
                Activo
              </label>
              <button
                type="button"
                onClick={() => void actualizar(m, { orden: Math.max(0, m.orden - 1) })}
                aria-label="Subir"
                className="min-h-[36px] shrink-0 border border-solid border-[#EEEEEE] px-2 text-[12px] text-[#666666]"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => void actualizar(m, { orden: m.orden + 1 })}
                aria-label="Bajar"
                className="min-h-[36px] shrink-0 border border-solid border-[#EEEEEE] px-2 text-[12px] text-[#666666]"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => void borrar(m)}
                style={jost}
                className="min-h-[36px] shrink-0 border border-solid border-[#CC4B37] px-3 text-[10px] text-[#CC4B37]"
              >
                BORRAR
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Destacado, orden, resumen y galería de un campo en /arena. */
function CampoLanding({ campo }: { campo: ArenaAdminField }) {
  const settings = campo.arena
  const [destacado, setDestacado] = useState(settings?.destacado ?? false)
  const [orden, setOrden] = useState(String(settings?.orden_landing ?? 0))
  const [resumen, setResumen] = useState(settings?.resumen_landing ?? '')
  const [fotos, setFotos] = useState<string[]>(settings?.fotos_landing ?? [])
  const [estado, setEstado] = useState<'' | 'guardando' | 'ok'>('')
  const [error, setError] = useState('')

  const guardar = async (fotosNuevas = fotos) => {
    setError('')
    setEstado('guardando')
    try {
      const r = await arenaSend<{ settings: ArenaSettings }>(
        'PATCH',
        `/admin/fields/${campo.id}/landing`,
        {
          destacado,
          orden_landing: Number(orden) || 0,
          resumen_landing: resumen.trim() || null,
          fotos_landing: fotosNuevas,
        }
      )
      setFotos(r.settings.fotos_landing ?? fotosNuevas)
      setEstado('ok')
    } catch (err) {
      setEstado('')
      setError(arenaErrorMessage(err))
    }
  }

  return (
    <div className="flex flex-col gap-3 border border-solid border-[#EEEEEE] p-4">
      <p style={jost} className="text-[12px] text-[#111111]">
        {campo.nombre}
        {campo.es_prueba ? <span className="ml-2 text-[#CC4B37]">· prueba</span> : null}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-[13px] text-[#111111]">
          <input
            type="checkbox"
            checked={destacado}
            onChange={(e) => setDestacado(e.target.checked)}
          />
          Destacado: primero en /arena
        </label>
        <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
          Orden
          <input
            className={inputClass}
            inputMode="numeric"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-[12px] text-[#666666]">
        Resumen de la tarjeta (hasta 280 caracteres)
        <textarea
          className={inputClass}
          rows={2}
          maxLength={280}
          value={resumen}
          onChange={(e) => setResumen(e.target.value)}
        />
      </label>
      <div>
        <p className="mb-1 text-[12px] text-[#666666]">Galería de la ficha (hasta 12)</p>
        <PhotoUploader
          fieldId={campo.id}
          urls={fotos}
          onChange={(urls) => {
            setFotos(urls)
            void guardar(urls)
          }}
          max={12}
        />
      </div>
      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}
      {estado === 'ok' ? <p className="text-[13px] text-[#1B5E20]">Guardado.</p> : null}
      <button
        type="button"
        onClick={() => void guardar()}
        disabled={estado === 'guardando'}
        style={jost}
        className="inline-flex min-h-[44px] w-full items-center justify-center bg-[#111111] px-5 text-[11px] tracking-[0.12em] text-[#FFFFFF] disabled:opacity-50 sm:w-auto"
      >
        {estado === 'guardando' ? 'GUARDANDO…' : 'GUARDAR CAMPO'}
      </button>
    </div>
  )
}

export function AdminArenaLandingClient() {
  const [fields, setFields] = useState<ArenaAdminField[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    arenaGet<{ fields: ArenaAdminField[] }>('/admin/fields')
      .then((r) => setFields(r.fields.filter((f) => f.arena?.activo)))
      .catch((err) => {
        setFields([])
        setError(arenaErrorMessage(err))
      })
  }, [])

  return (
    <div className="p-6" style={lato}>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 style={jost} className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl">
          ARENA · Landing
        </h1>
        <Link
          href="/arena"
          target="_blank"
          style={jost}
          className="inline-flex min-h-[44px] items-center justify-center border border-solid border-[#111111] px-4 text-[10px] text-[#111111]"
        >
          VER /ARENA
        </Link>
      </div>

      <p className="mb-5 text-[13px] text-[#666666]">
        Las fotos se guardan en Cloudflare Images. Los cambios se ven al recargar
        /arena.
      </p>

      <Bloques />

      <h2 style={jost} className="mb-3 mt-10 text-[14px] text-[#111111]">
        Campos con ARENA activo
      </h2>
      {error ? <p className="text-[13px] text-[#CC4B37]">{error}</p> : null}
      {fields === null ? (
        <p className="text-[13px] text-[#666666]">Cargando campos…</p>
      ) : fields.length === 0 ? (
        <p className="text-[13px] text-[#666666]">Ningún campo acepta reservas todavía.</p>
      ) : (
        <div className="flex max-w-[760px] flex-col gap-4">
          {fields.map((f) => (
            <CampoLanding key={f.id} campo={f} />
          ))}
        </div>
      )}
    </div>
  )
}
