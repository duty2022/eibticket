export const dynamic = "force-dynamic"
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { CalendarDays, Ticket, CheckCircle, Clock, TrendingUp } from 'lucide-react'

async function getDashboardStats() {
  const [events, orders, tickets] = await Promise.all([
    supabaseAdmin.from('events').select('id, status', { count: 'exact' }),
    supabaseAdmin.from('orders').select('id, status, total_price, currency', { count: 'exact' }),
    supabaseAdmin.from('tickets').select('id, status', { count: 'exact' }),
  ])

  const allOrders = orders.data || []
  const pendingOrders = allOrders.filter(o => o.status === 'reviewing').length
  const approvedOrders = allOrders.filter(o => o.status === 'approved').length
  const publishedEvents = (events.data || []).filter(e => e.status === 'published').length

  return {
    totalEvents: events.count || 0,
    publishedEvents,
    totalOrders: orders.count || 0,
    pendingOrders,
    approvedOrders,
    totalTickets: tickets.count || 0,
    validTickets: (tickets.data || []).filter(t => t.status === 'valid').length,
    usedTickets: (tickets.data || []).filter(t => t.status === 'used').length,
  }
}

async function getRecentOrders() {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*, event:events(title), ticket_type:ticket_types(name)')
    .order('created_at', { ascending: false })
    .limit(5)
  return data || []
}

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([
    getDashboardStats(),
    getRecentOrders(),
  ])

  const statusMap: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700' },
    reviewing: { label: 'Para revisar', color: 'bg-blue-100 text-blue-700' },
    approved: { label: 'Aprobado', color: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-600' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Resumen general de tu plataforma</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Eventos activos',
            value: stats.publishedEvents,
            sub: `${stats.totalEvents} total`,
            icon: CalendarDays,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Para revisar',
            value: stats.pendingOrders,
            sub: `${stats.totalOrders} órdenes total`,
            icon: Clock,
            color: 'text-orange-600',
            bg: 'bg-orange-50',
          },
          {
            label: 'Órdenes aprobadas',
            value: stats.approvedOrders,
            sub: 'pagos confirmados',
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-50',
          },
          {
            label: 'Tickets validados',
            value: stats.usedTickets,
            sub: `${stats.validTickets} por usar`,
            icon: Ticket,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
          },
        ].map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Órdenes recientes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Órdenes recientes</h2>
          <Link href="/admin/ordenes" className="text-sm text-blue-600 hover:underline">
            Ver todas →
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentOrders.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-400">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p>Aún no hay órdenes</p>
            </div>
          ) : (
            recentOrders.map((order: any) => (
              <Link
                key={order.id}
                href={`/admin/ordenes/${order.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium text-gray-900">{order.buyer_name}</p>
                  <p className="text-sm text-gray-500">{order.event?.title} · {order.ticket_type?.name}</p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusMap[order.status]?.color}`}>
                    {statusMap[order.status]?.label}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.created_at).toLocaleDateString('es')}
                  </p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/admin/eventos/nuevo"
          className="bg-blue-600 text-white rounded-2xl p-5 font-bold hover:bg-blue-700 transition text-center"
        >
          + Crear evento
        </Link>
        <Link
          href="/admin/scanner"
          className="bg-white border-2 border-gray-200 text-gray-700 rounded-2xl p-5 font-bold hover:border-blue-300 transition text-center"
        >
          📱 Abrir scanner
        </Link>
      </div>
    </div>
  )
}
