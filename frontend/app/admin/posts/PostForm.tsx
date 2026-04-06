'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import StarterKit from '@tiptap/starter-kit'
import { useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import {
  createPost,
  updatePost,
  togglePublish,
  type PostInput,
} from './actions'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

const latoBody = { fontFamily: "'Lato', sans-serif" }

const inputClass =
  'w-full border border-solid border-[#EEEEEE] bg-[#FFFFFF] px-3 py-2 text-[#111111] outline-none focus:border-[#CC4B37]'

const CATEGORIES = [
  { value: 'noticias', label: 'Noticias' },
  { value: 'tutoriales', label: 'Tutoriales' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'comunidad', label: 'Comunidad' },
] as const

export type AdminPost = {
  id: string
  title: string
  slug: string
  category: string
  excerpt: string | null
  content: string | null
  cover_url: string | null
  meta_title: string | null
  meta_description: string | null
  published: boolean
  created_by: string | null
  created_at: string
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

function getUploadUrl(): string {
  const base =
    (typeof process !== 'undefined' &&
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '')) ||
    ''
  return `${base}/upload`
}

async function uploadImageFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(getUploadUrl(), {
    method: 'POST',
    body: fd,
  })
  if (!res.ok) {
    const t = await res.text()
    throw new Error(t || `Error ${res.status}`)
  }
  const json = (await res.json()) as { url?: string }
  if (!json?.url) throw new Error('Respuesta sin URL')
  return json.url
}

const editorProseCss = `
.post-form-tiptap .ProseMirror {
  min-height: 300px;
  padding: 16px;
  outline: none;
  font-family: 'Lato', sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: #111111;
}
.post-form-tiptap .ProseMirror p { margin: 0 0 0.75em; }
.post-form-tiptap .ProseMirror h1 {
  font-family: 'Jost', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 24px;
  margin: 0 0 0.5em;
  color: #111111;
}
.post-form-tiptap .ProseMirror h2 {
  font-family: 'Jost', sans-serif;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 20px;
  margin: 0 0 0.5em;
  color: #111111;
}
.post-form-tiptap .ProseMirror ul {
  list-style: disc;
  padding-left: 1.5em;
  margin: 0 0 0.75em;
}
.post-form-tiptap .ProseMirror ol {
  list-style: decimal;
  padding-left: 1.5em;
  margin: 0 0 0.75em;
}
.post-form-tiptap .ProseMirror a {
  color: #CC4B37;
  text-decoration: underline;
}
.post-form-tiptap .ProseMirror img {
  max-width: 100%;
  height: auto;
}
.post-form-tiptap .ProseMirror.is-editor-empty:first-child::before {
  color: #999999;
}
`

