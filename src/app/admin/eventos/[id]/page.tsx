import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDays, MapPin, Users, ArrowLeft, ExternalLink, Ticket } from 'lucide-react'

async function getEvent(id: string) {
  const { data } = await supabaseAdmin
    .from('events')
    .select('*, ticket_types(*)')
    .eq('id', id)
    .single()
  return data
}

export default async function EventoDetailPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)

  if (!event) {
    notFound()
  }

  const totalSold = event.ticket_types?.reduce((s: number, t: any) => s + t.sold, 0) || 0
  const totalCap = event.ticket_types?.reduce((s: number, t: any) => s + t.capacity, 0) || 0

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <Link href="/admin/eventos" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition text-sm">
          <ArrowLeft className="w-4 h-4" />
          Volver a eventos
        </Link>
        <Link 
          href={`/eventos/${event.id}`}
          target="_blank"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition text-sm font-semibold"
        >
          Ver página pública
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {event.banner_url && (
          <img src={event.banner_url} alt={event.title} className="w-full h-64 object-cover" />
        )}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
            <div className="flex flex-wrap gap-4 text-gray-500">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-500" />
                <span>{format(new Date(event.starts_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                <span>{event.location}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <p className="text-blue-600 text-xs font-bold uppercase tracking-wider">Tickets Vendidos</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{totalSold}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
              <p className="text-green-600 text-xs font-bold uppercase tracking-wider">Capacidad Total</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{totalCap}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
              <p className="text-purple-600 text-xs font-bold uppercase tracking-wider">Status</p>
              <p className="text-2xl font-bold text-purple-900 mt-1 capitalize">{event.status}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-xl font-bold text-gray-900">Tickets</h2>
            <div className="grid gap-3">
              {event.ticket_types?.map((ticket: any) => (
                <div key={ticket.id} className="border border-gray-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl text-gray-400">
                      <Ticket className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{ticket.name}</p>
                      <p className="text-sm text-gray-500">${ticket.price} • {ticket.sold}/{ticket.capacity} vendidos</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {event.description && (
            <div className="space-y-3">
              <h2 className="text-xl font-bold text-gray-900">Descripción</h2>
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
