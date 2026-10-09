'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { deletePost } from './actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

export type PostListItem = {
  id: string
  title: string
  slug: string
  category: string
  published: boolean
  created_at: string | null
}

function formatFecha(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function EstadoBadge({ published }: { published: boolean }) {
  return (
    <span
      className="inline-block text-[11px] font-semibold tracking-wide"
      style={{
        padding: '4px 8px',
        borderRadius: 2,
        backgroundColor: published ? '#CC4B37' : '#EEEEEE',
        color: published ? '#FFFFFF' : '#666666',
        ...jostHeading,
        fontSize: 10,
      }}
    >
      {published ? 'PUBLICADO' : 'BORRADOR'}
    </span>
  )
}

export default function PostsList({ posts: initialPosts }: { posts: PostListItem[] }) {
  const [posts, setPosts] = useState<PostListItem[]>(initialPosts)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<PostListItem | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const openDelete = (p: PostListItem) => {
    setPendingDelete(p)
    setDeleteError(null)
  }

  const closeDelete = () => {
    if (deletingId) return
    setPendingDelete(null)
    setDeleteError(null)
  }

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setDeletingId(pendingDelete.id)
    setDeleteError(null)
    const result = await deletePost(pendingDelete.id)
    setDeletingId(null)
    if ('error' in result && result.error) {
      setDeleteError(result.error)
      return
    }
    setPosts((prev) => prev.filter((p) => p.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  if (posts.length === 0) {
    return (
      <p
        className="py-16 text-center text-[#666666]"
        style={latoBody}
      >
        No hay posts aún
      </p>
    )
  }

  const actions = (p: PostListItem) => (
    <div className="flex flex-wrap gap-2">
      <Link
        href={`/admin/posts/${p.id}/editar`}
        className="inline-flex min-h-11 items-center justify-center bg-[#111111] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37] md:min-h-0"
        style={{
          ...jostHeading,
          fontSize: 11,
          padding: '4px 10px',
          borderRadius: 2,
        }}
      >
        EDITAR
      </Link>
      <button
        type="button"
        disabled={deletingId === p.id}
        onClick={() => openDelete(p)}
        className="inline-flex min-h-11 items-center border border-[#CC4B37] px-3 py-1.5 font-body text-[0.7rem] font-bold uppercase tracking-[0.15em] text-[#CC4B37] transition-colors hover:bg-[#CC4B37] hover:text-white disabled:opacity-50 md:min-h-0"
        style={{ borderRadius: 2 }}
      >
        {deletingId === p.id ? '…' : 'ELIMINAR'}
      </button>
    </div>
  )

  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden" style={latoBody}>
        {posts.map((p) => (
          <li
            key={p.id}
            className="border border-solid border-[#EEEEEE] bg-[#FFFFFF] p-4"
          >
            <p className="break-words text-sm font-semibold text-[#111111]">{p.title}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#666666]">
              <span>{p.category}</span>
              <EstadoBadge published={p.published} />
              <span>{formatFecha(p.created_at)}</span>
            </div>
            <div className="mt-3">{actions(p)}</div>
          </li>
        ))}
      </ul>

      <div className="hidden w-full overflow-x-auto border border-solid border-[#EEEEEE] md:block" style={latoBody}>
      <table className="w-full border-collapse text-left text-sm text-[#111111]">
        <thead>
          <tr className="bg-[#F4F4F4]">
            {(['TÍTULO', 'CATEGORÍA', 'ESTADO', 'FECHA', 'ACCIONES'] as const).map(
              (col) => (
                <th
                  key={col}
                  className="border border-solid border-[#EEEEEE] px-3 py-3 text-[12px] text-[#111111]"
                  style={jostHeading}
                >
                  {col}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody>
          {posts.map((p, i) => (
            <tr
              key={p.id}
              className={i % 2 === 0 ? 'bg-[#FFFFFF]' : 'bg-[#F4F4F4]'}
            >
              <td className="border border-solid border-[#EEEEEE] px-3 py-2 break-words">
                {p.title}
              </td>
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                {p.category}
              </td>
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                <EstadoBadge published={p.published} />
              </td>
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                {formatFecha(p.created_at)}
              </td>
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
                {actions(p)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      <DeleteConfirmModal
        open={pendingDelete !== null}
        resourceLabel={pendingDelete?.title ?? ''}
        loading={pendingDelete !== null && deletingId === pendingDelete.id}
        error={deleteError}
        onClose={closeDelete}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  )
}
