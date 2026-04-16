'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArsenalIcon } from '@/app/dashboard/arsenal/ArsenalClient'
import { PostActions } from '@/components/posts/PostInteractions'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type ReplicaPublic = {
  id: string
  nombre: string
  sistema: string | null
  mecanismo: string | null
  condicion: string | null
  upgrades: string | null
  foto_url: string | null
  descripcion: string | null
  ciudad: string | null
  estado: string | null
  verificada: boolean
  en_venta: boolean
  serial: string | null
  created_at: string
}

type Owner = {
  id: string
  alias: string | null
  nombre: string | null
  avatar_url: string | null
}

export function ReplicaPublicClient({
  replica,
  owner,
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
}: {
  replica: ReplicaPublic
  owner: Owner
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
}) {
  const ownerName = owner.alias?.trim() || owner.nombre?.trim() || 'Jugador'
  const router = useRouter()

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] pb-28 md:pb-10">
      <div className="mx-auto max-w-[640px] px-4 py-6 md:px-6">

        {/* Header */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => {
              if (window.history.length > 1) {
                router.back()
              } else {
                router.push(`/u/${owner.id}`)
              }
            }}
            className="text-[#999999] hover:text-[#111111]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <h1 style={jost} className="flex-1 text-[18px] font-extrabold uppercase text-[#111111] line-clamp-1">
            {replica.nombre}
          </h1>
          {replica.verificada && (
            <span style={jost} className="bg-[#CC4B37] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
              ✓ Verificada
            </span>
          )}
          {replica.en_venta && (
            <span style={jost} className="bg-[#111111] px-2 py-0.5 text-[9px] font-extrabold uppercase text-white">
              En venta
            </span>
          )}
        </div>

        {/* Foto */}
        <div className="relative aspect-video w-full overflow-hidden border border-[#EEEEEE] bg-[#111111]">
          {replica.foto_url
            ? <img src={replica.foto_url} alt={replica.nombre} className="h-full w-full object-cover" />
            : <div className="flex h-full w-full items-center justify-center"><ArsenalIcon /></div>
          }
        </div>

        {/* Owner */}
        <Link
          href={`/u/${owner.id}`}
          className="mt-4 flex items-center gap-3 border border-[#EEEEEE] p-3 hover:border-[#CCCCCC] transition-colors"
        >
          <div className="w-9 h-9 shrink-0 rounded-full overflow-hidden bg-[#F4F4F4]">
            {owner.avatar_url
              ? <img src={owner.avatar_url} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-[11px] font-bold text-[#CC4B37]" style={jost}>
                  {ownerName[0].toUpperCase()}
                </div>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p style={jost} className="text-[11px] font-extrabold uppercase text-[#999999]">Propietario</p>
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111] truncate">{ownerName}</p>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#CCCCCC] shrink-0">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>

        {/* Info */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          {replica.sistema && (
            <div className="border border-[#EEEEEE] p-3">
              <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Sistema</p>
              <p style={lato} className="mt-1 text-[13px] text-[#111111]">{replica.sistema}</p>
            </div>
          )}
          {replica.mecanismo && (
            <div className="border border-[#EEEEEE] p-3">
              <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Mecanismo</p>
              <p style={lato} className="mt-1 text-[13px] text-[#111111]">{replica.mecanismo}</p>
            </div>
          )}
          {replica.condicion && (
            <div className="border border-[#EEEEEE] p-3">
              <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Condición</p>
              <p style={lato} className="mt-1 text-[13px] text-[#111111] capitalize">{replica.condicion}</p>
            </div>
          )}
          {replica.ciudad && (
            <div className="border border-[#EEEEEE] p-3">
              <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Ubicación</p>
              <p style={lato} className="mt-1 text-[13px] text-[#111111]">
                {replica.ciudad}{replica.estado ? `, ${replica.estado}` : ''}
              </p>
            </div>
          )}
        </div>

        {replica.upgrades && (
          <div className="mt-3 border border-[#EEEEEE] p-3">
            <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Upgrades</p>
            <p style={lato} className="mt-1 text-[13px] leading-relaxed text-[#111111]">{replica.upgrades}</p>
          </div>
        )}

        {replica.descripcion && (
          <div className="mt-3 border border-[#EEEEEE] p-3">
            <p style={jost} className="text-[9px] font-extrabold uppercase text-[#999999]">Descripción</p>
            <p style={lato} className="mt-1 text-[13px] leading-relaxed text-[#111111]">{replica.descripcion}</p>
          </div>
        )}

        {/* Likes y comentarios */}
        <div className="mt-4 border border-[#EEEEEE] px-3">
          <PostActions
            postType="replica"
            postId={replica.id}
            postOwnerId={owner.id}
            currentUserId={currentUserId}
            currentUserAlias={currentUserAlias}
            currentUserAvatar={currentUserAvatar}
            shareUrl={`/replicas/${replica.id}`}
            shareTitle={`${replica.nombre} en AirNation`}
            postHref={`/replicas/${replica.id}`}
          />
        </div>

      </div>
    </main>
  )
}
