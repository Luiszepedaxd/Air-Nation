import type { Virus3Block } from '../lib/types'
import { HeroSection } from './HeroSection'
import { NarrativaSection } from './NarrativaSection'
import { SedeSection } from './SedeSection'
import { CountdownSection } from './CountdownSection'
import { FaccionesSection } from './FaccionesSection'
import { InscripcionSection } from './InscripcionSection'
import { AmenidadesSection } from './AmenidadesSection'
import { CronogramaSection } from './CronogramaSection'
import { SponsorsSection } from './SponsorsSection'
import { GaleriaSection } from './GaleriaSection'
import { VideosSection } from './VideosSection'
import { AirnationSection } from './AirnationSection'

import type {
  HeroConfig,
  NarrativaConfig,
  SedeConfig,
  CountdownConfig,
  FaccionesConfig,
  InscripcionConfig,
  AmenidadesConfig,
  CronogramaConfig,
  SponsorsConfig,
  GaleriaConfig,
  VideosConfig,
  AirnationConfig,
} from '../lib/types'

export function BlockRenderer({
  block,
  renderedAt,
}: {
  block: Virus3Block
  renderedAt: string
}) {
  void renderedAt
  switch (block.slug) {
    case 'hero':
      return <HeroSection config={(block.config as HeroConfig) ?? {}} />
    case 'narrativa':
      return <NarrativaSection config={(block.config as NarrativaConfig) ?? {}} />
    case 'sede':
      return <SedeSection config={(block.config as SedeConfig) ?? {}} />
    case 'countdown':
      return <CountdownSection config={(block.config as CountdownConfig) ?? {}} />
    case 'facciones':
      return <FaccionesSection config={(block.config as FaccionesConfig) ?? {}} />
    case 'inscripcion':
      return <InscripcionSection config={(block.config as InscripcionConfig) ?? {}} />
    case 'amenidades':
      return <AmenidadesSection config={(block.config as AmenidadesConfig) ?? {}} />
    case 'cronograma':
      return <CronogramaSection config={(block.config as CronogramaConfig) ?? {}} />
    case 'sponsors':
      return <SponsorsSection config={(block.config as SponsorsConfig) ?? {}} />
    case 'galeria':
      return <GaleriaSection config={(block.config as GaleriaConfig) ?? {}} />
    case 'videos':
      return <VideosSection config={(block.config as VideosConfig) ?? {}} />
    case 'airnation':
      return <AirnationSection config={(block.config as AirnationConfig) ?? {}} />
    default:
      return null
  }
}
