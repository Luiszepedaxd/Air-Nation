'use client'

import {
  useCallback,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  'https://placeholder.supabase.co'
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder'

const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

const jost = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
} as const

const lato = { fontFamily: "'Lato', sans-serif" } as const

export type EditableTeam = {
  id: string
  nombre: string
  slug: string
  ciudad: string | null
  descripcion: string | null
  historia: string | null
  foto_portada_url: string | null
  logo_url: string | null
  instagram: string | null
  facebook: string | null
  whatsapp_url: string | null
}

export function EditTeamClient({
  teamId,
  team,
  slug,
}: {
  /** UUID del equipo — obligatorio para el WHERE del UPDATE */
  teamId: string
  team: EditableTeam
  slug: string
}) {
  const router = useRouter()
  const [nombre, setNombre] = useState(team.nombre)
  const [ciudad, setCiudad] = useState(team.ciudad ?? '')
  const [descripcion, setDescripcion] = useState(team.descripcion ?? '')
  const [historia, setHistoria] = useState(team.historia ?? '')
  const [instagram, setInstagram] = useState(team.instagram ?? '')
  const [facebook, setFacebook] = useState(team.facebook ?? '')
  const [whatsappUrl, setWhatsappUrl] = useState(team.whatsapp_url ?? '')
  const [fotoPortadaUrl, setFotoPortadaUrl] = useState(
    team.foto_portada_url ?? ''
  )
  const [logoUrl, setLogoUrl] = useState(team.logo_url ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = useCallback(async () => {
    const n = nombre.trim()
    if (n.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres.')
      return
    }
    if (!teamId) {
      setError('Error interno: falta el identificador del equipo.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      nombre: n,
      ciudad: ciudad.trim() || null,
      descripcion: descripcion.trim() || null,
      historia: historia.trim() || null,
      instagram: instagram.trim() || null,
      facebook: facebook.trim() || null,
      whatsapp_url: whatsappUrl.trim() || null,
      foto_portada_url: fotoPortadaUrl.trim() || null,
      logo_url: logoUrl.trim() || null,
    }

    const { error: upErr } = await supabase
      .from('teams')
      .update(payload)
      .eq('id', teamId)

    setSaving(false)

    if (upErr) {
      console.error('[EditTeamClient] teams UPDATE error:', upErr)
      setError(upErr.message)
      return
    }

    router.refresh()
    router.push(`/equipos/${encodeURIComponent(slug)}`)
  }, [
    nombre,
    ciudad,
    descripcion,
    historia,
    instagram,
    facebook,
    whatsappUrl,
    fotoPortadaUrl,
    logoUrl,
    teamId,
    slug,
    router,
  ])

  const inputClass =
    'w-full rounded-[2px] border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-3 text-sm text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none'

  return (
    <div className="mx-auto max-w-[640px] px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1
          style={jost}
          className="text-[20px] font-extrabold uppercase leading-tight text-[#111111] md:text-[24px]"
        >
          Editar equipo
        </h1>
        <Link
          href={`/equipos/${encodeURIComponent(slug)}`}
          className="text-[12px] text-[#666666] underline"
          style={lato}
        >
          Ver perfil público
        </Link>
      </div>

      <div className="flex flex-col gap-5">
        <Field label="Nombre" style={jost}>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={inputClass}
            maxLength={200}
          />
        </Field>
        <Field label="Ciudad" style={jost}>
          <input
            type="text"
            value={ciudad}
            onChange={(e) => setCiudad(e.target.value)}
            className={inputClass}
            maxLength={120}
          />
        </Field>
        <Field label="Descripción" style={jost}>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </Field>
        <Field label="Historia" style={jost}>
          <textarea
            value={historia}
            onChange={(e) => setHistoria(e.target.value)}
            rows={4}
            className={`${inputClass} resize-y`}
          />
        </Field>
        <Field label="URL foto portada" style={jost}>
          <input
            type="url"
            value={fotoPortadaUrl}
            onChange={(e) => setFotoPortadaUrl(e.target.value)}
            className={inputClass}
            placeholder="https://"
          />
        </Field>
        <Field label="URL logo" style={jost}>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            className={inputClass}
            placeholder="https://"
          />
        </Field>
        <Field label="Instagram" style={jost}>
          <input
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className={inputClass}
            placeholder="@usuario o URL"
          />
        </Field>
        <Field label="Facebook" style={jost}>
          <input
            type="text"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="WhatsApp" style={jost}>
          <input
            type="text"
            value={whatsappUrl}
            onChange={(e) => setWhatsappUrl(e.target.value)}
            className={inputClass}
            placeholder="Número o enlace wa.me"
          />
        </Field>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          style={jost}
          className="rounded-[2px] bg-[#CC4B37] px-6 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link
          href={`/equipos/${encodeURIComponent(slug)}`}
          style={jost}
          className="inline-flex items-center rounded-[2px] border border-[#EEEEEE] px-6 py-3 text-[12px] font-extrabold uppercase text-[#666666]"
        >
          Cancelar
        </Link>
      </div>

      {error ? (
        <p className="mt-4 text-sm text-[#CC4B37]" style={lato} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function Field({
  label,
  children,
  style,
}: {
  label: string
  children: ReactNode
  style: CSSProperties
}) {
  return (
    <div>
      <label
        className="mb-2 block text-[11px] font-bold uppercase tracking-[0.08em] text-[#999999]"
        style={style}
      >
        {label}
      </label>
      {children}
    </div>
  )
}
