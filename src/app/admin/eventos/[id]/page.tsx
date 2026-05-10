import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, MapPin, Users, ArrowLeft, ExternalLink, Ticket, CheckCircle, ShoppingCart } from 'lucide-react'
import DeleteEventButton from './DeleteEventButton'

async function getEventData(id: string) {
  const { data: event } = await supabaseAdmin
    .from('events')
    .select('*, ticket_types(*)')
    .eq('id', id)
    .single()

  if (!event) return null

  // CONTAMOS TICKETS REALES DE LA BASE DE DATOS
  const { data: allTickets } = await supabaseAdmin
    .from('tickets')
    .select('status')
    .eq('event_id', id)

  const stats = {
    total: allTickets?.length || 0,
    used: allTickets?.filter(t => t.status === 'used').length || 0,
    confirmed: allTickets?.filter(t => t.status === 'confirmed').length || 0
  }

  return { event, stats }
}

export default async function EventoDetailPage({ params }: { params: { id: string } }) {
  const data = await getEventData(params.id)

  if (!data) {
    notFound()
  }

  const { event, stats } = data
  const totalCap = event.ticket_types?.reduce((s: number, t: any) => s + t.capacity, 0) || 0
  const attendanceRate = stats.total > 0 ? Math.round((stats.used / stats.total) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Link href="/admin/eventos" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition text-sm">
          <ArrowLeft className="w-4 h-4" />
          Volver a eventos
        </Link>
        <div className="flex items-center gap-3">
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
        {event.banner_url && (
          <img src={event.banner_url} alt={event.title} className="w-full h-64 object-cover" />
        )}
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
            <div className="flex flex-wrap gap-4 text-gray-500">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{format(new Date(event.starts_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <span className="font-medium">{event.location}</span>
              </div>
            </div>
          </div>

          {/* ESTADÍSTICAS CORREGIDAS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[32px] border-2 border-blue-50 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Emitidos</p>
              <p className="text-4xl font-black text-gray-900 mt-1">{stats.total}</p>
              <p className="text-[10px] text-gray-400 mt-1 font-bold">TICKETS GENERADOS</p>
            </div>

            <div className="bg-white p-6 rounded-[32px] border-2 border-green-50 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">En el salón</p>
              <p className="text-4xl font-black text-gray-900 mt-1">{stats.used}</p>
              <p className="text-[10px] text-gray-400 mt-1 font-bold">{attendanceRate}% DE ASISTENCIA</p>
            </div>

            <div className="bg-white p-6 rounded-[32px] border-2 border-purple-50 shadow-sm flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-gray-500 text-xs font-black uppercase tracking-widest">Ausentes</p>
              <p className="text-4xl font-black text-gray-900 mt-1">{stats.total - stats.used}</p>
              <p className="text-[10px] text-gray-400 mt-1 font-bold font-bold uppercase tracking-widest">FALTAN LLEGAR</p>
            </div>
          </div>

          {/* DETALLE POR CATEGORÍA */}
          <div className="space-y-4">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Ticket className="w-5 h-5 text-blue-600" />
              Categorías
            </h2>
            <div className="grid gap-4">
              {event.ticket_types?.map((ticket: any) => (
                <div key={ticket.id} className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="font-black text-gray-900 text-lg">{ticket.name}</p>
                    <p className="text-sm font-bold text-gray-500">Precio: ${ticket.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-gray-900">{ticket.capacity} cupos</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
