export const dynamic = "force-dynamic"
export const revalidate = 0

import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import OrderActions from './OrderActions'
import { ArrowLeft, User, Mail, Phone, Calendar, Ticket, MessageCircle, RefreshCcw } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'

async function getOrder(id: string) {
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*, event:events(title, starts_at, location), ticket_type:ticket_types(name), tickets(*)')
    .eq('id', id)
    .single()
  return data
}

const statusMap: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendiente de pago',  color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  reviewing: { label: 'Comprobante recibido — revisar', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  approved:  { label: 'Aprobado ✓',         color: 'bg-green-100 text-green-700 border-green-200' },
  rejected:  { label: 'Rechazado',          color: 'bg-red-100 text-red-700 border-red-200' },
  cancelled: { label: 'Cancelado',          color: 'bg-gray-100 text-gray-600 border-gray-200' },
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  headers(); // Forzar no-cache
  const order = await getOrder(params.id)
  if (!order) notFound()

  const status = statusMap[order.status]

  return (
    <div className="max-w-2xl mx-auto space-y-5 pb-10">
      {/* Volver y Versión */}
      <div className="flex justify-between items-center">
        <Link href="/admin/ordenes" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" />
          Volver a órdenes
        </Link>
        <span className="text-[10px] text-gray-300 font-mono italic">v1.2-ws</span>
      </div>

      {/* Estado */}
      <div className={`border rounded-2xl px-5 py-4 ${status.color}`}>
        <p className="font-bold text-base">{status.label}</p>
        <p className="text-sm opacity-75 mt-0.5">
          Orden #{order.id.slice(0, 8).toUpperCase()} ·{' '}
          {format(new Date(order.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
        </p>
      </div>

      {/* Datos del comprador */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-gray-900 mb-1">Comprador</h2>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <User className="w-4 h-4 text-gray-400" />
          <span>{order.buyer_name}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <Mail className="w-4 h-4 text-gray-400" />
          <a href={`mailto:${order.buyer_email}`} className="text-blue-600 hover:underline">
            {order.buyer_email}
          </a>
        </div>
        {order.buyer_phone && (
          <div className="flex items-center gap-3 text-sm text-gray-700">
            <Phone className="w-4 h-4 text-gray-400" />
            <a href={`tel:${order.buyer_phone}`} className="text-blue-600 hover:underline">
              {order.buyer_phone}
            </a>
          </div>
        )}
      </div>

      {/* Detalle del pedido */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-gray-900 mb-1">Pedido</h2>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span>{order.event?.title}</span>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <Ticket className="w-4 h-4 text-gray-400" />
          <span>{order.ticket_type?.name} × {order.quantity}</span>
        </div>
        <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
          <span className="font-semibold text-gray-700">Total</span>
          <span className="text-xl font-bold text-gray-900">
            {order.currency === 'CRC' ? '₡' : '$'}{order.total_price.toLocaleString('es')} {order.currency}
          </span>
        </div>
      </div>

      {/* Comprobante */}
      {order.receipt_url && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-3">Comprobante de pago</h2>
          {order.receipt_url.endsWith('.pdf') ? (
            <a
              href={order.receipt_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
            >
              📄 Ver PDF
            </a>
          ) : (
            <a href={order.receipt_url} target="_blank" rel="noopener noreferrer">
              <img
                src={order.receipt_url}
                alt="Comprobante"
                className="w-full rounded-xl border border-gray-200 max-h-96 object-contain bg-gray-50"
              />
            </a>
          )}
          {order.receipt_uploaded_at && (
            <p className="text-xs text-gray-400 mt-2">
              Recibido el {format(new Date(order.receipt_uploaded_at), "d MMM yyyy, HH:mm", { locale: es })}
            </p>
          )}
        </div>
      )}

      {/* QR tickets generados */}
      {order.tickets?.some((t: any) => t.status === 'valid' || t.status === 'used') && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-bold text-gray-900 mb-3">Tickets generados</h2>
          <div className="space-y-4">
            {order.tickets.map((ticket: any) => {
              const ticketUrl = `https://eibticket.vercel.app/ticket/${ticket.qr_code}`
              const whatsappText = encodeURIComponent(
                `¡Hola ${order.buyer_name}! 👋 Acá tenés tu ticket para *${order.event?.title}*.\n\nPuedes verlo y descargar el QR aquí:\n${ticketUrl}`
              )
              const whatsappUrl = `https://wa.me/${order.buyer_phone?.replace(/\D/g, '')}?text=${whatsappText}`

              return (
                <div key={ticket.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0 last:pb-0">
                  <div className="min-w-0 flex-1 pr-4 text-left">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-bold text-gray-800 truncate">{ticket.attendee_name}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                        ticket.status === 'used' ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
                      }`}>
                        {ticket.status === 'used' ? 'Usado' : 'Válido'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-mono truncate">{ticket.qr_code.slice(0, 8)}...</p>
                    <a href={ticketUrl} target="_blank" className="text-[10px] text-blue-500 hover:underline block mt-1 truncate">
                      {ticketUrl}
                    </a>
                  </div>
                  
                  {order.buyer_phone && (
                    <a 
                      href={whatsappUrl}
                      target="_blank"
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-95"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Acciones */}
      <OrderActions order={order} />
    </div>
  )
}
