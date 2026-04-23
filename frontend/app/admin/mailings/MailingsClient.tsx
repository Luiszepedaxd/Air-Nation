'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MailingHistoryRow, MailingUser } from './page'
import {
  completeMailingAction,
  createMailingAction,
  failMailingAction,
} from './actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

type Step = 1 | 2 | 3

type SortMode = 'last_sign_in_at' | 'created_at'

const DEFAULT_HTML = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#ffffff;">
  <div style="margin-bottom:24px;">
    <span style="font-family:Arial,sans-serif;font-weight:900;font-size:20px;letter-spacing:3px;text-transform:uppercase;color:#111111;">
      AIR<span style="color:#CC4B37;">NATION</span>
    </span>
  </div>
  <h1 style="font-family:Arial,sans-serif;font-weight:800;font-size:22px;text-transform:uppercase;color:#111111;margin:0 0 16px;">
    Hola {{alias}}
  </h1>
  <p style="font-family:Arial,sans-serif;font-size:15px;color:#444444;line-height:1.6;margin:0 0 24px;">
    Reemplaza este contenido con tu mensaje. Puedes usar las variables
    <strong>{{alias}}</strong> y <strong>{{nombre}}</strong>.
  </p>
  <a href="https://airnation.online"
     style="display:inline-block;background:#CC4B37;color:#ffffff;font-family:Arial,sans-serif;font-weight:800;font-size:13px;text-transform:uppercase;letter-spacing:2px;padding:14px 28px;text-decoration:none;">
    IR A AIRNATION
  </a>
  <p style="font-family:Arial,sans-serif;font-size:13px;color:#999999;margin:32px 0 0;line-height:1.5;">
    AirNation — La plataforma del airsoft en México<br/>
    <a href="https://airnation.online" style="color:#CC4B37;">airnation.online</a>
  </p>
