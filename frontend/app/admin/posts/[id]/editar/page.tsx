import { redirect } from 'next/navigation'
import { createAdminClient } from '../../../supabase-server'
import PostForm, { type AdminPost } from '../../PostForm'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default async function EditarPostPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('posts')
    .select(
      'id, title, slug, category, excerpt, content, cover_url, meta_title, meta_description, published, created_by, created_at, faqs'
    )
    .eq('id', params.id)
    .maybeSingle()

  if (error || !data) {
    redirect('/admin/posts')
  }

  const post = data as AdminPost

  return (
    <div className="p-6">
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        EDITAR POST
      </h1>
      <PostForm key={post.id} mode="edit" post={post} />
    </div>
  )
}
