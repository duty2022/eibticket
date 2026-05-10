import Link from 'next/link'
import { CalendarDays, Ticket, Clock, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  const statCards = [
    { label: 'Eventos Activos', value: 0, icon: CalendarDays, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Órdenes Pendientes', value: 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Tickets Emitidos', value: 0, icon: Ticket, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Ingresos Totales', value: 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard de Emergencia</h1>
        <p className="text-gray-500">Modo de recuperación activo para Douglas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center">
        <h2 className="text-xl font-bold mb-4">¡Entraste, Douglas!</h2>
        <p className="text-gray-600 mb-8">El sistema de bypass está funcionando. Ahora puedo trabajar en arreglar la base de datos sin que estés bloqueado.</p>
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
