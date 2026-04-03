import PostForm from '../PostForm'

const jostHeading = {
  fontFamily: "'Jost', sans-serif",
  fontWeight: 800,
  textTransform: 'uppercase' as const,
}

export default function NuevoPostPage() {
  return (
    <div className="p-6">
      <h1
        className="mb-8 text-2xl tracking-[0.12em] text-[#111111] md:text-3xl"
        style={jostHeading}
      >
        NUEVO POST
      </h1>
      <PostForm mode="create" />
    </div>
  )
}
