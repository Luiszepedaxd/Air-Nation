export type ModalidadId = 'gotcha' | 'airsoft'

export type PaqueteId = 'basico' | 'estandar' | 'premium'

export type MetodoPago = 'tarjeta' | 'transferencia' | 'efectivo'

export type ReservaPaso = 1 | 2 | 3 | 'confirmado'

export type DisponibilidadDia = 'disponible' | 'pocos' | 'lleno'

export interface ReservaState {
  paso: ReservaPaso
  modalidad: ModalidadId
  fecha: Date | null
  horario: string
  jugadores: number
  paquete: PaqueteId | null
  nombre: string
  telefono: string
  email: string
  notas: string
  cuentaAirNation: boolean
  metodoPago: MetodoPago
  cargando: boolean
  numeroReserva: string | null
}

export interface PaqueteInfo {
  id: PaqueteId
  modalidad: ModalidadId
  label: string
  badge: string
  precio: number
  duracion: string
  includes: string[]
  nota: string
  popular?: boolean
  destacado?: string
}