function ToolbarButton({
  onClick,
  active,
  label,
  disabled,
  children,
}: {
  onClick: () => void
  active?: boolean
  label: string
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex h-8 w-8 shrink-0 items-center justify-center border border-solid transition-colors ${
        active
          ? 'border-[#CC4B37] bg-[#F4F4F4] text-[#CC4B37]'
          : 'border-[#EEEEEE] bg-[#FFFFFF] text-[#111111] hover:border-[#CCCCCC]'
      } disabled:cursor-not-allowed disabled:opacity-50`}
      style={{ borderRadius: 2 }}
    >
      {children}
    </button>
  )
}

export default function PostForm({
  mode,
  post,
}: {
  mode: 'create' | 'edit'
  post?: AdminPost | null
}) {
  const router = useRouter()
  const isEdit = mode === 'edit' && post

  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')
  const [category, setCategory] = useState(post?.category ?? 'noticias')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [coverUrl, setCoverUrl] = useState(post?.cover_url ?? '')
  const [coverUploading, setCoverUploading] = useState(false)
  const [editorImageUploading, setEditorImageUploading] = useState(false)
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? '')
  const [metaDescription, setMetaDescription] = useState(
    post?.meta_description ?? ''
  )
  const [published, setPublished] = useState(post?.published ?? false)
  const [seoOpen, setSeoOpen] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, setPending] = useState<'draft' | 'publish' | null>(null)
  const [togglePending, setTogglePending] = useState(false)
  const [htmlModalOpen, setHtmlModalOpen] = useState(false)
  const [htmlModalValue, setHtmlModalValue] = useState('')

  const coverInputRef = useRef<HTMLInputElement>(null)
  const editorImageInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer' },
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({
        placeholder: 'Escribe el contenido del post aquí...',
      }),
    ],
    content: post?.content ?? '',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'post-form-tiptap-editor',
      },
    },
  })

  const applyHtml = () => {
    if (!editor) return
    editor.commands.setContent(htmlModalValue, { emitUpdate: true })
    setHtmlModalOpen(false)
    setHtmlModalValue('')
  }

  const handleTitleChange = (v: string) => {
    setTitle(v)
    if (!slugTouched) {
      setSlug(slugifyTitle(v))
    }
  }

  const handleCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
      setFormError('Solo se permiten JPEG, PNG o WebP')
      return
    }
    setFormError(null)
    setCoverUploading(true)
    try {
      const url = await uploadImageFile(file)
      setCoverUrl(url)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al subir imagen')
    } finally {
      setCoverUploading(false)
    }
  }

  const insertImageFromFile = useCallback(
    async (file: File) => {
      if (!editor || editor.isDestroyed) return
      if (!/^image\/(jpeg|png|webp)$/i.test(file.type)) {
        setFormError('Solo se permiten JPEG, PNG o WebP')
        return
      }
      setFormError(null)
      setEditorImageUploading(true)
      try {
        const url = await uploadImageFile(file)
        editor.chain().focus().setImage({ src: url }).run()
      } catch (err) {
        setFormError(err instanceof Error ? err.message : 'Error al subir imagen')
      } finally {
        setEditorImageUploading(false)
      }
    },
    [editor]
  )

  const onEditorImageInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) void insertImageFromFile(file)
  }

  const buildPayload = (publishedFlag: boolean): PostInput => ({
    title,
    slug,
    category,
    excerpt,
    cover_url: coverUrl.trim() || null,
    content: editor?.getHTML() ?? '',
    meta_title: metaTitle,
    meta_description: metaDescription,
    published: publishedFlag,
  })

  const submit = async (publishedFlag: boolean) => {
    setFormError(null)
    if (!editor) {
      setFormError('El editor no está listo')
      return
    }
    const action = publishedFlag ? 'publish' : 'draft'
    setPending(action)
    const payload = buildPayload(publishedFlag)
    try {
      if (mode === 'edit' && post) {
        const result = await updatePost(post.id, payload)
        if ('error' in result && result.error) {
          setFormError(result.error)
          return
        }
        setPublished(publishedFlag)
      } else {
        const result = await createPost(payload)
        if ('error' in result && result.error) {
          setFormError(result.error)
          return
        }
      }
      router.push('/admin/posts')
    } finally {
      setPending(null)
    }
  }

  const setVisibility = async (next: boolean) => {
    if (mode !== 'edit' || !post || published === next) return
    setTogglePending(true)
    setFormError(null)
    const result = await togglePublish(post.id, next)
    setTogglePending(false)
    if ('error' in result && result.error) {
      setFormError(result.error)
      return
    }
    setPublished(next)
  }

  if (!editor) {
    return (
      <p className="text-[#666666]" style={latoBody}>
        Cargando editor…
      </p>
    )
  }

  return (
    <div className="max-w-3xl space-y-6" style={latoBody}>
      <style dangerouslySetInnerHTML={{ __html: editorProseCss }} />

      {formError && (
        <p className="text-sm text-[#CC4B37]" role="alert">
          {formError}
        </p>
      )}

      {isEdit && (
        <div className="flex flex-wrap items-center gap-4 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-3">
          <span
            className="text-[0.65rem] tracking-[0.12em] text-[#666666]"
            style={jostHeading}
          >
            PUBLICADO / BORRADOR
          </span>
          <div
            className="flex border border-solid border-[#EEEEEE]"
            style={{ borderRadius: 2 }}
          >
            <button
              type="button"
              disabled={togglePending}
              onClick={() => void setVisibility(true)}
              className={`px-3 py-2 text-[0.65rem] tracking-[0.12em] transition-colors disabled:opacity-50 ${
                published
                  ? 'bg-[#CC4B37] text-[#FFFFFF]'
                  : 'bg-[#FFFFFF] text-[#666666] hover:text-[#111111]'
              }`}
              style={{ ...jostHeading, borderRadius: 0 }}
            >
              {togglePending && published ? '…' : 'PUBLICADO'}
            </button>
            <button
              type="button"
              disabled={togglePending}
              onClick={() => void setVisibility(false)}
              className={`border-l border-solid border-[#EEEEEE] px-3 py-2 text-[0.65rem] tracking-[0.12em] transition-colors disabled:opacity-50 ${
                !published
                  ? 'bg-[#EEEEEE] text-[#666666]'
                  : 'bg-[#FFFFFF] text-[#666666] hover:text-[#111111]'
              }`}
              style={{ ...jostHeading, borderRadius: 0 }}
            >
              {togglePending && !published ? '…' : 'BORRADOR'}
            </button>
          </div>
        </div>
      )}

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          TÍTULO
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className={inputClass}
          style={{ borderRadius: 2, ...latoBody }}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          SLUG
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(e.target.value)
          }}
          className={inputClass}
          style={{ borderRadius: 2, ...latoBody }}
        />
      </div>

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          CATEGORÍA
        </label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
          style={{ borderRadius: 2, ...latoBody }}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          EXTRACTO
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value.slice(0, 200))}
          rows={3}
          maxLength={200}
          className={inputClass}
          style={{ borderRadius: 2, ...latoBody, resize: 'vertical' }}
        />
        <p className="mt-1 text-right text-xs text-[#666666]">
          {excerpt.length}/200
        </p>
      </div>

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          IMAGEN DE PORTADA
        </label>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCoverFile}
        />
        <div className="flex flex-wrap items-start gap-4">
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            disabled={coverUploading}
            className="inline-flex items-center gap-2 border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-3 py-2 text-sm text-[#111111] disabled:opacity-50"
            style={{ borderRadius: 2, ...latoBody }}
          >
            {coverUploading && (
              <svg
                className="animate-spin"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#CCCCCC"
                  strokeWidth="3"
                />
                <path
                  d="M12 2a10 10 0 0110 10"
                  stroke="#CC4B37"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            )}
            {coverUploading ? 'Subiendo…' : 'Elegir archivo'}
          </button>
          {coverUrl ? (
            <div className="relative border border-solid border-[#EEEEEE]">
              <img
                src={coverUrl}
                alt=""
                className="max-h-40 max-w-full object-contain"
              />
            </div>
          ) : null}
        </div>
      </div>

      <div>
        <label
          className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
          style={jostHeading}
        >
          CONTENIDO
        </label>
        <input
          ref={editorImageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={onEditorImageInput}
        />
        <div
          className="mb-2 flex flex-wrap gap-1 border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-2"
          style={{ borderRadius: 0 }}
        >
          <ToolbarButton
            label="Negrita"
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6V4zm0 8h9a4 4 0 014 4 4 4 0 01-4 4H6v-8z" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Cursiva"
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M10 4h4M14 20H8M12 4l-4 16" strokeLinecap="round" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Título 1"
            active={editor.isActive('heading', { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
          >
            <span style={{ ...jostHeading, fontSize: 10 }}>H1</span>
          </ToolbarButton>
          <ToolbarButton
            label="Título 2"
            active={editor.isActive('heading', { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
          >
            <span style={{ ...jostHeading, fontSize: 10 }}>H2</span>
          </ToolbarButton>
          <ToolbarButton
            label="Lista sin orden"
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="4" cy="6" r="2" />
              <circle cx="4" cy="12" r="2" />
              <circle cx="4" cy="18" r="2" />
              <path d="M8 6h14M8 12h14M8 18h14" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Lista ordenada"
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M3 5h2v2H3V5zm0 6h2v2H3v-2zm0 6h2v2H3v-2z" />
              <path d="M8 6h12v1.5H8V6zm0 6h12v1.5H8V12zm0 6h12v1.5H8V18z" fillOpacity="0.35" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Enlace"
            active={editor.isActive('link')}
            onClick={() => {
              const prev = editor.getAttributes('link').href as string | undefined
              const url = window.prompt('URL del enlace', prev || 'https://')
              if (url === null) return
              if (url === '') {
                editor.chain().focus().extendMarkRange('link').unsetLink().run()
                return
              }
              editor
                .chain()
                .focus()
                .extendMarkRange('link')
                .setLink({ href: url })
                .run()
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M10 13a5 5 0 007.07 0l1.42-1.42a5 5 0 000-7.07 5 5 0 00-7.07 0M14 11a5 5 0 00-7.07 0L5.5 12.42a5 5 0 000 7.07 5 5 0 007.07 0" strokeLinecap="round" />
            </svg>
          </ToolbarButton>
          <ToolbarButton
            label="Insertar imagen"
            disabled={editorImageUploading}
            onClick={() => editorImageInputRef.current?.click()}
          >
            {editorImageUploading ? (
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" stroke="#CCCCCC" strokeWidth="3" />
                <path
                  d="M12 2a10 10 0 0110 10"
                  stroke="#CC4B37"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <rect x="3" y="5" width="18" height="14" />
                <circle cx="8.5" cy="10" r="1.5" fill="currentColor" stroke="none" />
                <path d="M21 15l-5-5-4 4-3-3-4 4" />
              </svg>
            )}
          </ToolbarButton>
          <ToolbarButton
            label="Importar HTML"
            onClick={() => setHtmlModalOpen(true)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" 
              stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" 
                strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </ToolbarButton>
        </div>
        <div
          className="post-form-tiptap border border-solid border-[#EEEEEE] bg-[#FFFFFF]"
          style={{ borderRadius: 0 }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      <div className="border border-solid border-[#EEEEEE] bg-[#F4F4F4]">
        <button
          type="button"
          onClick={() => setSeoOpen((o) => !o)}
          className="flex w-full items-center justify-between px-4 py-3 text-left text-[0.7rem] tracking-[0.12em] text-[#111111]"
          style={jostHeading}
        >
          CONFIGURACIÓN SEO
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={seoOpen ? 'rotate-180' : ''}
            aria-hidden
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {seoOpen && (
          <div className="space-y-4 border-t border-solid border-[#EEEEEE] bg-[#FFFFFF] px-4 py-4">
            <div>
              <label
                className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
                style={jostHeading}
              >
                META TITLE
              </label>
              <input
                type="text"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value.slice(0, 60))}
                maxLength={60}
                className={inputClass}
                style={{ borderRadius: 2, ...latoBody }}
              />
              <p className="mt-1 text-right text-xs text-[#666666]">
                {metaTitle.length}/60
              </p>
            </div>
            <div>
              <label
                className="mb-2 block text-[0.65rem] tracking-[0.12em] text-[#666666]"
                style={jostHeading}
              >
                META DESCRIPTION
              </label>
              <textarea
                value={metaDescription}
                onChange={(e) =>
                  setMetaDescription(e.target.value.slice(0, 160))
                }
                maxLength={160}
                rows={3}
                className={inputClass}
                style={{ borderRadius: 2, ...latoBody, resize: 'vertical' }}
              />
              <p className="mt-1 text-right text-xs text-[#666666]">
                {metaDescription.length}/160
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void submit(false)}
          className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#111111] transition-colors hover:border-[#CCCCCC] disabled:opacity-50"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          {pending === 'draft' ? 'GUARDANDO…' : 'GUARDAR BORRADOR'}
        </button>
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void submit(true)}
          className="border border-solid border-[#CC4B37] bg-[#CC4B37] px-4 py-2.5 text-[0.7rem] tracking-[0.12em] text-[#FFFFFF] transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ ...jostHeading, borderRadius: 2 }}
        >
          {pending === 'publish' ? 'PUBLICANDO…' : 'PUBLICAR'}
        </button>
      </div>

      {htmlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-2xl bg-[#FFFFFF] p-6 shadow-xl"
            style={{ borderRadius: 2 }}>
            <p className="mb-3 text-[0.65rem] tracking-[0.12em] text-[#666666]"
              style={jostHeading}>
              PEGAR HTML
            </p>
            <textarea
              value={htmlModalValue}
              onChange={(e) => setHtmlModalValue(e.target.value)}
              rows={12}
              className="w-full border border-solid border-[#EEEEEE] bg-[#F4F4F4] p-3 font-mono text-xs text-[#111111] outline-none focus:border-[#CC4B37]"
              style={{ borderRadius: 2, resize: 'vertical' }}
              placeholder="Pega el HTML aquí..."
            />
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={applyHtml}
                className="border border-solid border-[#CC4B37] bg-[#CC4B37] px-4 py-2 text-[0.65rem] tracking-[0.12em] text-white"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                APLICAR
              </button>
              <button
                type="button"
                onClick={() => { setHtmlModalOpen(false); setHtmlModalValue('') }}
                className="border border-solid border-[#EEEEEE] bg-[#F4F4F4] px-4 py-2 text-[0.65rem] tracking-[0.12em] text-[#111111]"
                style={{ ...jostHeading, borderRadius: 2 }}
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
