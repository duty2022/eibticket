export const dynamic = 'force-dynamic'
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { CalendarDays, Ticket, CheckCircle, Clock, TrendingUp } from 'lucide-react'

async function getDashboardStats() {
  try {
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
  } catch (err) {
    console.error('Error fetching stats:', err)
    return {
      totalEvents: 0, publishedEvents: 0, totalOrders: 0, pendingOrders: 0,
      approvedOrders: 0, totalTickets: 0, validTickets: 0, usedTickets: 0
    }
  }
}

async function getRecentOrders() {
  try {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('*, event:events(title), ticket_type:ticket_types(name)')
      .order('created_at', { ascending: false })
      .limit(5)
    return data || []
  } catch (err) {
    return []
  }
}

export default async function AdminDashboard() {
  const stats = await getDashboardStats()
  const recentOrders = await getRecentOrders()

  const statCards = [
    { label: 'Eventos Activos', value: stats.publishedEvents, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Órdenes Pendientes', value: stats.pendingOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Tickets Emitidos', value: stats.totalTickets, icon: Ticket, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Ingresos Totales', value: stats.approvedOrders, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  const statusMap: any = {
    pending: { label: 'Pendiente', color: 'bg-gray-100 text-gray-600' },
    reviewing: { label: 'En Revisión', color: 'bg-amber-100 text-amber-600' },
    approved: { label: 'Aprobada', color: 'bg-emerald-100 text-emerald-600' },
    rejected: { label: 'Rechazada', color: 'bg-red-100 text-red-600' },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Resumen general de Tikzet</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={}>
                <stat.icon className={} />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Órdenes Recientes</h2>
          <Link href="/admin/ordenes" className="text-sm font-medium text-blue-600 hover:text-blue-700">
            Ver todas
          </Link>
        </div>
        <div className="divide-y divide-gray-100">
          {recentOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No hay órdenes registradas</div>
          ) : (
            recentOrders.map((order) => (
              <Link
                key={order.id}
                href={}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-medium text-gray-900">{order.buyer_name}</p>
                  <p className="text-sm text-gray-500">{order.event?.title} · {order.ticket_type?.name}</p>
                </div>
                <div className="text-right">
                  <span className={}>
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