import { createDashboardSupabaseServerClient } from '@/app/dashboard/supabase-server'
import { PedidosClient } from './PedidosClient'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MisPedidosPage() {
  const supabase = createDashboardSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F7F7] px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center bg-[#111111]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" stroke="white" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M3 6h18M16 10a4 4 0 01-8 0" stroke="white" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-[1.2rem] font-extrabold uppercase text-[#111111]"
          style={{ fontFamily: "'Jost', sans-serif" }}>
          Mis pedidos
        </h1>
        <p className="mt-2 max-w-[280px] text-[13px] text-[#666666]"
          style={{ fontFamily: "'Lato', sans-serif" }}>
          Inicia sesión para ver el historial y estado de tus pedidos.
        </p>
        <div className="mt-6 flex flex-col gap-3 w-full max-w-[280px]">
          <Link href="/login?redirect=/store/pedidos"
            className="flex w-full items-center justify-center bg-[#CC4B37] py-3.5 text-[12px] font-extrabold uppercase tracking-wide text-white"
            style={{ fontFamily: "'Jost', sans-serif" }}>
            Iniciar sesión
          </Link>
          <Link href="/store"
            className="flex w-full items-center justify-center border border-[#EEEEEE] bg-white py-3.5 text-[12px] font-extrabold uppercase tracking-wide text-[#111111]"
            style={{ fontFamily: "'Jost', sans-serif" }}>
            Volver a la tienda
          </Link>
        </div>
      </div>
    )
  }

  const { data: orders } = await supabase
    .from('store_orders')
    .select(`
      id, order_number, metodo_pago, subtotal, descuento_monto,
      costo_envio, total, status_interno, transferencia_confirmada,
      comprobante_url, guia_numero, guia_paqueteria, direccion_envio, created_at
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const orderIds = (orders ?? []).map(o => o.id as string)
  const { data: items } = orderIds.length
    ? await supabase
        .from('store_order_items')
        .select('order_id, nombre, foto_url, precio_unit, cantidad, subtotal')
        .in('order_id', orderIds)
    : { data: [] }

  return (
    <PedidosClient
      orders={(orders ?? []) as Record<string, unknown>[]}
      items={(items ?? []) as Record<string, unknown>[]}
    />
  )
}
