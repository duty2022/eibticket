import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { Event } from '@/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Calendar, Ticket } from 'lucide-react'

// Forzar renderizado dinámico para evitar errores de Supabase Key en el build
export const dynamic = 'force-dynamic'

async function getPublishedEvents(): Promise<Event[]> {
  try {
    const { data } = await supabaseAdmin
      .from('events')
      .select('*, ticket_types(*), country:countries(*)')
      .eq('status', 'published')
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })

    return data || []
  } catch (error) {
    console.error('Error fetching events:', error)
    return []
  }
}

export default async function HomePage() {
  const events = await getPublishedEvents()

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Tikzet</span>
          </div>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Acceso admin
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Eventos</h1>
        <p className="text-gray-500 mb-8">Conseguí tus tickets de forma rápida y segura</p>

        {events.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Ticket className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No hay eventos disponibles por ahora</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {events.map((event) => {
              const minPrice = event.ticket_types?.length
                ? Math.min(...event.ticket_types.map((t) => t.price))
                : 0
              const soldOut = event.ticket_types?.every((t) => t.sold >= t.capacity)

              return (
                <Link
                  key={event.id}
                  href={`/eventos/${event.id}`}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group"
                >
                  {event.banner_url ? (
                    <img
                      src={event.banner_url}
                      alt={event.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                      <Ticket className="w-12 h-12 text-white opacity-50" />
                    </div>
                  )}
                  <div className="p-5">
                    <h2 className="text-lg font-bold text-gray-900 mb-3">{event.title}</h2>
                    <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 flex-shrink-0" />
                        <span>
                          {format(new Date(event.starts_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      {soldOut ? (
                        <span className="text-red-500 font-semibold text-sm">Agotado</span>
                      ) : (
                        <span className="text-blue-600 font-bold">
                          {minPrice === 0
                            ? 'Gratis'
                            : `Desde ${event.country?.currency_symbol}${minPrice.toLocaleString('es')}`}
                        </span>
                      )}
                      <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-medium">
                        {soldOut ? 'Sin lugares' : 'Comprar'}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
