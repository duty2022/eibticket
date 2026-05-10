export const dynamic = "force-dynamic"
export const revalidate = 0

import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Search } from 'lucide-react'
import { headers } from 'next/headers'

const statusMap: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente',     color: 'bg-yellow-100 text-yellow-700' },
  reviewing: { label: 'Para revisar',  color: 'bg-blue-100 text-blue-700' },
  approved:  { label: 'Aprobado',      color: 'bg-green-100 text-green-700' },
  rejected:  { label: 'Rechazado',     color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Cancelado',     color: 'bg-gray-100 text-gray-600' },
}

async function getOrders(status?: string) {
  // Forzamos la consulta a Supabase sin cache
  let query = supabaseAdmin
    .from('orders')
    .select('*, event:events(title), ticket_type:ticket_types(name)')
    .order('created_at', { ascending: false })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data } = await query
  return data || []
}

export default async function OrdenesPage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  // Llamar a headers() asegura que Next.js no cachee la página de forma estática
  headers();
  
  const status = searchParams.status || 'all'
  const orders = await getOrders(status)

  const tabs = [
    { key: 'all', label: 'Todas' },
    { key: 'reviewing', label: 'Para revisar' },
    { key: 'approved', label: 'Aprobadas' },
    { key: 'pending', label: 'Pendientes' },
    { key: 'rejected', label: 'Rechazadas' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Órdenes</h1>
        <p className="text-gray-500 text-sm mt-1">Gestioná los pagos y aprobá los tickets</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map(tab => (
          <Link
            key={tab.key}
            href={`/admin/ordenes?status=${tab.key}`}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              status === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Lista */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {orders.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No hay órdenes con este filtro</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((order: any) => (
              <Link
                key={order.id}
                href={`/admin/ordenes/${order.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-900 truncate">{order.buyer_name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${statusMap[order.status]?.color}`}>
                      {statusMap[order.status]?.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {order.event?.title} · {order.ticket_type?.name} · x{order.quantity}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {format(new Date(order.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-bold text-gray-900">
                    {order.currency === 'ARS' ? '$' : order.currency === 'MXN' ? '$' : '₡'}
                    {order.total_price.toLocaleString('es')}
                  </p>
                  <p className="text-xs text-gray-400">{order.currency}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
