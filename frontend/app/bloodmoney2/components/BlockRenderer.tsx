import type { ComponentType } from 'react'
import type { BloodMoney2Block, BloodMoney2Slug } from '../types'
import { HeroSection } from './HeroSection'
import { TickerSection } from './TickerSection'
import { EventoSection } from './EventoSection'
import { FaccionesSection } from './FaccionesSection'
import { LogisticaSection } from './LogisticaSection'
import { VipSection } from './VipSection'
import { JuggernautSection } from './JuggernautSection'
import { EntradasSection } from './EntradasSection'
import { GaleriaSection } from './GaleriaSection'
import { AirnationSection } from './AirnationSection'
import { SponsorsSection } from './SponsorsSection'
import { CtaFinalSection } from './CtaFinalSection'

const MAP: Record<BloodMoney2Slug, ComponentType<{ config: Record<string, unknown> }>> = {
  hero: HeroSection,
  ticker: TickerSection,
  evento: EventoSection,
  facciones: FaccionesSection,
  logistica: LogisticaSection,
  vip: VipSection,
  juggernaut: JuggernautSection,
  entradas: EntradasSection,
  galeria: GaleriaSection,
  airnation: AirnationSection,
  sponsors: SponsorsSection,
  cta_final: CtaFinalSection,
}

export function BlockRenderer({ block }: { block: BloodMoney2Block }) {
  const Component = MAP[block.slug]
  if (!Component) return null
  return <Component config={block.config} />
}
