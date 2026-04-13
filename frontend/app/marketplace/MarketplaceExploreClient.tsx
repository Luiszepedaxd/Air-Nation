'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { PublicMarketplaceListing } from './types'

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

function ListingCard({ listing }: { listing: PublicMarketplaceListing }) {
  const foto = listing.fotos_urls?.[0] ?? null
  const ubicacion = [listing.ciudad, listing.estado].filter(Boolean).join(', ')

  return (
    <Link
      href={`/marketplace/${listing.id}`}
      className="group block overflow-hidden rounded-[12px] border border-[#E4E4E4] bg-[#FFFFFF] shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        className="relative w-full overflow-hidden bg-[#F0F2F5]"
        style={{ aspectRatio: '1/1' }}
      >
        {foto ? (
          <img src={foto} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#EEEEEE]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
                stroke="#CCCCCC"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <path
                d="M3 6h18M16 10a4 4 0 01-8 0"
                stroke="#CCCCCC"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
        {listing.vendido && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span
              style={jost}
              className="bg-[#111111] px-2 py-1 text-[9px] font-extrabold uppercase text-white"
            >
              Vendido
            </span>
          </div>
        )}
        {listing.nuevo_usado === 'nuevo' && !listing.vendido && (
          <span
            style={jost}
            className="absolute left-1.5 top-1.5 bg-[#CC4B37] px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-white"
          >
            Nuevo
          </span>
        )}
      </div>

      <div className="px-2 pb-2 pt-1.5">
        <div className="flex flex-wrap items-baseline gap-1.5">
          {listing.precio_original != null &&
            listing.precio != null &&
            listing.precio_original !== listing.precio && (
              <span style={lato} className="text-[11px] text-[#999999] line-through">
                ${listing.precio_original.toLocaleString('es-MX')}
              </span>
            )}
          <p style={jost} className="text-[14px] font-extrabold leading-tight text-[#111111]">
            {listing.modalidad === 'desde' && (
              <span
                style={lato}
                className="mr-1 text-[10px] font-normal normal-case text-[#999999]"
              >
                Desde{' '}
              </span>
            )}
            ${listing.precio?.toLocaleString('es-MX') ?? '—'}
          </p>
          {listing.precio_original != null &&
            listing.precio != null &&
            listing.precio_original !== listing.precio &&
            listing.precio_original > 0 && (
              <span style={jost} className="bg-[#CC4B37] px-1 py-0.5 text-[9px] font-extrabold text-white">
                -
                {Math.round(
                  (1 - listing.precio / listing.precio_original) * 100
                )}
                %
              </span>
            )}
        </div>
        <p style={lato} className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#444444]">
          {listing.titulo}
        </p>
        <p style={lato} className="mt-0.5 truncate text-[11px] text-[#999999]">
          {ubicacion}
        </p>
      </div>
    </Link>
  )
}

export function MarketplaceExploreClient({
  listings,
}: {
  listings: PublicMarketplaceListing[]
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroNuevoUsado, setFiltroNuevoUsado] = useState('')
  const [localCategoria, setLocalCategoria] = useState('')
  const [localNuevoUsado, setLocalNuevoUsado] = useState('')
  const [filtroDescuento, setFiltroDescuento] = useState(false)
  const [localDescuento, setLocalDescuento] = useState(false)

  const activeCount = [
    filtroCategoria,
    filtroNuevoUsado,
    filtroDescuento ? 'desc' : '',
  ].filter(Boolean).length

  const filtered = useMemo(() => {
    let list = listings
    if (filtroCategoria) {
      list = list.filter((l) => l.supercategoria === filtroCategoria)
    }
    if (filtroNuevoUsado) {
      list = list.filter((l) => l.nuevo_usado === filtroNuevoUsado)
    }
    if (filtroDescuento) {
      list = list.filter((l) => l.precio_original != null)
    }
    return list
  }, [listings, filtroCategoria, filtroNuevoUsado, filtroDescuento])

  const handleOpen = () => {
    setLocalCategoria(filtroCategoria)
    setLocalNuevoUsado(filtroNuevoUsado)
    setLocalDescuento(filtroDescuento)
    setSheetOpen(true)
  }

  const handleApply = () => {
    setFiltroCategoria(localCategoria)
    setFiltroNuevoUsado(localNuevoUsado)
    setFiltroDescuento(localDescuento)
    setSheetOpen(false)
  }

  const handleClear = () => {
    setLocalCategoria('')
    setLocalNuevoUsado('')
    setLocalDescuento(false)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => {
              setFiltroCategoria('')
              setFiltroNuevoUsado('')
              setFiltroDescuento(false)
            }}
            style={lato}
            className="text-[12px] text-[#999999] underline-offset-2 hover:underline"
          >
            Limpiar filtros
          </button>
        )}
        <button
          type="button"
          onClick={handleOpen}
          className={`flex items-center gap-1.5 border px-3 py-2 text-[12px] transition-colors ${
            activeCount > 0
              ? 'border-[#CC4B37] bg-[#FFF5F4] text-[#CC4B37]'
              : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#666666] hover:border-[#CCCCCC]'
          }`}
          style={lato}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6h16M7 12h10M10 18h4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          Filtrar
          {activeCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#CC4B37] text-[9px] font-extrabold text-white">
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {sheetOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setSheetOpen(false)}
          aria-hidden
        />
      )}

      <div
        className={`fixed left-0 right-0 z-50 max-h-[85vh] overflow-y-auto bg-white transition-transform duration-300 ease-out ${
          sheetOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        style={{
          bottom: 0,
          borderRadius: '12px 12px 0 0',
          paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
        }}
      >
        <div
          className="flex w-full cursor-pointer justify-center py-4"
          onClick={() => setSheetOpen(false)}
        >
          <div className="h-1 w-10 rounded-full bg-[#DDDDDD]" />
        </div>
        <div className="px-5 pb-6 pt-2">
          <div className="mb-5 flex items-center justify-between">
            <p style={jost} className="text-[13px] font-extrabold uppercase text-[#111111]">
              Filtrar
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                style={jost}
                className="text-[11px] font-extrabold uppercase text-[#999999] underline-offset-2 hover:underline"
              >
                Limpiar
              </button>
              <button
                type="button"
                onClick={handleApply}
                style={jost}
                className="bg-[#CC4B37] px-4 py-2 text-[11px] font-extrabold uppercase tracking-wide text-white"
              >
                Aplicar
              </button>
            </div>
          </div>

          <div className="mb-5">
            <p
              style={jost}
              className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            >
              Categoría
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: '', label: 'Todo' },
                { id: 'replicas', label: 'Réplicas' },
                { id: 'accesorios', label: 'Accesorios' },
                { id: 'gear', label: 'Gear' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalCategoria(opt.id)}
                  style={jost}
                  className={`border px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                    localCategoria === opt.id
                      ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                      : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p
              style={jost}
              className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            >
              Estado
            </p>
            <div className="flex gap-2">
              {[
                { id: '', label: 'Todos' },
                { id: 'nuevo', label: 'Nuevo' },
                { id: 'usado', label: 'Usado' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLocalNuevoUsado(opt.id)}
                  style={jost}
                  className={`flex-1 border py-2.5 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                    localNuevoUsado === opt.id
                      ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                      : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p
              style={jost}
              className="mb-3 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#999999]"
            >
              Precio
            </p>
            <button
              type="button"
              onClick={() => setLocalDescuento((v) => !v)}
              style={jost}
              className={`border px-4 py-2 text-[10px] font-extrabold uppercase tracking-wide transition-colors ${
                localDescuento
                  ? 'border-[#CC4B37] bg-[#CC4B37] text-white'
                  : 'border-[#EEEEEE] bg-[#F4F4F4] text-[#666666]'
              }`}
            >
              Con descuento
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"
              stroke="#AAAAAA"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path
              d="M3 6h18M16 10a4 4 0 01-8 0"
              stroke="#AAAAAA"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <p style={jost} className="mt-4 text-[14px] font-extrabold uppercase text-[#666666]">
            Sin publicaciones
          </p>
          <p style={lato} className="mt-2 max-w-[260px] text-[13px] text-[#999999]">
            {listings.length === 0
              ? 'Sé el primero en publicar algo en el marketplace'
              : 'No hay resultados con los filtros seleccionados'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
