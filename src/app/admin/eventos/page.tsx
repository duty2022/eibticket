export const dynamic = "force-dynamic"
import { supabaseAdmin } from '@/lib/supabase'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Plus, CalendarDays, MapPin, Users } from 'lucide-react'

async function getEvents() {
  const { data } = await supabaseAdmin
    .from('events')
    .select('*, ticket_types(*)')
    .order('starts_at', { ascending: false })
  return data || []
}

const statusMap: Record<string, { label: string; color: string }> = {
  draft:     { label: 'Borrador',   color: 'bg-gray-100 text-gray-600' },
  published: { label: 'Publicado',  color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelado',  color: 'bg-red-100 text-red-600' },
  finished:  { label: 'Finalizado', color: 'bg-blue-100 text-blue-600' },
}

export default async function EventosPage() {
  const events = await getEvents()

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
          <p className="text-gray-500 text-sm mt-1">Gestioná todos tus eventos</p>
        </div>
        <Link
          href="/admin/eventos/nuevo"
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo evento
        </Link>
      </div>

      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 text-center text-gray-400">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Aún no creaste eventos</p>
            <Link href="/admin/eventos/nuevo" className="text-blue-600 text-sm mt-2 inline-block hover:underline">
              Crear el primero →
            </Link>
          </div>
        ) : (
          events.map((event: any) => {
            const totalSold = event.ticket_types?.reduce((s: number, t: any) => s + t.sold, 0) || 0
            const totalCap = event.ticket_types?.reduce((s: number, t: any) => s + t.capacity, 0) || 0
            const status = statusMap[event.status]

            return (
              <Link
                key={event.id}
                href={`/admin/eventos/${event.id}`}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 hover:shadow-md transition"
              >
                {event.banner_url ? (
                  <img
                    src={event.banner_url}
                    alt={event.title}
                    className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex-shrink-0 flex items-center justify-center">
                    <CalendarDays className="w-8 h-8 text-white opacity-60" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb%1">
                    <h2 className="font-bold text-gray-900 truncate">{event.title}</h2>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>{format(new Date(event.starts_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>{totalSold} / {totalCap} tickets vendidos</span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
