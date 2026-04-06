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
import { updateTeamAdmin } from '@/app/admin/equipos/actions'
import { ImageUploadField } from '@/components/ui/ImageUploadField'

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
  adminReturnPath,
}: {
  /** UUID del equipo — obligatorio para el WHERE del UPDATE */
  teamId: string
  team: EditableTeam
  slug: string
  /** Si está definido, el guardado usa service role y redirige aquí (panel admin). */
  adminReturnPath?: string | null
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
  const [activeUploads, setActiveUploads] = useState(0)

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
    if (activeUploads > 0) {
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

    if (adminReturnPath) {
      const result = await updateTeamAdmin({
        teamId,
        ...payload,
      })
      setSaving(false)
      if ('error' in result) {
        setError(result.error)
        return
      }
      router.push(adminReturnPath)
      return
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
    adminReturnPath,
    router,
    activeUploads,
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
        {adminReturnPath ? (
          <Link
            href={adminReturnPath}
            className="text-[12px] text-[#666666] underline"
            style={lato}
          >
            Volver al listado
          </Link>
        ) : (
          <Link
            href={`/equipos/${encodeURIComponent(slug)}`}
            className="text-[12px] text-[#666666] underline"
            style={lato}
          >
            Ver perfil público
          </Link>
        )}
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
        <ImageUploadField
          label="LOGO DEL EQUIPO"
          currentUrl={logoUrl.trim() || null}
          onUpload={(url) => setLogoUrl(url)}
          onError={(msg) => setError(msg)}
          aspectRatio="square"
          maxSizeMB={2}
          minWidth={200}
          minHeight={200}
          recommendedText="JPG, PNG o WebP · Mínimo 200×200 px · Máximo 2 MB · Recomendado: 500×500 px"
          onUploadStart={() => setActiveUploads((n) => n + 1)}
          onUploadEnd={() => setActiveUploads((n) => Math.max(0, n - 1))}
        />
        <ImageUploadField
          label="FOTO DE PORTADA"
          currentUrl={fotoPortadaUrl.trim() || null}
          onUpload={(url) => setFotoPortadaUrl(url)}
          onError={(msg) => setError(msg)}
          aspectRatio="landscape"
          maxSizeMB={5}
          minWidth={800}
          minHeight={300}
          recommendedText="JPG, PNG o WebP · Mínimo 800×300 px · Máximo 5 MB · Recomendado: 1200×400 px"
          onUploadStart={() => setActiveUploads((n) => n + 1)}
          onUploadEnd={() => setActiveUploads((n) => Math.max(0, n - 1))}
        />
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
          disabled={saving || activeUploads > 0}
          style={jost}
          className="rounded-[2px] bg-[#CC4B37] px-6 py-3 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <Link
          href={adminReturnPath ?? `/equipos/${encodeURIComponent(slug)}`}
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