</div>`

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  const hh = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

function timestamp(iso: string | null): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? 0 : t
}

function escapeHtml(str: string): string {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function renderPreviewHtml(
  html: string,
  user: MailingUser | null
): string {
  const alias = escapeHtml(user?.alias || 'jugador')
  const nombre = escapeHtml(user?.nombre || '')
  return html.replaceAll('{{alias}}', alias).replaceAll('{{nombre}}', nombre)
}

export default function MailingsClient({
  users,
  history: historyInitial,
}: {
  users: MailingUser[]
  history: MailingHistoryRow[]
}) {
  const [step, setStep] = useState<Step>(1)
  const [sortMode, setSortMode] = useState<SortMode>('last_sign_in_at')
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [asunto, setAsunto] = useState('')
  const [html, setHtml] = useState(DEFAULT_HTML)
  const [confirming, setConfirming] = useState(false)
  const [recipientsExpanded, setRecipientsExpanded] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<
    | { sent: number; failed: number; error?: string }
    | null
  >(null)
  const [history, setHistory] = useState<MailingHistoryRow[]>(historyInitial)

  const filteredSortedUsers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = q
      ? users.filter((u) => {
          const a = (u.alias || '').toLowerCase()
          const n = (u.nombre || '').toLowerCase()
          const e = (u.email || '').toLowerCase()
          return a.includes(q) || n.includes(q) || e.includes(q)
        })
      : users

    const arr = [...filtered]
    arr.sort((a, b) => {
      const av = timestamp(
        sortMode === 'last_sign_in_at' ? a.last_sign_in_at : a.created_at
      )
      const bv = timestamp(
        sortMode === 'last_sign_in_at' ? b.last_sign_in_at : b.created_at
      )
      return bv - av
    })
    return arr
  }, [users, search, sortMode])

  const selectedUsers = useMemo(
    () => users.filter((u) => selectedIds.has(u.id) && u.email),
    [users, selectedIds]
  )

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllFiltered = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const u of filteredSortedUsers) {
        if (u.email) next.add(u.id)
      }
      return next
    })
  }

  const clearAll = () => setSelectedIds(new Set())

  const firstPreviewUser = selectedUsers[0] ?? null
  const previewHtml = useMemo(
    () => renderPreviewHtml(html, firstPreviewUser),
    [html, firstPreviewUser]
  )

  const canGoStep2 = selectedUsers.length > 0
  const canSend =
    asunto.trim().length > 0 && html.trim().length > 0 && selectedUsers.length > 0

  const handleSend = async () => {
    if (!canSend || sending) return
    setSending(true)
    setSendResult(null)

    let mailingId: string | null = null

    try {
      const recipientEmails = selectedUsers
        .map((u) => u.email)
        .filter((e): e is string => !!e)

      const createResult = await createMailingAction({
        asunto,
        html,
        recipient_emails: recipientEmails,
      })

      if ('error' in createResult) {
        setSendResult({
          sent: 0,
          failed: 0,
          error: createResult.error,
        })
        setSending(false)
        return
      }
      mailingId = createResult.id

      const API_URL = (
        process.env.NEXT_PUBLIC_API_URL ||
        'https://air-nation-production.up.railway.app/api/v1'
      ).replace(/\/$/, '')

      const {
        data: { session },
      } = await supabase.auth.getSession()

      const res = await fetch(`${API_URL}/admin/send-mailing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({
          asunto,
          html,
          users: selectedUsers.map((u) => ({
            email: u.email,
            alias: u.alias,
            nombre: u.nombre,
          })),
        }),
      })

      const data = (await res.json()) as {
        sent?: number
        failed?: number
        error?: string
      }

      if (!res.ok) {
        await failMailingAction(mailingId)
        setSendResult({
          sent: 0,
          failed: selectedUsers.length,
          error: data.error || `Error HTTP ${res.status}`,
        })
        return
      }

      const sent = data.sent ?? 0
      const failed = data.failed ?? 0

      await completeMailingAction(mailingId, {
        sent_count: sent,
        failed_count: failed,
      })

      setSendResult({ sent, failed })

      const newHistoryRow: MailingHistoryRow = {
        id: mailingId,
        asunto,
        recipient_count: selectedUsers.length,
        sent_count: sent,
        failed_count: failed,
        created_at: new Date().toISOString(),
      }
      setHistory((prev) => [newHistoryRow, ...prev].slice(0, 20))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error inesperado'
      if (mailingId) {
        await failMailingAction(mailingId)
      }
      setSendResult({ sent: 0, failed: selectedUsers.length, error: msg })
    } finally {
      setSending(false)
    }
  }

  const resetAll = () => {
    setStep(1)
    setConfirming(false)
    setSendResult(null)
    setSending(false)
    setRecipientsExpanded(false)
  }

  return (
    <div style={latoBody}>
      <div className="mb-6 flex items-end justify-between gap-4">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          MAILINGS
        </h1>
        <div className="flex items-center gap-3 text-[0.65rem] uppercase tracking-[0.14em] text-[#666666]">
          <StepBadge active={step === 1} done={step > 1} index={1} label="Usuarios" />
          <span className="text-[#CCCCCC]">—</span>
          <StepBadge active={step === 2} done={step > 2} index={2} label="Plantilla" />
          <span className="text-[#CCCCCC]">—</span>
          <StepBadge active={step === 3} done={false} index={3} label="Enviar" />
        </div>
      </div>

      {step === 1 && (
        <Step1
          users={filteredSortedUsers}
          totalUsers={users.length}
          selectedIds={selectedIds}
          selectedCount={selectedUsers.length}
          toggleOne={toggleOne}
          selectAllFiltered={selectAllFiltered}
          clearAll={clearAll}
          search={search}
          setSearch={setSearch}
          sortMode={sortMode}
          setSortMode={setSortMode}
          onNext={() => canGoStep2 && setStep(2)}
        />
      )}

      {step === 2 && (
        <Step2
          asunto={asunto}
          setAsunto={setAsunto}
          html={html}
          setHtml={setHtml}
          previewHtml={previewHtml}
          firstPreviewUser={firstPreviewUser}
          selectedCount={selectedUsers.length}
          onBack={() => setStep(1)}
          onNext={() => {
            if (canSend) {
              setConfirming(true)
              setStep(3)
            }
          }}
          canSend={canSend}
        />
      )}

      {step === 3 && (
        <Step3
          asunto={asunto}
          selectedUsers={selectedUsers}
          recipientsExpanded={recipientsExpanded}
          setRecipientsExpanded={setRecipientsExpanded}
          confirming={confirming}
          sending={sending}
          sendResult={sendResult}
          onCancel={() => {
            setConfirming(false)
            setStep(2)
          }}
          onConfirm={() => {
            setConfirming(false)
            void handleSend()
          }}
          onReset={resetAll}
        />
      )}

      <HistorySection history={history} />
    </div>
  )
}

function StepBadge({
  active,
  done,
  index,
  label,
}: {
  active: boolean
  done: boolean
  index: number
  label: string
}) {
  const bg = active ? '#CC4B37' : done ? '#111111' : '#EEEEEE'
  const color = active || done ? '#FFFFFF' : '#666666'
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[0.6rem] tracking-[0.16em]"
      style={{
        ...jostHeading,
        backgroundColor: bg,
        color,
        borderRadius: 2,
      }}
    >
      <span style={{ opacity: 0.7 }}>0{index}</span>
      <span>{label}</span>
    </span>
  )
}

