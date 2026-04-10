'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { PostActions } from '@/components/posts/PostInteractions'

const jost = { fontFamily: "'Jost', sans-serif", fontWeight: 800, textTransform: 'uppercase' as const } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type Paquete = { nombre: string; descripcion: string | null; precio: number; orden: number }

type ListingDetail = {
  id: string
  titulo: string
  descripcion: string | null
  precio: number | null
  precio_original: number | null
  modalidad: 'fijo' | 'desde'
  supercategoria: string | null
  subcategoria: string | null
  sub_subcategoria: string | null
  mecanismo: string | null
  condicion_replica: string | null
  nuevo_usado: string
  fotos_urls: string[]
  ciudad: string | null
  estado: string | null
  status: string
  vendido: boolean
  paquetes: Paquete[]
  replica_id: string | null
  created_at: string
}

type Seller = {
  id: string
  alias: string | null
  nombre: string | null
  avatar_url: string | null
}

export function ListingDetailClient({
  listing,
  seller,
  currentUserId,
  currentUserAlias,
  currentUserAvatar,
  isOwner,
}: {
  listing: ListingDetail
  seller: Seller
  currentUserId: string | null
  currentUserAlias: string | null
  currentUserAvatar: string | null
  isOwner: boolean
}) {
  const router = useRouter()
  const [fotoIndex, setFotoIndex] = useState(0)

  const paquetesOrdenados = useMemo(
    () => [...listing.paquetes].sort((a, b) => a.orden - b.orden),
    [listing.paquetes]
  )

  const [paqueteSelected, setPaqueteSelected] = useState<number | null>(
    listing.modalidad === 'desde' && paquetesOrdenados.length > 0 ? 0 : null
  )
  const [openingChat, setOpeningChat] = useState(false)

  const sellerName = seller.alias?.trim() || seller.nombre?.trim() || 'Vendedor'
  const fotos = listing.fotos_urls.length > 0 ? listing.fotos_urls : []
  const precioMostrar = paqueteSelected !== null
    ? paquetesOrdenados[paqueteSelected]?.precio
    : listing.precio

  const handleContactar = async () => {
    if (!currentUserId) {
      router.push('/login')
      return
    }
    setOpeningChat(true)
    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_a: currentUserId,
        p_user_b: seller.id,
      })
      if (error || convId == null || convId === '') throw error
      router.push(`/dashboard/mensajes/${convId}`)
    } catch {
      router.push('/dashboard/mensajes')
    } finally {
      setOpeningChat(false)
    }
  }

  const handleShare = async () => {
    const url = `https://airnation.online/marketplace/${listing.id}`
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.titulo, url })
      } catch {
        /* cancelado */
      }
    } else {
      try {
        await navigator.clipboard.writeText(url)
      } catch {
        /* noop */
      }
    }
  }

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF] pb-28 md:pb-10">
      <div className="mx-auto max-w-[640px]">

        {/* Fotos */}
        <div className="relative w-full bg-[#111111]" style={{ paddingBottom: '100%' }}>
          <div className="absolute inset-0">
            {fotos.length > 0 ? (
              <img src={fotos[fotoIndex]} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#444" strokeWidth="1.4" strokeLinejoin="round"/>
                  <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="#444" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
              </div>
            )}
            {/* Nav fotos */}
            {fotos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setFotoIndex(i => Math.max(0, i - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-black/40 text-white hover:bg-black/60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setFotoIndex(i => Math.min(fotos.length - 1, i + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center bg-black/40 text-white hover:bg-black/60"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {fotos.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFotoIndex(i)}
                      className={`h-1.5 rounded-full transition-all ${i === fotoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`}
                    />
                  ))}
                </div>
              </>
            )}
            {listing.vendido && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span style={jost} className="bg-[#111111] px-4 py-2 text-[13px] font-extrabold uppercase text-white">
                  Vendido
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-4">
          {/* Precio y título */}
          <div className="mb-4">
            <div className="flex items-center gap-3 flex-wrap">
              {listing.precio_original && listing.precio_original !== listing.precio && (
                <span style={lato} className="text-[14px] text-[#999999] line-through">
                  ${listing.precio_original.toLocaleString('es-MX')}
                </span>
              )}
              <span style={jost} className="text-[24px] font-extrabold text-[#111111]">
                {listing.modalidad === 'desde' && paqueteSelected === null ? 'Desde ' : ''}
                ${precioMostrar?.toLocaleString('es-MX') ?? '—'}
              </span>
              <span style={lato} className={`text-[11px] px-2 py-0.5 border ${
                listing.nuevo_usado === 'nuevo'
                  ? 'border-[#CC4B37] text-[#CC4B37]'
                  : 'border-[#EEEEEE] text-[#999999]'
              }`}>
                {listing.nuevo_usado === 'nuevo' ? 'Nuevo' : 'Usado'}
              </span>
            </div>
            <h1 style={jost} className="mt-2 text-[18px] font-extrabold uppercase leading-snug text-[#111111]">
              {listing.titulo}
            </h1>
            {listing.ciudad && (
              <p style={lato} className="mt-1 text-[13px] text-[#999999]">
                {listing.ciudad}{listing.estado ? `, ${listing.estado}` : ''}
              </p>
            )}
          </div>

          {/* Paquetes */}
          {listing.modalidad === 'desde' && paquetesOrdenados.length > 0 && (
            <div className="mb-4">
              <p style={jost} className="mb-2 text-[10px] font-extrabold uppercase text-[#999999]">
                Elige un paquete
              </p>
              <div className="flex flex-col gap-2">
                {paquetesOrdenados.map((p, i) => (
                  <button
                    key={`${p.nombre}-${p.orden}-${i}`}
                    type="button"
                    onClick={() => setPaqueteSelected(i)}
                    className={`flex items-center justify-between border p-3 text-left transition-colors ${
                      paqueteSelected === i
                        ? 'border-[#CC4B37] bg-[#FFF5F4]'
                        : 'border-[#EEEEEE] bg-[#F4F4F4]'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p style={jost} className={`text-[11px] font-extrabold uppercase ${paqueteSelected === i ? 'text-[#CC4B37]' : 'text-[#111111]'}`}>
                        {p.nombre}
                      </p>
                      {p.descripcion && (
                        <p style={lato} className="mt-0.5 text-[11px] text-[#666666]">{p.descripcion}</p>
                      )}
                    </div>
                    <span style={jost} className={`ml-3 shrink-0 text-[14px] font-extrabold ${paqueteSelected === i ? 'text-[#CC4B37]' : 'text-[#111111]'}`}>
                      ${p.precio.toLocaleString('es-MX')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {listing.supercategoria && (
              <span style={jost} className="border border-[#EEEEEE] px-2 py-1 text-[9px] font-extrabold uppercase text-[#666666]">
                {listing.supercategoria}
              </span>
            )}
            {listing.subcategoria && (
              <span style={lato} className="border border-[#EEEEEE] px-2 py-1 text-[10px] text-[#666666]">
                {listing.subcategoria}
              </span>
            )}
            {listing.sub_subcategoria && (
              <span style={lato} className="border border-[#EEEEEE] px-2 py-1 text-[10px] text-[#666666]">
                {listing.sub_subcategoria}
              </span>
            )}
            {listing.mecanismo && (
              <span style={lato} className="border border-[#EEEEEE] px-2 py-1 text-[10px] text-[#666666]">
                {listing.mecanismo}
              </span>
            )}
            {listing.condicion_replica && (
              <span style={lato} className="border border-[#EEEEEE] px-2 py-1 text-[10px] text-[#666666] capitalize">
                {listing.condicion_replica}
              </span>
            )}
          </div>

          {/* Descripción */}
          {listing.descripcion && (
            <div className="mb-4 border-t border-[#EEEEEE] pt-4">
              <p style={jost} className="mb-2 text-[10px] font-extrabold uppercase text-[#999999]">Descripción</p>
              <p style={lato} className="text-[14px] leading-relaxed text-[#111111] whitespace-pre-wrap">
                {listing.descripcion}
              </p>
            </div>
          )}

          {/* Vendedor */}
          <div className="mb-4 border-t border-[#EEEEEE] pt-4">
            <p style={jost} className="mb-2 text-[10px] font-extrabold uppercase text-[#999999]">Vendedor</p>
            <Link
              href={`/u/${seller.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 shrink-0 rounded-full overflow-hidden bg-[#F4F4F4]">
                {seller.avatar_url
                  ? <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[12px] font-bold text-[#CC4B37]" style={jost}>
                      {sellerName[0].toUpperCase()}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111] truncate">
                  {sellerName}
                </p>
                <p style={lato} className="text-[11px] text-[#999999]">Ver perfil</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#CCCCCC] shrink-0">
                <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>

          {/* Likes y comentarios */}
          <div className="border-t border-[#EEEEEE]">
            <PostActions
              postType="listing"
              postId={listing.id}
              postOwnerId={seller.id}
              currentUserId={currentUserId}
              currentUserAlias={currentUserAlias}
              currentUserAvatar={currentUserAvatar}
              shareUrl={`/marketplace/${listing.id}`}
              shareTitle={listing.titulo}
              postHref={`/marketplace/${listing.id}`}
            />
          </div>
        </div>

        {/* CTA fijo */}
        {!isOwner && !listing.vendido && listing.status === 'activo' && (
          <div
            className="fixed bottom-0 left-0 right-0 border-t border-[#EEEEEE] bg-white px-4 py-3 flex gap-3"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => void handleShare()}
              className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#EEEEEE] text-[#666666] hover:border-[#CCCCCC]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v12M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => void handleContactar()}
              disabled={openingChat}
              style={jost}
              className="flex-1 bg-[#CC4B37] h-12 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50"
            >
              {openingChat ? 'Abriendo chat…' : 'Contactar vendedor'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
