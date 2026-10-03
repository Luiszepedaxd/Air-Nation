import { cookies } from 'next/headers'
import type { CapsulasConfig } from '../lib/types'
import { isCompleted, parseProgressValue } from '../lib/progreso-capsulas'
import { capsulasVisibles } from './capsulas/helpers'
import { CapsulasSection } from './CapsulasSection'

export async function CapsulasSectionServer({
  config,
  capsulaParam,
}: {
  config: CapsulasConfig
  capsulaParam?: string | null
}) {
  const cookieStore = await cookies()
  const raw = cookieStore.get('an_v3_capsulas')?.value ?? null
  const initialProgreso = parseProgressValue(raw)
  const lista = capsulasVisibles(config)
  const ids = new Set(lista.map((c) => c.id))

  let initialDestacadaId = lista[0]?.id ?? ''
  if (capsulaParam && ids.has(capsulaParam)) {
    initialDestacadaId = capsulaParam
  } else {
    const pendiente = lista.find((c) => !isCompleted(initialProgreso, c.id))
    if (pendiente) initialDestacadaId = pendiente.id
  }

  const capsulaDeepLink =
    capsulaParam && ids.has(capsulaParam) ? capsulaParam : undefined

  return (
    <CapsulasSection
      config={config}
      initialProgreso={initialProgreso}
      initialDestacadaId={initialDestacadaId}
      capsulaParam={capsulaDeepLink}
    />
  )
}
