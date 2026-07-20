'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://air-nation-production.up.railway.app/api/v1'
).replace(/\/$/, '')

const jost = { fontFamily: "'Jost', sans-serif" } as const
const lato = { fontFamily: "'Lato', sans-serif" } as const

type SearchResults = {
  operadores: { id: string; alias: string | null; nombre: string | null; avatar_url: string | null }[]
  equipos:    { id: string; nombre: string; slug: string; logo_url: string | null }[]
  campos:     { id: string; nombre: string; slug: string; ciudad: string | null; foto_portada_url: string | null }[]
  listings:   { id: string; titulo: string; precio: number | null; fotos_urls: string[] }[]
  eventos:    { id: string; title: string; fecha: string }[]
  blog:       { id: string; title: string; slug: string; cover_url: string | null }[]
  arsenal:    { id: string; nombre: string; sistema: string | null; foto_url: string | null; user_id: string }[]
}

const CATEGORY_LABELS: Record<keyof SearchResults, string> = {
  operadores: 'Operadores',
  equipos:    'Equipos',
  campos:     'Campos',
  listings:   'Marketplace',
  eventos:    'Eventos',
  blog:       'Blog',
  arsenal:    'Arsenal',
}

function getResultHref(category: keyof SearchResults, item: SearchResults[typeof category][number]): string {
  switch (category) {
    case 'operadores': return `/u/${(item as SearchResults['operadores'][number]).id}`
    case 'equipos':    return `/equipos/${(item as SearchResults['equipos'][number]).slug}`
    case 'campos':     return `/campos/${(item as SearchResults['campos'][number]).slug}`
    case 'listings':   return `/marketplace/${item.id}`
    case 'eventos':    return `/eventos`
    case 'blog':       return `/blog/${(item as SearchResults['blog'][number]).slug}`
    case 'arsenal':    return `/replicas/${item.id}`
    default:           return '/dashboard'
  }
}

function getResultLabel(category: keyof SearchResults, item: SearchResults[typeof category][number]): string {
  switch (category) {
    case 'operadores': {
      const o = item as SearchResults['operadores'][number]
      return o.alias ?? o.nombre ?? 'Operador'
    }
    case 'equipos':  return (item as SearchResults['equipos'][number]).nombre
    case 'campos':   return (item as SearchResults['campos'][number]).nombre
    case 'listings': return (item as SearchResults['listings'][number]).titulo
    case 'eventos':  return (item as SearchResults['eventos'][number]).title
    case 'blog':     return (item as SearchResults['blog'][number]).title
    case 'arsenal':  return (item as SearchResults['arsenal'][number]).nombre
    default:         return ''
  }
}

function getResultImage(category: keyof SearchResults, item: SearchResults[typeof category][number]): string | null {
  switch (category) {
    case 'operadores': return (item as SearchResults['operadores'][number]).avatar_url
    case 'equipos':    return (item as SearchResults['equipos'][number]).logo_url
    case 'campos':     return (item as SearchResults['campos'][number]).foto_portada_url
    case 'listings':   return (item as SearchResults['listings'][number]).fotos_urls?.[0] ?? null
    case 'blog':       return (item as SearchResults['blog'][number]).cover_url
    case 'arsenal':    return (item as SearchResults['arsenal'][number]).foto_url
    default:           return null
  }
}

export function SearchBar({ className = '' }: { className?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null)
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id ?? null
      const params = new URLSearchParams({ q })
      if (userId) params.set('user_id', userId)
      const res = await fetch(`${API_URL}/search?${params.toString()}`)
      const json = await res.json() as { results: SearchResults; total: number }
      setResults(json.results)
      setOpen(true)
    } catch {
      setResults(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void search(query.trim())
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Cerrar con ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const handleSelect = (category: keyof SearchResults, item: SearchResults[typeof category][number]) => {
    const href = getResultHref(category, item)
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  const hasResults = results && Object.values(results).some(arr => arr.length > 0)
  const categories = results
    ? (Object.keys(results) as (keyof SearchResults)[]).filter(k => results[k].length > 0)
    : []

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Input */}
      <div className="flex items-center gap-2 border border-[#EEEEEE] bg-[#F4F4F4] px-3 h-9">
        {loading ? (
          <svg className="animate-spin shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#CCCCCC" strokeWidth="2"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#CC4B37" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#999999]">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => { if (results && hasResults) setOpen(true) }}
          placeholder="Buscar operadores, equipos, réplicas..."
          style={lato}
          className="flex-1 bg-transparent text-[13px] text-[#111111] placeholder:text-[#999999] outline-none min-w-0"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults(null); setOpen(false) }}
            className="shrink-0 text-[#999999] hover:text-[#111111]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-y-auto bg-[#FFFFFF] border border-[#EEEEEE] shadow-lg">
          {!hasResults ? (
            <p style={lato} className="px-4 py-6 text-center text-[13px] text-[#999999]">
              Sin resultados para "{query}"
            </p>
          ) : (
            categories.map(category => (
              <div key={category}>
                {/* Category header */}
                <div className="px-3 py-2 bg-[#F4F4F4] border-b border-[#EEEEEE]">
                  <span style={jost} className="text-[9px] font-extrabold uppercase tracking-widest text-[#999999]">
                    {CATEGORY_LABELS[category]}
                  </span>
                </div>
                {/* Items */}
                {results[category].map((item) => {
                  const label = getResultLabel(category, item)
                  const image = getResultImage(category, item)
                  const initials = label.slice(0, 2).toUpperCase()
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(category, item)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-[#F4F4F4] border-b border-[#F4F4F4] text-left transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-8 h-8 shrink-0 overflow-hidden bg-[#F4F4F4] border border-[#EEEEEE] flex items-center justify-center">
                        {image ? (
                          <img src={image} alt="" className="w-full h-full object-cover"/>
                        ) : (
                          <span style={jost} className="text-[9px] font-extrabold text-[#CC4B37]">
                            {initials}
                          </span>
                        )}
                      </div>
                      <span style={lato} className="flex-1 min-w-0 text-[13px] text-[#111111] truncate">
                        {label}
                      </span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#CCCCCC]">
                        <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                      </svg>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
