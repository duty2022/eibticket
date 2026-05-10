import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import Image from 'next/image'

async function getTicket(codigo: string) {
  const { data } = await supabaseAdmin
    .from('tickets')
    .select('*, event:events(title, starts_at, location, banner_url), ticket_type:ticket_types(name)')
    .eq('qr_code', codigo)
    .single()
  return data
}

export default async function TicketPage({ params }: { params: { codigo: string } }) {
  const ticket = await getTicket(params.codigo)
  if (!ticket) notFound()

  const isValid = ticket.status === 'valid'
  const isUsed = ticket.status === 'used'

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Status banner */}
        <div className={`rounded-2xl p-5 mb-4 text-center ${
          isValid
            ? 'bg-green-500 text-white'
            : isUsed
            ? 'bg-gray-700 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {isValid && <CheckCircle className="w-10 h-10 mx-auto mb-2" />}
          {isUsed && <AlertCircle className="w-10 h-10 mx-auto mb-2" />}
          {!isValid && !isUsed && <XCircle className="w-10 h-10 mx-auto mb-2" />}
          <p className="text-xl font-bold">
            {isValid ? '✅ Ticket válido' : isUsed ? '⚠️ Ya utilizado' : '❌ No válido'}
          </p>
          {isUsed && ticket.validated_at && (
            <p className="text-sm opacity-80 mt-1">
              Usado el {format(new Date(ticket.validated_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
            </p>
          )}
        </div>

        {/* Ticket card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {ticket.event?.banner_url && (
            <img
              src={ticket.event.banner_url}
              alt={ticket.event.title}
              className="w-full h-36 object-cover"
            />
          )}
          <div className="p-5 space-y-4">
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-1">Evento</p>
              <h1 className="text-xl font-bold text-gray-900">{ticket.event?.title}</h1>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>{format(new Date(ticket.event.starts_at), "EEEE d 'de' MMMM yyyy", { locale: es })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>{format(new Date(ticket.event.starts_at), 'HH:mm')} hs</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span>{ticket.event?.location}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Tipo</span>
                <span className="font-semibold text-gray-900">{ticket.ticket_type?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Titular</span>
                <span className="font-semibold text-gray-900">{ticket.attendee_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Código</span>
                <span className="font-mono text-xs text-gray-600">{ticket.qr_code}</span>
              </div>
            </div>

            {/* QR */}
            {ticket.qr_url && isValid && (
              <div className="flex justify-center pt-2">
                <img
                  src={ticket.qr_url}
                  alt="QR del ticket"
                  className="w-40 h-40"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
