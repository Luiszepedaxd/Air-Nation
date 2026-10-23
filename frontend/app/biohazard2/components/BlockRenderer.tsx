import type { Biohazard2Block } from '../lib/types'
import { HeroSection } from './HeroSection'
import { NarrativaSection } from './NarrativaSection'
import { CountdownSection } from './CountdownSection'
import { MisionSection } from './MisionSection'
import { SoldadoCeroSection } from './SoldadoCeroSection'
import { FaccionesSection } from './FaccionesSection'
import { SedeSection } from './SedeSection'
import { InscripcionSection } from './InscripcionSection'
import { CronogramaSection } from './CronogramaSection'
import { ReglamentoSection } from './ReglamentoSection'
import { SponsorsSection } from './SponsorsSection'
import { GaleriaSection } from './GaleriaSection'
import { VideosSection } from './VideosSection'
import { AirnationSection } from './AirnationSection'

import type {
  HeroConfig,
  NarrativaConfig,
  CountdownConfig,
  MisionConfig,
  SoldadoCeroConfig,
  FaccionesConfig,
  SedeConfig,
  InscripcionConfig,
  CronogramaConfig,
  ReglamentoConfig,
  SponsorsConfig,
  GaleriaConfig,
  VideosConfig,
  AirnationConfig,
} from '../lib/types'

export function BlockRenderer({ block }: { block: Biohazard2Block }) {
  switch (block.slug) {
    case 'hero':
      return <HeroSection config={(block.config as HeroConfig) ?? {}} />
    case 'narrativa':
      return <NarrativaSection config={(block.config as NarrativaConfig) ?? {}} />
    case 'countdown':
      return <CountdownSection config={(block.config as CountdownConfig) ?? {}} />
    case 'mision':
      return <MisionSection config={(block.config as MisionConfig) ?? {}} />
    case 'soldado_cero':
      return <SoldadoCeroSection config={(block.config as SoldadoCeroConfig) ?? {}} />
    case 'facciones':
      return <FaccionesSection config={(block.config as FaccionesConfig) ?? {}} />
    case 'sede':
      return <SedeSection config={(block.config as SedeConfig) ?? {}} />
    case 'inscripcion':
      return <InscripcionSection config={(block.config as InscripcionConfig) ?? {}} />
    case 'cronograma':
      return <CronogramaSection config={(block.config as CronogramaConfig) ?? {}} />
    case 'reglamento':
      return <ReglamentoSection config={(block.config as ReglamentoConfig) ?? {}} />
    case 'productor':
      return null
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
