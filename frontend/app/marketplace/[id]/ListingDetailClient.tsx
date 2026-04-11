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
    if (!currentUserId) { router.push('/login'); return }
    setOpeningChat(true)
    try {
      const { data: convId, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_a: currentUserId,
        p_user_b: seller.id,
      })
      if (error || convId == null) throw error

      // Enviar mensaje automático con referencia al listing
      const precioTexto = listing.precio
        ? `$${listing.precio.toLocaleString('es-MX')}`
        : ''
      const mensajeAuto = `[LISTING:${listing.id}] ${listing.titulo}${precioTexto ? ` - ${precioTexto}` : ''}\n\nHola, me interesa tu publicacion. Sigue disponible?`

      await supabase.from('messages').insert({
        conversation_id: convId,
        sender_id: currentUserId,
        content: mensajeAuto,
      })

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
      try { await navigator.share({ title: listing.titulo, url }) } catch { /* cancelado */ }
    } else {
      try { await navigator.clipboard.writeText(url) } catch { /* noop */ }
    }
  }

  const showCTA = !isOwner && !listing.vendido && listing.status === 'activo'

  return (
    <main className="min-h-screen min-w-[375px] bg-[#FFFFFF]" style={{ paddingBottom: showCTA ? 'calc(80px + env(safe-area-inset-bottom))' : '40px' }}>
      <div className="mx-auto max-w-[640px] overflow-hidden">

        {/* Header: volver + título + compartir */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#EEEEEE]">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-[#666666] hover:text-[#111111]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12l7 7M5 12l7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <p style={jost} className="flex-1 text-[13px] font-extrabold uppercase text-[#111111] line-clamp-1">
            {listing.titulo}
          </p>
          <button
            type="button"
            onClick={() => void handleShare()}
            className="text-[#666666] hover:text-[#111111]"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M12 3v12M8 7l4-4 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Foto principal — full width sin padding */}
        <div className="px-4 pt-2 pb-0 bg-[#FFFFFF]">
        <div className="relative w-full overflow-hidden rounded-[8px] bg-[#111111]" style={{ aspectRatio: '4/3' }}>
          {fotos.length > 0 ? (
            <img
              src={fotos[fotoIndex]}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="#333" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="#333" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </div>
          )}

          {listing.vendido && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span style={jost} className="bg-[#111111] px-6 py-2 text-[14px] font-extrabold uppercase text-white tracking-widest">
                Vendido
              </span>
            </div>
          )}

          {/* Flechas navegación */}
          {fotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setFotoIndex(i => Math.max(0, i - 1))}
                disabled={fotoIndex === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-black/50 text-white disabled:opacity-30"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setFotoIndex(i => Math.min(fotos.length - 1, i + 1))}
                disabled={fotoIndex === fotos.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center bg-black/50 text-white disabled:opacity-30"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </>
          )}

          {/* Contador fotos */}
          {fotos.length > 1 && (
            <div className="absolute bottom-3 right-3 bg-black/60 px-2 py-1">
              <span style={lato} className="text-[11px] font-semibold text-white">
                {fotoIndex + 1} / {fotos.length}
              </span>
            </div>
          )}
        </div>
        </div>

        {/* Thumbnails */}
        {fotos.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto px-4 py-2 bg-[#FFFFFF]">
            {fotos.map((url, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setFotoIndex(i)}
                className={`shrink-0 h-14 w-14 overflow-hidden border-2 transition-colors ${
                  i === fotoIndex ? 'border-[#CC4B37]' : 'border-transparent'
                }`}
              >
                <img src={url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Contenido */}
        <div className="px-4 pt-4 pb-2">

          {/* Precio prominente */}
          <div className="mb-1 flex items-baseline gap-3 flex-wrap">
            <span style={jost} className="text-[28px] font-extrabold leading-none text-[#111111]">
              {listing.modalidad === 'desde' && paqueteSelected === null ? 'Desde ' : ''}
              ${precioMostrar?.toLocaleString('es-MX') ?? '—'}
            </span>
            {listing.precio_original && listing.precio_original !== listing.precio && (
              <span style={lato} className="text-[15px] text-[#999999] line-through">
                ${listing.precio_original.toLocaleString('es-MX')}
              </span>
            )}
          </div>

          {/* Estado nuevo/usado + disponibilidad */}
          <div className="mb-2 flex items-center gap-2">
            <span style={lato} className="text-[13px] text-[#444444]">
              {listing.nuevo_usado === 'nuevo' ? 'Nuevo' : 'Usado'} · {listing.vendido ? 'Vendido' : listing.status === 'pausado' ? 'Pausado' : 'Disponible'}
            </span>
          </div>

          {/* Título */}
          <h1 style={lato} className="text-[17px] font-bold leading-snug text-[#111111] mb-1">
            {listing.titulo}
          </h1>

          {/* Ubicación */}
          {listing.ciudad && (
            <p style={lato} className="text-[13px] text-[#666666] mb-3">
              {listing.ciudad}{listing.estado ? `, ${listing.estado}` : ''}
            </p>
          )}

          {/* Paquetes */}
          {listing.modalidad === 'desde' && paquetesOrdenados.length > 0 && (
            <div className="mb-4 border-t border-[#EEEEEE] pt-3">
              <p style={jost} className="mb-2 text-[10px] font-extrabold uppercase text-[#999999]">
                Elige un paquete
              </p>
              <div className="flex flex-col gap-2">
                {paquetesOrdenados.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPaqueteSelected(i)}
                    className={`flex items-center justify-between border p-3 text-left transition-colors ${
                      paqueteSelected === i
                        ? 'border-[#CC4B37] bg-[#FFF5F4]'
                        : 'border-[#EEEEEE] bg-[#FFFFFF]'
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
                    <span style={jost} className={`ml-3 shrink-0 text-[15px] font-extrabold ${paqueteSelected === i ? 'text-[#CC4B37]' : 'text-[#111111]'}`}>
                      ${p.precio.toLocaleString('es-MX')}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          {listing.descripcion && (
            <div className="mb-4 border-t border-[#EEEEEE] pt-4">
              <p style={jost} className="mb-2 text-[11px] font-extrabold uppercase text-[#999999]">Descripción</p>
              <p style={lato} className="text-[14px] leading-relaxed text-[#111111] whitespace-pre-wrap">
                {listing.descripcion}
              </p>
            </div>
          )}

          {/* Detalles */}
          <div className="mb-4 border-t border-[#EEEEEE] pt-4">
            <p style={jost} className="mb-3 text-[11px] font-extrabold uppercase text-[#999999]">Detalles</p>
            <div className="flex flex-col gap-0">
              {listing.supercategoria && (
                <div className="flex items-center justify-between py-2 border-b border-[#F4F4F4]">
                  <span style={lato} className="text-[13px] text-[#666666]">Categoría</span>
                  <span style={lato} className="text-[13px] text-[#111111] capitalize">{listing.supercategoria}</span>
                </div>
              )}
              {listing.subcategoria && (
                <div className="flex items-center justify-between py-2 border-b border-[#F4F4F4]">
                  <span style={lato} className="text-[13px] text-[#666666]">Tipo</span>
                  <span style={lato} className="text-[13px] text-[#111111]">{listing.subcategoria}</span>
                </div>
              )}
              {listing.sub_subcategoria && (
                <div className="flex items-center justify-between py-2 border-b border-[#F4F4F4]">
                  <span style={lato} className="text-[13px] text-[#666666]">Subtipo</span>
                  <span style={lato} className="text-[13px] text-[#111111]">{listing.sub_subcategoria}</span>
                </div>
              )}
              {listing.mecanismo && (
                <div className="flex items-center justify-between py-2 border-b border-[#F4F4F4]">
                  <span style={lato} className="text-[13px] text-[#666666]">Mecanismo</span>
                  <span style={lato} className="text-[13px] text-[#111111]">{listing.mecanismo}</span>
                </div>
              )}
              {listing.condicion_replica && (
                <div className="flex items-center justify-between py-2 border-b border-[#F4F4F4]">
                  <span style={lato} className="text-[13px] text-[#666666]">Condición</span>
                  <span style={lato} className="text-[13px] text-[#111111] capitalize">{listing.condicion_replica}</span>
                </div>
              )}
              <div className="flex items-center justify-between py-2">
                <span style={lato} className="text-[13px] text-[#666666]">Estado</span>
                <span style={lato} className="text-[13px] text-[#111111] capitalize">{listing.nuevo_usado}</span>
              </div>
            </div>
          </div>

          {/* Vendedor */}
          <div className="mb-4 border-t border-[#EEEEEE] pt-4">
            <p style={jost} className="mb-3 text-[11px] font-extrabold uppercase text-[#999999]">Vendedor</p>
            <Link
              href={`/u/${seller.id}`}
              className="flex items-center gap-3 p-3 border border-[#EEEEEE] hover:border-[#CCCCCC] transition-colors"
            >
              <div className="w-11 h-11 shrink-0 rounded-full overflow-hidden bg-[#F4F4F4]">
                {seller.avatar_url
                  ? <img src={seller.avatar_url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-[13px] font-bold text-[#CC4B37]" style={jost}>
                      {sellerName[0].toUpperCase()}
                    </div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111] truncate">
                  {sellerName}
                </p>
                <p style={lato} className="text-[11px] text-[#999999]">Ver perfil completo</p>
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

        {/* CTA fijo en bottom */}
        {showCTA && (
          <div
            className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#EEEEEE] bg-white px-4 py-3"
            style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
          >
            <button
              type="button"
              onClick={() => void handleContactar()}
              disabled={openingChat}
              style={jost}
              className="w-full bg-[#CC4B37] h-12 text-[12px] font-extrabold uppercase tracking-wide text-white disabled:opacity-50"
            >
              {openingChat ? 'Abriendo chat...' : 'Contactar vendedor'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
