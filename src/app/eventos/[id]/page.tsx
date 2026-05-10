export const dynamic = "force-dynamic"

import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Calendar, Clock, Users } from 'lucide-react'
import BuyTicketForm from './BuyTicketForm'

async function getEvent(id: string) {
  const { data } = await supabaseAdmin
    .from('events')
    .select('*, ticket_types(*), country:countries(*)')
    .eq('id', id)
    .eq('status', 'published')
    .single()
  return data
}

export default async function EventPage({ params }: { params: { id: string } }) {
  const event = await getEvent(params.id)
  if (!event) notFound()

  const totalCapacity = event.ticket_types?.reduce((sum: number, t: any) => sum + t.capacity, 0) || 0
  const totalSold = event.ticket_types?.reduce((sum: number, t: any) => sum + t.sold, 0) || 0
  const remaining = totalCapacity - totalSold
  const soldOutPercent = totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Banner */}
      {event.banner_url ? (
        <div className="w-full h-56 sm:h-72 overflow-hidden">
          <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-full h-56 sm:h-72 bg-gradient-to-br from-blue-500 to-indigo-700" />
      )}

      <div className="max-w-2xl mx-auto px-4 -mt-8 pb-12">
        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-5">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h1>

          <div className="space-y-2.5 text-sm text-gray-600 mb-5">
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>{format(new Date(event.starts_at), "EEEE d 'de' MMMM yyyy", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>{format(new Date(event.starts_at), 'HH:mm')} hs</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span>{event.location}{event.address ? ` — ${event.address}` : ''}</span>
            </div>
            {totalCapacity > 0 && (
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span>{remaining > 0 ? `${remaining} lugares disponibles` : 'Sin lugares disponibles'}</span>
              </div>
            )}
          </div>

          {/* Barra de capacidad */}
          {totalCapacity > 0 && (
            <div className="mb-5">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${soldOutPercent}%` }}
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">{soldOutPercent}% vendido</p>
            </div>
          )}

          {/* Descripción */}
          {event.description && (
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
              {event.description}
            </p>
          )}
        </div>

        {/* Formulario de compra */}
        <BuyTicketForm event={event} />
      </div>
    </main>
  )
}
