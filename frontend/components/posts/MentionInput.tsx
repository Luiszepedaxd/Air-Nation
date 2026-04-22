'use client'

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
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

/** Posición aprox. del cursor en el viewport (textarea multilínea). */
function getCaretClientRect(
  el: HTMLTextAreaElement,
  position: number
): DOMRect {
  const p = Math.min(position, el.value.length)
  const d = document.createElement('div')
  const s = getComputedStyle(el)
  const props: string[] = [
    'direction',
    'boxSizing',
    'width',
    'height',
    'overflowX',
    'overflowY',
    'borderTopWidth',
    'borderRightWidth',
    'borderBottomWidth',
    'borderLeftWidth',
    'borderStyle',
    'paddingTop',
    'paddingRight',
    'paddingBottom',
    'paddingLeft',
    'fontStyle',
    'fontVariant',
    'fontWeight',
    'fontSize',
    'lineHeight',
    'fontFamily',
    'textAlign',
    'textTransform',
    'textIndent',
    'textDecoration',
    'letterSpacing',
    'wordSpacing',
    'tabSize',
    'MozTabSize',
    'whiteSpace',
    'wordBreak',
    'wordWrap',
  ]
  for (const k of props) d.style.setProperty(k, s.getPropertyValue(k))
  d.style.position = 'absolute'
  d.style.visibility = 'hidden'
  d.style.whiteSpace = 'pre-wrap'
  d.style.wordWrap = 'break-word'
  d.style.width = `${el.clientWidth}px`
  d.style.zIndex = '0'
  d.style.top = '0px'
  d.style.left = '-10000px'
  d.textContent = el.value.substring(0, p)
  const span = document.createElement('span')
  span.textContent = el.value.substring(p) || '\u00a0'
  d.appendChild(span)
  document.body.appendChild(d)
  d.scrollTop = el.scrollTop
  const r = span.getBoundingClientRect()
  document.body.removeChild(d)
  return r
}

function collectMentionIds(
  text: string,
  aliasToId: Map<string, string>
): string[] {
  const re = /@([\w]+)/g
  const ordered: string[] = []
  const seen = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    const key = m[1].toLowerCase()
    const id = aliasToId.get(key)
    if (id && !seen.has(id)) {
      seen.add(id)
      ordered.push(id)
    }
  }
  return ordered
}

function syncAliasMapFromText(text: string, map: Map<string, string>) {
  const tokens = new Set<string>()
  const re = /@([\w]+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    tokens.add(m[1].toLowerCase())
  }
  Array.from(map.keys()).forEach((k) => {
    if (!tokens.has(k)) map.delete(k)
  })
}

type Props = {
  value: string
  onChange: (text: string, mentions: string[]) => void
  placeholder?: string
  maxLength?: number
}

export function MentionInput({
  value,
  onChange,
  placeholder = 'Escribe…',
  maxLength = 500,
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
  const [caret, setCaret] = useState<{
    top: number
    left: number
  } | null>(null)
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

  const updateCaretPosition = useCallback(() => {
    const ta = taRef.current
    if (!ta) {
      setCaret(null)
      return
    }
    const pos = ta.selectionStart ?? 0
    const m = getActiveMention(ta.value, pos)
    if (m) {
      try {
        const r = getCaretClientRect(ta, pos)
        setCaret({ top: r.bottom + 4, left: r.left })
      } catch {
        const br = ta.getBoundingClientRect()
        setCaret({ top: br.bottom + 4, left: br.left + 8 })
      }
    } else {
      setCaret(null)
    }
  }, [])

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
    requestAnimationFrame(() => updateCaretPosition())
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
    requestAnimationFrame(() => updateCaretPosition())
  }

  useLayoutEffect(() => {
    if (!open) return
    updateCaretPosition()
  }, [open, value, updateCaretPosition])

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
    const insert = `@${al} `
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
    <div ref={wrapRef} className="relative w-full">
      <textarea
        ref={taRef}
        value={value}
        onChange={handleChange}
        onSelect={handleSelect}
        onKeyUp={updateCaretPosition}
        onClick={updateCaretPosition}
        placeholder={placeholder}
        rows={3}
        maxLength={maxLength}
        className={TEXTAREA}
        style={lato}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
      />
      {open && caret && (
        <ul
          id={listId}
          role="listbox"
          className="fixed z-[200] max-h-56 min-w-[220px] max-w-sm overflow-y-auto border border-[#EEEEEE] bg-white py-1 shadow-md"
          style={{ top: caret.top, left: caret.left, ...lato }}
        >
          {loading && q.length >= 2 && users.length === 0 && (
            <li className="px-3 py-2 text-[13px] text-[#888888]">Buscando…</li>
          )}
          {!loading && q.length >= 2 && users.length === 0 && (
            <li className="px-3 py-2 text-[13px] text-[#888888]">
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
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-[14px] text-[#111111] hover:bg-[#F4F4F4]"
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
