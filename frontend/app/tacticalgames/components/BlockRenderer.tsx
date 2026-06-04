import type { TacticalGamesBlock } from '../lib/types'
import { HeroSection } from './HeroSection'
import { BriefingSection } from './BriefingSection'
import { SedeSection } from './SedeSection'
import { CountdownSection } from './CountdownSection'
import { EquipamientoSection } from './EquipamientoSection'
import { InscripcionSection } from './InscripcionSection'
import { SponsorsSection } from './SponsorsSection'
import { GaleriaSection } from './GaleriaSection'
import { AirnationSection } from './AirnationSection'

import type {
  HeroConfig,
  BriefingConfig,
  SedeConfig,
  CountdownConfig,
  EquipamientoConfig,
  InscripcionConfig,
  SponsorsConfig,
  GaleriaConfig,
  AirnationConfig,
} from '../lib/types'

export function BlockRenderer({
  block,
  renderedAt,
}: {
  block: TacticalGamesBlock
  renderedAt: string
}) {
  switch (block.slug) {
    case 'hero':
      return <HeroSection config={(block.config as HeroConfig) ?? {}} />
    case 'briefing':
      return <BriefingSection config={(block.config as BriefingConfig) ?? {}} />
    case 'sede':
      return <SedeSection config={(block.config as SedeConfig) ?? {}} />
    case 'countdown':
      return <CountdownSection config={(block.config as CountdownConfig) ?? {}} />
    case 'equipamiento':
      return <EquipamientoSection config={(block.config as EquipamientoConfig) ?? {}} />
    case 'inscripcion':
      return (
        <InscripcionSection
          config={(block.config as InscripcionConfig) ?? {}}
          renderedAt={renderedAt}
        />
      )
    case 'sponsors':
      return <SponsorsSection config={(block.config as SponsorsConfig) ?? {}} />
    case 'galeria':
      return <GaleriaSection config={(block.config as GaleriaConfig) ?? {}} />
    case 'airnation':
      return <AirnationSection config={(block.config as AirnationConfig) ?? {}} />
    default:
      return null
  }
}
