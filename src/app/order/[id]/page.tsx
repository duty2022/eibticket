import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { MapPin, Calendar, CheckCircle } from 'lucide-react'

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
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">¡Pago Confirmado!</h1>
          <p className="text-gray-500">Acá tenés tus pases para el evento.</p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{order.event.title}</h2>
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3 text-gray-600">
              <Calendar className="w-5 h-5 text-indigo-500" />
              <span>{format(new Date(order.event.starts_at), "EEEE d 'de' MMMM, HH:mm'hs'", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <MapPin className="w-5 h-5 text-indigo-500" />
              <span>{order.event.location}</span>
            </div>
          </div>

          <div className="space-y-6">
            {order.tickets.map((ticket: any, index: number) => (
              <div key={ticket.id} className="border-t border-gray-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Pase {index + 1}</p>
                    <p className="font-bold text-gray-900">{ticket.attendee_name}</p>
                  </div>
                  <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {order.event.title}
                  </span>
                </div>
                
                {ticket.qr_url ? (
                  <div className="flex flex-col items-center gap-4 bg-gray-50 p-6 rounded-2xl">
                    <img 
                      src={ticket.qr_url} 
                      alt={`QR de ${ticket.attendee_name}`} 
                      className="w-48 h-48 bg-white p-2 rounded-xl shadow-sm"
                    />
                    <p className="text-xs font-mono text-gray-400 uppercase">{ticket.qr_code}</p>
                  </div>
                ) : (
                  <p className="text-center text-sm text-gray-400 italic py-4">Generando QR...</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-gray-400">
          Presentá estos códigos QR en la entrada del evento.
        </p>
      </div>
    </main>
  )
}
