import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, MapPin, Users, ArrowLeft, ExternalLink, Ticket, CheckCircle, ShoppingCart, Pencil } from 'lucide-react'
import DeleteEventButton from './DeleteEventButton'

async function getEventData(id: string) {
  const { data: event } = await supabaseAdmin.from('events').select('*, ticket_types(*)').eq('id', id).single()
  if (!event) return null
  const { data: allTickets } = await supabaseAdmin.from('tickets').select('status').eq('event_id', id)
  const stats = {
    total: allTickets?.length || 0,
    used: allTickets?.filter(t => t.status === 'used').length || 0,
    confirmed: allTickets?.filter(t => t.status === 'confirmed').length || 0
  }
  return { event, stats }
}

export default async function EventoDetailPage({ params }: { params: { id: string } }) {
  const data = await getEventData(params.id)
  if (!data) notFound()
  const { event, stats } = data
  const attendanceRate = stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Link href="/admin/eventos" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition text-sm">
          <ArrowLeft className="w-4 h-4" />
          Volver a eventos
        </Link>
        <div className="flex items-center gap-3">
          <Link href={`/admin/eventos/${event.id}/edit`} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition text-sm">
            <Pencil className="w-4 h-4" />
            Editar
          </Link>
          <DeleteEventButton id={event.id} />
          <Link 
            href={`/eventos/${event.id}`}
            target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
          >
            Ver página pública
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {event.banner_url && <img src={event.banner_url} alt={event.title} className="w-full h-64 object-cover" />}
        <div className="p-8 space-y-8">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
              <span className={`text-xs px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                event.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {event.status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[32px] border-2 border-blue-50 shadow-sm flex flex-col items-center">
              <ShoppingCart className="w-6 h-6 text-blue-600 mb-2" />
              <p className="text-4xl font-black">{stats.total}</p>
              <p className="text-xs text-gray-500">EMITIDOS</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-green-50 shadow-sm flex flex-col items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
              <p className="text-4xl font-black">{stats.used}</p>
              <p className="text-xs text-gray-500">{attendanceRate}% ASISTENCIA</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border-2 border-purple-50 shadow-sm flex flex-col items-center">
              <Users className="w-6 h-6 text-purple-600 mb-2" />
              <p className="text-4xl font-black">{stats.total - stats.used}</p>
              <p className="text-xs text-gray-500">AUSENTES</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
