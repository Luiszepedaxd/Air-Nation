import type { OperacionKursk2Block } from '../lib/types'
import { HeroSection } from './HeroSection'
import { NarrativaSection } from './NarrativaSection'
import { SedeSection } from './SedeSection'
import { CountdownSection } from './CountdownSection'
import { FaccionesSection } from './FaccionesSection'
import { OperativoSection } from './OperativoSection'
import { InscripcionSection } from './InscripcionSection'
import { SponsorsSection } from './SponsorsSection'
import { GaleriaSection } from './GaleriaSection'
import { ManualSection } from './ManualSection'
import { AirnationSection } from './AirnationSection'
import { CtaFinalSection } from './CtaFinalSection'

import type {
  HeroConfig,
  NarrativaConfig,
  SedeConfig,
  CountdownConfig,
  FaccionesConfig,
  OperativoConfig,
  InscripcionConfig,
  SponsorsConfig,
  GaleriaConfig,
  ManualConfig,
  AirnationConfig,
  CtaFinalConfig,
} from '../lib/types'

export function BlockRenderer({ block }: { block: OperacionKursk2Block }) {
  switch (block.slug) {
    case 'hero':
      return <HeroSection config={block.config as HeroConfig} />
    case 'narrativa':
      return <NarrativaSection config={block.config as NarrativaConfig} />
    case 'sede':
      return <SedeSection config={block.config as SedeConfig} />
    case 'countdown':
      return <CountdownSection config={block.config as CountdownConfig} />
    case 'facciones':
      return <FaccionesSection config={block.config as FaccionesConfig} />
    case 'operativo':
      return <OperativoSection config={block.config as OperativoConfig} />
    case 'inscripcion':
      return <InscripcionSection config={block.config as InscripcionConfig} />
    case 'sponsors':
      return <SponsorsSection config={block.config as SponsorsConfig} />
    case 'galeria':
      return <GaleriaSection config={block.config as GaleriaConfig} />
    case 'manual':
      return <ManualSection config={block.config as ManualConfig} />
    case 'airnation':
      return <AirnationSection config={block.config as AirnationConfig} />
    case 'cta_final':
      return <CtaFinalSection config={block.config as CtaFinalConfig} />
    default:
      return null
  }
}
