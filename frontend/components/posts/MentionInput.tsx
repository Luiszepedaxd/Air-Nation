'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

const lato = { fontFamily: "'Lato', sans-serif" } as const

const TEXTAREA =
  'w-full resize-none border border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-[14px] text-[#111111] placeholder:text-[#AAAAAA] focus:border-[#CC4B37] focus:outline-none'

type UserRow = {
  id: string
  alias: string | null
  avatar_url: string | null
}

type MentionActive = { start: number; query: string }

function getActiveMention(
  value: string,
  cursor: number
): MentionActive | null {
  if (cursor < 0 || cursor > value.length) return null
  const before = value.slice(0, cursor)
  const at = before.lastIndexOf('@')
  if (at < 0) return null
  const after = before.slice(at + 1)
  if (after.includes(' ') || after.includes('\n') || after.includes('\t')) {
    return null
  }
  if (after.length < 2) return null
  if (!/^\w*$/i.test(after)) return null
  return { start: at, query: after }
}

function mentionBoundaryOk(ch: string | undefined): boolean {
  if (ch === undefined) return true
  if (/\s/.test(ch)) return true
  return /^[@.,!?;:)\]}¡¿]$/.test(ch)
}

/** Recorre el texto y enlaza cada @con los alias conocidos del map (claves lower-case), priorizando el alias más largo — soporta espacios en el alias ("Cero Uno"). */
function collectMentionIds(
  text: string,
  aliasToId: Map<string, string>
): string[] {
  const ordered: string[] = []
  const seen = new Set<string>()
  const entries = Array.from(aliasToId.entries()).sort(
    (a, b) => b[0].length - a[0].length
  )
  let i = 0
  while (i < text.length) {
    const at = text.indexOf('@', i)
    if (at === -1) break
    const afterAt = text.slice(at + 1)
    let matchedId: string | null = null
    let consumed = 0
    for (const [aliasKey, id] of entries) {
      const lowAfter = afterAt.toLowerCase()
      if (lowAfter.startsWith(aliasKey.toLowerCase())) {
        const boundary = afterAt[aliasKey.length]
        if (mentionBoundaryOk(boundary)) {
          matchedId = id
          consumed = aliasKey.length
          break
        }
      }
    }
    if (matchedId != null && !seen.has(matchedId)) {
      seen.add(matchedId)
      ordered.push(matchedId)
      i = at + 1 + consumed
    } else {
      const loose = /^([\w]+(?:\s+[\w]+)*)/.exec(afterAt)
      i = loose ? at + 1 + loose[1].length : at + 1
    }
  }
  return ordered
}

function syncAliasMapFromText(text: string, map: Map<string, string>) {
  const entries = Array.from(map.entries()).sort(
    (a, b) => b[0].length - a[0].length
  )
  const keptLower = new Set<string>()
  let i = 0
  while (i < text.length) {
    const at = text.indexOf('@', i)
    if (at === -1) break
    const afterAt = text.slice(at + 1)
    let hitLen = 0
    for (const [aliasKey] of entries) {
      const lowAfter = afterAt.toLowerCase()
      if (lowAfter.startsWith(aliasKey.toLowerCase())) {
        const boundary = afterAt[aliasKey.length]
        if (mentionBoundaryOk(boundary)) {
          keptLower.add(aliasKey.toLowerCase())
          hitLen = aliasKey.length
          break
        }
      }
    }
    i = hitLen ? at + 1 + hitLen : at + 1
  }
  Array.from(map.keys()).forEach((k) => {
    if (!keptLower.has(k.toLowerCase())) map.delete(k)
  })
}

type Props = {
  value: string
  onChange: (text: string, mentions: string[]) => void
  placeholder?: string
  maxLength?: number
  autoFocus?: boolean
}

