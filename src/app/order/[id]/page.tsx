import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Calendar, CheckCircle, Ticket, ExternalLink } from 'lucide-react'
import Link from 'next/link'

async function getOrder(id: string) {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('*, event:events(*), tickets(*)')
    .eq('id', id)
    .single()
  return order
}

export default async function OrderPage({ params }: { params: { id: string } }) {
  const order = await getOrder(params.id)
  if (!order || order.status !== 'approved') notFound()

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        {/* Encabezado de Éxito */}
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">¡Pases Listos!</h1>
          <p className="text-gray-500 font-medium">Tu pago ha sido confirmado correctamente.</p>
        </div>

        {/* Detalles del Evento */}
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Ticket className="w-24 h-24 rotate-12" />
          </div>
          
          <h2 className="text-xl font-black text-gray-900 mb-4 pr-12 leading-tight">
            {order.event.title}
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Calendar className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-medium">
                {format(new Date(order.event.starts_at), "EEEE d 'de' MMMM", { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-indigo-600" />
              </div>
              <span className="text-sm font-medium truncate">{order.event.location}</span>
            </div>
          </div>
        </div>

        {/* Lista de Pases Estilo Ticket */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Mis Pases</h3>
          
          {order.tickets.map((ticket: any, index: number) => (
            <div key={ticket.id} className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden transition-all hover:shadow-md">
              <div className="p-5 flex items-center justify-between bg-gray-50/50">
                <div>
                  <p className="text-[10px] font-bold text-indigo-600 uppercase mb-0.5">Pase {index + 1}</p>
                  <p className="font-black text-gray-900">{ticket.attendee_name}</p>
                </div>
                <Link 
                  href={`/ticket/${ticket.qr_code}`}
                  className="w-10 h-10 bg-white border border-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:border-indigo-100 transition shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
              
              <div className="p-6 flex flex-col items-center gap-4">
                {ticket.qr_url ? (
                  <div className="relative">
                    <img 
                      src={ticket.qr_url} 
                      alt="Código QR" 
                      className="w-48 h-48 bg-white p-2 rounded-2xl shadow-inner border border-gray-50"
                    />
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                      <p className="text-[9px] font-mono font-bold text-gray-400 tracking-widest uppercase">
                        {ticket.qr_code.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-gray-50 animate-pulse rounded-2xl flex items-center justify-center">
                    <Ticket className="w-8 h-8 text-gray-200 animate-bounce" />
                  </div>
                )}
                
                <Link 
                  href={`/ticket/${ticket.qr_code}`}
                  className="mt-4 w-full py-3 bg-gray-900 text-white text-center text-xs font-bold rounded-xl hover:bg-gray-800 transition active:scale-95"
                >
                  Ver Detalle y Descargar
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="py-8 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            EIB Latinoamérica • Tikzet
          </p>
        </div>
      </div>
    </main>
  )
}
