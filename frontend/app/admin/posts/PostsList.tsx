'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
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

  useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este post? Esta acción no se puede deshacer.')) {
      return
    }
    setDeletingId(id)
    const result = await deletePost(id)
    setDeletingId(null)
    if ('error' in result && result.error) {
      window.alert(result.error)
      return
    }
    setPosts((prev) => prev.filter((p) => p.id !== id))
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

  return (
    <div className="w-full overflow-x-auto border border-solid border-[#EEEEEE]" style={latoBody}>
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
              <td className="border border-solid border-[#EEEEEE] px-3 py-2">
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
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/admin/posts/${p.id}/editar`}
                    className="inline-flex items-center justify-center bg-[#111111] text-[#FFFFFF] transition-colors hover:bg-[#CC4B37]"
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
                    onClick={() => handleDelete(p.id)}
                    className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] text-[#111111] transition-colors hover:border-[#CC4B37] hover:text-[#CC4B37] disabled:opacity-50"
                    style={{
                      ...jostHeading,
                      fontSize: 11,
                      padding: '4px 10px',
                      borderRadius: 2,
                    }}
                  >
                    {deletingId === p.id ? '…' : 'ELIMINAR'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
