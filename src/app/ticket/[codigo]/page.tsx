export const dynamic = "force-dynamic"
export const revalidate = 0

import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Calendar, Clock, CheckCircle, XCircle, AlertCircle, Ticket } from 'lucide-react'
import TicketClientActions from './TicketClientActions'

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
  
  const qrData = `https://eibticket.vercel.app/validate/${ticket.qr_code}`
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(qrData)}`

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Status banner */}
        <div className={`rounded-t-2xl p-6 text-center shadow-lg ${
          isValid
            ? 'bg-green-500 text-white'
            : isUsed
            ? 'bg-gray-700 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {isValid && <CheckCircle className="w-12 h-12 mx-auto mb-2" />}
          {isUsed && <AlertCircle className="w-12 h-12 mx-auto mb-2" />}
          {!isValid && !isUsed && <XCircle className="w-12 h-12 mx-auto mb-2" />}
          <p className="text-2xl font-black tracking-tight">
            {isValid ? 'Ticket válido' : isUsed ? 'Ticket usado' : 'Ticket inválido'}
          </p>
        </div>

        {/* Ticket body */}
        <div className="bg-white rounded-b-2xl shadow-xl overflow-hidden border-x border-b border-gray-100">
          {ticket.event?.banner_url && (
            <img 
              src={ticket.event.banner_url} 
              alt="Evento" 
              className="w-full h-32 object-cover"
            />
          )}
          
          <div className="p-6 space-y-6">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Evento</p>
              <h1 className="text-xl font-black text-gray-900 leading-tight">{ticket.event?.title}</h1>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Fecha</span>
                </div>
                <p className="text-sm font-bold text-gray-800">
                  {format(new Date(ticket.event.starts_at), "d 'de' MMMM", { locale: es })}
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gray-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Hora</span>
                </div>
                <p className="text-sm font-bold text-gray-800">
                  {format(new Date(ticket.event.starts_at), 'HH:mm')} hs
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Lugar</span>
              </div>
              <p className="text-sm font-bold text-gray-800">{ticket.event?.location}</p>
            </div>

            <div className="border-t border-dashed border-gray-200 pt-6 flex flex-col items-center gap-4">
              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-gray-900 uppercase">{ticket.attendee_name}</p>
                <p className="text-[10px] text-gray-400 font-mono tracking-widest">{ticket.qr_code}</p>
              </div>

              {/* QR Code */}
              {isValid && (
                <div className="bg-white p-3 rounded-2xl border-2 border-gray-50 shadow-inner">
                  <img
                    id="ticket-qr"
                    src={qrImageUrl}
                    alt="QR Code"
                    className="w-48 h-48 sm:w-56 sm:h-56"
                    loading="eager"
                  />
                </div>
              )}
              
              {!isValid && (
                <div className="py-10 text-gray-300">
                  <Ticket className="w-20 h-20 opacity-20" />
                </div>
              )}

              {isValid && (
                <TicketClientActions 
                  qrUrl={qrImageUrl} 
                  ticketName={ticket.attendee_name} 
                  eventName={ticket.event?.title || 'Evento'} 
                />
              )}
            </div>
            
            <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
              <span className="text-[10px] font-bold text-gray-400 uppercase">Categoría</span>
              <span className="text-xs font-black text-gray-900">{ticket.ticket_type?.name}</span>
            </div>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-gray-400 mt-6 font-medium uppercase tracking-tighter">
          Presentá este QR en la entrada para ingresar
        </p>
      </div>
    </main>
  )
}
