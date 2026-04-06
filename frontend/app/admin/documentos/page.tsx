export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { createAdminClient } from '../supabase-server'
import DocumentsList, { type DocumentListItem } from './DocumentsList'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function AdminDocumentosPage() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('documents')
    .select('id, title, authority, ciudad, file_url, published, created_at')
    .order('created_at', { ascending: false })

  const documents: DocumentListItem[] =
    !error && data ? (data as DocumentListItem[]) : []

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1
          className="text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
          style={jostHeading}
        >
          DOCUMENTOS
        </h1>
        <Link
          href="/admin/documentos/nuevo"
          className="inline-flex items-center justify-center border border-solid border-[#EEEEEE] bg-[#CC4B37] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:opacity-90"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          SUBIR DOCUMENTO
        </Link>
      </div>
      <DocumentsList documents={documents} />
    </div>
  )
}
