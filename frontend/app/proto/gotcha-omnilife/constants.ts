import type { ModalidadId, PaqueteId, PaqueteInfo } from './types'

export const CAMPO = {
  nombre: 'Gotcha Omnilife',
  tagline: 'El campo más grande del Área Metropolitana de Guadalajara',
  ciudad: 'Guadalajara, Jalisco',
  ubicacion: 'Av. Paseo Royal Country 4596, Zapopan, Jal.',
  horario: 'Sáb y Dom 8:00 am – 6:00 pm',
  capacidad: 'Hasta 80 jugadores por sesión',
  modalidades: 'Gotcha · Airsoft suave · Gelsoft',
  rating: 4.8,
  resenas: 127,
  mapsQuery: 'Av.+Paseo+Royal+Country+4596,+Zapopan,+Jalisco',
}

export const GALLERY_LABELS = [
  'Portada',
  'Zona de juego',
  'Bunkers',
  'Equipamiento',
  'Vestidores',
]

export const CAMPO_GRID_LABELS = [
  'Vista aérea',
  'Campo principal',
  'Zona táctica',
  'Área de descanso',
  'Briefing',
  'Estacionamiento',
]

const PAQUETES_GOTCHA: PaqueteInfo[] = [
  {
    id: 'basico',
    modalidad: 'gotcha',
    label: 'Básico',
    badge: 'BÁSICO',
    precio: 180,
    duracion: '2 h',
    includes: ['Equipo completo', '100 bolas gotcha', 'Máscara y chaleco', 'Briefing de seguridad'],
    nota: 'Edad mínima 12 años · Sáb y dom',
  },
  {
    id: 'estandar',
    modalidad: 'gotcha',
    label: 'Estándar',
    badge: 'ESTÁNDAR',
    precio: 280,
    duracion: '3 h',
    includes: ['Equipo premium', '200 bolas', 'Bebida incluida', 'Zona VIP descanso'],
    nota: 'El favorito de grupos medianos',
    popular: true,
    destacado: 'Más reservado',
  },
  {
    id: 'premium',
    modalidad: 'gotcha',
    label: 'Premium',
    badge: 'PREMIUM',
    precio: 420,
    duracion: '4 h',
    includes: ['Equipo elite', '350 bolas', '2 bebidas', 'Foto grupal digital'],
    nota: 'Ideal cumpleaños y corporativos',
    destacado: 'Experiencia completa',
  },
]

const PAQUETES_AIRSOFT: PaqueteInfo[] = [
  {
    id: 'basico',
    modalidad: 'airsoft',
    label: 'Recruit',
    badge: 'RECRUIT',
    precio: 220,
    duracion: '2 h',
    includes: ['Réplica AEG básica', '500 BBs biodegradables', 'Máscara full face', 'Chaleco táctico'],
    nota: 'Airsoft suave · Edad mínima 14 años',
  },
  {
    id: 'estandar',
    modalidad: 'airsoft',
    label: 'Operador',
    badge: 'OPERADOR',
    precio: 340,
    duracion: '3 h',
    includes: ['Réplica mid-tier', '1,000 BBs', 'Radio 2 vías', 'Bebida + snack'],
    nota: 'Partidas tipo MilSim ligero',
    popular: true,
    destacado: 'Más reservado',
  },
  {
    id: 'premium',
    modalidad: 'airsoft',
    label: 'Spec Ops',
    badge: 'SPEC OPS',
    precio: 480,
    duracion: '4 h',
    includes: ['Réplica alta gama', '2,000 BBs', 'Granada simulada x1', 'Instructor dedicado'],
    nota: 'Incluye escenario nocturno (sáb)',
    destacado: 'Máxima intensidad',
  },
]

export const PAQUETES_POR_MODALIDAD: Record<ModalidadId, PaqueteInfo[]> = {
  gotcha: PAQUETES_GOTCHA,
  airsoft: PAQUETES_AIRSOFT,
}

/** @deprecated usar PAQUETES_POR_MODALIDAD */
export const PAQUETES = PAQUETES_GOTCHA

export const HORARIOS = [
  { value: '08:00 am', label: '08:00 am', disponible: true },
  { value: '10:00 am', label: '10:00 am', disponible: true },
  { value: '12:00 pm', label: '12:00 pm', disponible: false },
  { value: '02:00 pm', label: '02:00 pm', disponible: true },
]

export const REGLAS = [
  { icon: 'shield', text: 'Máscara y protección ocular obligatorias siempre.' },
  { icon: 'alert', text: 'Prohibido disparar a menos de 5 metros.' },
  { icon: 'users', text: 'Mín. 2 jugadores. Grupos grandes: avisar antes.' },
  { icon: 'clock', text: 'Llegar 30 min antes para briefing.' },
  { icon: 'ban', text: 'Sin alcohol ni sustancias en el campo.' },
  { icon: 'file', text: 'Menores: autorización firmada del tutor.' },
]

export const EQUIPO_INCLUIDO = [
  'Marcadora',
  'Máscara',
  'Chaleco',
  'Bolas (según paquete)',
  'CO₂ / aire',
  'Briefing',
]

export const EQUIPO_NO_INCLUIDO = [
  'Guantes',
  'Rodilleras',
  'Ropa de cambio',
  'Comida',
]

export const RESENAS = [
  {
    alias: 'TacticalGDL',
    inicial: 'T',
    rating: 5,
    fecha: 'Mar 2026',
    texto:
      'El mejor campo de la zona metropolitana. Los bunkers están increíbles y el staff es súper profesional.',
  },
  {
    alias: 'PelotónNorte',
    inicial: 'P',
    rating: 5,
    fecha: 'Feb 2026',
    texto:
      'Llevamos al equipo corporativo y fue un éxito total. La reserva por AirNation fue rapidísima.',
  },
  {
    alias: 'SniperZapopan',
    inicial: 'S',
    rating: 4,
    fecha: 'Ene 2026',
    texto:
      'Excelente experiencia táctica. El paquete premium vale cada peso con las 4 horas de juego.',
  },
]

export const CLABE_MOCK = '012180001234567890'

export function getPaquetes(modalidad: ModalidadId): PaqueteInfo[] {
  return PAQUETES_POR_MODALIDAD[modalidad]
}

export function findPaquete(
  modalidad: ModalidadId,
  id: PaqueteId
): PaqueteInfo | undefined {
  return getPaquetes(modalidad).find((p) => p.id === id)
}

export function precioPaquete(modalidad: ModalidadId, id: PaqueteId): number {
  return findPaquete(modalidad, id)?.precio ?? 0
}

export function calcularTotal(
  modalidad: ModalidadId,
  paquete: PaqueteId | null,
  jugadores: number
): number {
  if (!paquete) return 0
  return precioPaquete(modalidad, paquete) * jugadores
}