export function MentionInput({
  value,
  onChange,
  placeholder = 'Escribe…',
  maxLength = 500,
  autoFocus,
}: Props) {
  const taRef = useRef<HTMLTextAreaElement | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const aliasToIdRef = useRef<Map<string, string>>(new Map())
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const listId = useId()

  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)
  const runSearch = useCallback(async (query: string) => {
    const t = query.trim()
    if (t.length < 2) {
      setUsers([])
      return
    }
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, alias, avatar_url')
        .ilike('alias', `${t}%`)
        .limit(6)
      if (error) {
        setUsers([])
        return
      }
      setUsers((data ?? []) as UserRow[])
    } finally {
      setLoading(false)
    }
  }, [])

  const scheduleSearch = useCallback(
    (query: string) => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
      searchTimer.current = setTimeout(() => {
        void runSearch(query)
      }, 300)
    },
    [runSearch]
  )

  useEffect(
    () => () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    },
    []
  )

  const emit = useCallback(
    (text: string) => {
      syncAliasMapFromText(text, aliasToIdRef.current)
      const mentions = collectMentionIds(text, aliasToIdRef.current)
      onChange(text, mentions)
    },
    [onChange]
  )

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, maxLength)
    const pos = e.target.selectionStart ?? next.length
    const m = getActiveMention(next, pos)
    if (m) {
      setQ(m.query)
      setOpen(true)
      scheduleSearch(m.query)
    } else {
      setOpen(false)
      setQ('')
      setUsers([])
    }
    emit(next)
  }

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const pos = e.currentTarget.selectionStart ?? 0
    const m = getActiveMention(e.currentTarget.value, pos)
    if (m) {
      setQ(m.query)
      setOpen(true)
      scheduleSearch(m.query)
    } else {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target
      if (!(t instanceof Node)) return
      if (wrapRef.current && !wrapRef.current.contains(t)) {
        setOpen(false)
        setUsers([])
      }
    }
    document.addEventListener('mousedown', onDown, true)
    return () => document.removeEventListener('mousedown', onDown, true)
  }, [open])

  const pick = (u: UserRow) => {
    const ta = taRef.current
    const al = (u.alias || '').trim()
    if (!ta || !al) return
    const pos = ta.selectionStart ?? value.length
    const m = getActiveMention(value, pos)
    if (!m) return
    const before = value.slice(0, m.start)
    const after = value.slice(pos)
    const insert = `@${al}  `
    const newText = `${before}${insert}${after}`.slice(0, maxLength)
    const nextCursor = (before + insert).length
    aliasToIdRef.current.set(al.toLowerCase(), u.id)
    emit(newText)
    setOpen(false)
    setUsers([])
    setQ('')
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(nextCursor, nextCursor)
    })
  }

  return (
    <div
      ref={wrapRef}
      className="relative z-10 w-full overflow-visible"
    >
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        placeholder={placeholder}
        rows={3}
        maxLength={maxLength}
        className={TEXTAREA}
        style={lato}
        autoFocus={autoFocus}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
      />
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-56 min-w-0 overflow-y-auto border border-[#EEEEEE] bg-white py-1 shadow-lg"
          style={lato}
        >
          {loading && q.length >= 2 && users.length === 0 && (
            <li className="px-4 py-3 text-[13px] text-[#888888]">Buscando…</li>
          )}
          {!loading && q.length >= 2 && users.length === 0 && (
            <li className="px-4 py-3 text-[13px] text-[#888888]">
              Sin resultados
            </li>
          )}
          {users.map((u) => {
            const al = (u.alias || '—').trim() || '—'
            const initial = al.charAt(0).toUpperCase()
            return (
              <li key={u.id} role="option">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault()
                    pick(u)
                  }}
                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-[#111111] hover:bg-[#F4F4F4]"
                >
                  <span className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-[#F4F4F4]">
                    {u.avatar_url ? (
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="h-6 w-6 object-cover"
                        width={24}
                        height={24}
                      />
                    ) : (
                      <span className="flex h-6 w-6 items-center justify-center text-[11px] font-bold text-[#CC4B37]">
                        {initial}
                      </span>
                    )}
                  </span>
                  <span>@{al}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
