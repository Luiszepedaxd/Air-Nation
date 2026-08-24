import { PublicResultsPage } from './PublicResultsPage'

export default function TorneoPublicPage({
  params,
}: {
  params: { slug: string }
}) {
  return <PublicResultsPage slug={params.slug} />
}