/* -------------------------- STEP 1 -------------------------- */

function Step1({
  users,
  totalUsers,
  selectedIds,
  selectedCount,
  toggleOne,
  selectAllFiltered,
  clearAll,
  search,
  setSearch,
  sortMode,
  setSortMode,
  onNext,
}: {
  users: MailingUser[]
  totalUsers: number
  selectedIds: Set<string>
  selectedCount: number
  toggleOne: (id: string) => void
  selectAllFiltered: () => void
  clearAll: () => void
  search: string
  setSearch: (v: string) => void
  sortMode: SortMode
  setSortMode: (v: SortMode) => void
  onNext: () => void
}) {
  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar alias, nombre o email…"
            className="w-full max-w-md border border-solid border-[#E5E0DA] bg-white px-3 py-2 text-sm text-[#111111] outline-none focus:border-[#CC4B37]"
            style={{ borderRadius: 2 }}
          />
          <div className="ml-auto hidden text-xs text-[#666666] md:block">
            {users.length} de {totalUsers} usuarios
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label
            className="flex items-center gap-2 text-[0.65rem] uppercase tracking-[0.12em] text-[#666666]"
            style={jostHeading}
          >
            Orden
          </label>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="border border-solid border-[#E5E0DA] bg-white px-2 py-2 text-xs text-[#111111] outline-none focus:border-[#CC4B37]"
            style={{ borderRadius: 2 }}
          >
            <option value="last_sign_in_at">Último acceso</option>
            <option value="created_at">Fecha de registro</option>
          </select>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={selectAllFiltered}
          className="border border-solid border-[#E5E0DA] bg-white px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-[#111111] transition-colors hover:bg-[#F7F5F3]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          Seleccionar todos (filtrados)
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="border border-solid border-[#E5E0DA] bg-white px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.12em] text-[#666666] transition-colors hover:bg-[#F7F5F3]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          Deseleccionar
        </button>
        <span
          className="ml-auto px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.12em]"
          style={{
            ...jostHeading,
            borderRadius: 2,
            backgroundColor: selectedCount > 0 ? '#111111' : '#EEEEEE',
            color: selectedCount > 0 ? '#FFFFFF' : '#666666',
          }}
        >
          {selectedCount} seleccionado{selectedCount === 1 ? '' : 's'}
        </span>
      </div>

      <div className="overflow-x-auto border border-solid border-[#E5E0DA] bg-white">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-solid border-[#E5E0DA] bg-[#F7F5F3] text-left">
              <Th style={{ width: 40 }}></Th>
              <Th>Alias</Th>
              <Th>Nombre</Th>
              <Th>Email</Th>
              <Th>Último acceso</Th>
              <Th>Registro</Th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-xs text-[#666666]"
                >
                  Sin resultados
                </td>
              </tr>
            )}
            {users.map((u) => {
              const checked = selectedIds.has(u.id)
              const disabled = !u.email
              return (
                <tr
                  key={u.id}
                  className={`border-b border-solid border-[#EEEEEE] transition-colors ${
                    checked ? 'bg-[rgba(204,75,55,0.04)]' : 'hover:bg-[#F7F5F3]'
                  }`}
                >
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggleOne(u.id)}
                      style={{ accentColor: '#CC4B37' }}
                    />
                  </td>
                  <td className="px-3 py-2 text-[#111111]">
                    {u.alias || <span className="text-[#CCCCCC]">—</span>}
                  </td>
                  <td className="px-3 py-2 text-[#444444]">
                    {u.nombre || <span className="text-[#CCCCCC]">—</span>}
                  </td>
                  <td className="px-3 py-2 text-[#444444]">
                    {u.email || <span className="text-[#CC4B37]">sin email</span>}
                  </td>
                  <td className="px-3 py-2 text-xs text-[#666666]">
                    {formatDateTime(u.last_sign_in_at)}
                  </td>
                  <td className="px-3 py-2 text-xs text-[#666666]">
                    {formatDate(u.created_at)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          disabled={selectedCount === 0}
          className="bg-[#CC4B37] px-5 py-3 text-[0.7rem] uppercase tracking-[0.14em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          Preparar plantilla →
        </button>
      </div>
    </section>
  )
}

function Th({
  children,
  style,
}: {
  children?: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <th
      className="px-3 py-2.5 text-[0.65rem] uppercase tracking-[0.12em] text-[#666666]"
      style={{ ...jostHeading, ...style }}
    >
      {children}
    </th>
  )
}

/* -------------------------- STEP 2 -------------------------- */

function Step2({
  asunto,
  setAsunto,
  html,
  setHtml,
  previewHtml,
  firstPreviewUser,
  selectedCount,
  onBack,
  onNext,
  canSend,
}: {
  asunto: string
  setAsunto: (v: string) => void
  html: string
  setHtml: (v: string) => void
  previewHtml: string
  firstPreviewUser: MailingUser | null
  selectedCount: number
  onBack: () => void
  onNext: () => void
  canSend: boolean
}) {
  return (
    <section>
      <p className="mb-4 text-xs text-[#666666]">
        Las variables{' '}
        <code className="bg-[#F7F5F3] px-1.5 py-0.5 text-[#CC4B37]">
          {'{{alias}}'}
        </code>{' '}
        y{' '}
        <code className="bg-[#F7F5F3] px-1.5 py-0.5 text-[#CC4B37]">
          {'{{nombre}}'}
        </code>{' '}
        se reemplazan por los valores de cada destinatario. El preview usa a{' '}
        <strong>
          {firstPreviewUser?.alias || firstPreviewUser?.email || 'el primer usuario'}
        </strong>{' '}
        como ejemplo.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div>
            <label
              className="mb-1.5 block text-[0.65rem] uppercase tracking-[0.14em] text-[#666666]"
              style={jostHeading}
            >
              Asunto
            </label>
            <input
              type="text"
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              placeholder="Ej: Hola {{alias}}, novedades de AirNation"
              className="w-full border border-solid border-[#E5E0DA] bg-white px-3 py-2.5 text-sm text-[#111111] outline-none focus:border-[#CC4B37]"
              style={{ borderRadius: 2 }}
            />
          </div>

          <div className="flex flex-1 flex-col">
            <label
              className="mb-1.5 block text-[0.65rem] uppercase tracking-[0.14em] text-[#666666]"
              style={jostHeading}
            >
              HTML
            </label>
            <textarea
              value={html}
              onChange={(e) => setHtml(e.target.value)}
              className="min-h-[360px] w-full flex-1 border border-solid border-[#E5E0DA] bg-white p-3 font-mono text-xs text-[#111111] outline-none focus:border-[#CC4B37]"
              style={{ borderRadius: 2 }}
              spellCheck={false}
            />
          </div>
        </div>

        <div className="flex flex-col">
          <label
            className="mb-1.5 block text-[0.65rem] uppercase tracking-[0.14em] text-[#666666]"
            style={jostHeading}
          >
            Preview
          </label>
          <div
            className="min-h-[360px] flex-1 border border-solid border-[#E5E0DA] bg-white"
            style={{ borderRadius: 2 }}
          >
            <iframe
              srcDoc={previewHtml}
              title="Preview del mailing"
              sandbox=""
              className="h-full min-h-[420px] w-full"
              style={{ border: 0 }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="border border-solid border-[#E5E0DA] bg-white px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.14em] text-[#111111] transition-colors hover:bg-[#F7F5F3]"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          ← Volver
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canSend}
          className="bg-[#CC4B37] px-5 py-3 text-[0.7rem] uppercase tracking-[0.14em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          Enviar a {selectedCount} usuario{selectedCount === 1 ? '' : 's'} →
        </button>
      </div>
    </section>
  )
}

/* -------------------------- STEP 3 -------------------------- */

function Step3({
  asunto,
  selectedUsers,
  recipientsExpanded,
  setRecipientsExpanded,
  confirming,
  sending,
  sendResult,
  onCancel,
  onConfirm,
  onReset,
}: {
  asunto: string
  selectedUsers: MailingUser[]
  recipientsExpanded: boolean
  setRecipientsExpanded: (v: boolean) => void
  confirming: boolean
  sending: boolean
  sendResult: { sent: number; failed: number; error?: string } | null
  onCancel: () => void
  onConfirm: () => void
  onReset: () => void
}) {
  const N = selectedUsers.length

  return (
    <section>
      <div
        className="border border-solid border-[#E5E0DA] bg-white p-5"
        style={{ borderRadius: 2 }}
      >
        {confirming && !sending && !sendResult && (
          <>
            <h2
              className="mb-2 text-lg tracking-[0.1em] text-[#111111]"
              style={jostHeading}
            >
              Confirmar envío
            </h2>
            <p className="mb-1 text-sm text-[#444444]">
              Vas a enviar a <strong>{N}</strong> persona{N === 1 ? '' : 's'}.
              ¿Continuar?
            </p>
            <p className="mb-4 text-xs text-[#666666]">
              Asunto:{' '}
              <span className="text-[#111111]">{asunto}</span>
            </p>

            <button
              type="button"
              onClick={() => setRecipientsExpanded(!recipientsExpanded)}
              className="mb-3 text-[0.65rem] uppercase tracking-[0.12em] text-[#CC4B37]"
              style={jostHeading}
            >
              {recipientsExpanded ? 'Ocultar' : 'Ver'} destinatarios ({N})
            </button>
            {recipientsExpanded && (
              <div
                className="mb-4 max-h-48 overflow-y-auto border border-solid border-[#EEEEEE] bg-[#F7F5F3] p-3 text-xs text-[#444444]"
                style={{ borderRadius: 2 }}
              >
                {selectedUsers.map((u) => (
                  <div key={u.id} className="py-0.5">
                    {u.email}
                    {u.alias && (
                      <span className="text-[#999999]"> — {u.alias}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="border border-solid border-[#E5E0DA] bg-white px-4 py-2.5 text-[0.7rem] uppercase tracking-[0.14em] text-[#111111] transition-colors hover:bg-[#F7F5F3]"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="bg-[#CC4B37] px-5 py-3 text-[0.7rem] uppercase tracking-[0.14em] text-white transition-opacity hover:opacity-90"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                Sí, enviar
              </button>
            </div>
          </>
        )}

        {sending && (
          <div className="flex flex-col items-center py-6 text-center">
            <div
              className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#EEEEEE] border-t-[#CC4B37]"
              aria-hidden
            />
            <p
              className="text-[0.7rem] uppercase tracking-[0.14em] text-[#666666]"
              style={jostHeading}
            >
              Enviando a {N} destinatarios…
            </p>
          </div>
        )}

        {sendResult && !sending && (
          <>
            <h2
              className="mb-2 text-lg tracking-[0.1em] text-[#111111]"
              style={jostHeading}
            >
              {sendResult.error
                ? 'Error al enviar'
                : sendResult.failed === 0
                  ? 'Envío completado'
                  : 'Envío con errores'}
            </h2>
            {sendResult.error ? (
              <p className="mb-4 text-sm text-[#CC4B37]">{sendResult.error}</p>
            ) : (
              <p className="mb-4 text-sm text-[#444444]">
                Enviados: <strong>{sendResult.sent}</strong> · Fallidos:{' '}
                <strong
                  className={
                    sendResult.failed > 0 ? 'text-[#CC4B37]' : 'text-[#111111]'
                  }
                >
                  {sendResult.failed}
                </strong>
              </p>
            )}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onReset}
                className="bg-[#111111] px-5 py-3 text-[0.7rem] uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#CC4B37]"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                Nuevo mailing
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

/* -------------------------- HISTORY -------------------------- */

function HistorySection({ history }: { history: MailingHistoryRow[] }) {
  return (
    <section className="mt-10 border-t border-solid border-[#E5E0DA] pt-6">
      <h2
        className="mb-3 text-[0.7rem] tracking-[0.18em] text-[#666666]"
        style={jostHeading}
      >
        Últimos mailings
      </h2>
      {history.length === 0 ? (
        <p className="text-xs text-[#999999]">Sin mailings registrados aún.</p>
      ) : (
        <div
          className="overflow-x-auto border border-solid border-[#E5E0DA] bg-white"
          style={{ borderRadius: 2 }}
        >
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-solid border-[#E5E0DA] bg-[#F7F5F3] text-left">
                <Th>Asunto</Th>
                <Th>Fecha</Th>
                <Th>Destinatarios</Th>
                <Th>Enviados</Th>
                <Th>Fallidos</Th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr
                  key={h.id}
                  className="border-b border-solid border-[#EEEEEE]"
                >
                  <td className="max-w-[320px] truncate px-3 py-2 text-[#111111]">
                    {h.asunto}
                  </td>
                  <td className="px-3 py-2 text-xs text-[#666666]">
                    {formatDateTime(h.created_at)}
                  </td>
                  <td className="px-3 py-2 text-[#444444]">
                    {h.recipient_count}
                  </td>
                  <td className="px-3 py-2 text-[#111111]">{h.sent_count}</td>
                  <td className="px-3 py-2">
                    {h.failed_count > 0 ? (
                      <span
                        className="inline-block px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.1em] text-white"
                        style={{
                          ...jostHeading,
                          backgroundColor: '#CC4B37',
                          borderRadius: 2,
                        }}
                      >
                        {h.failed_count}
                      </span>
                    ) : (
                      <span className="text-xs text-[#999999]">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
