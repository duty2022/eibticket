'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader, Phone, ExternalLink, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type Props = {
  order: any
}

export default function OrderActions({ order }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados locales
  const [showSuccess, setShowSuccess] = useState(order.status === 'approved')
  const [localOrder, setLocalOrder] = useState(order)
  const [localTickets, setLocalTickets] = useState<any[]>(order.tickets || [])

  // Sincronizar si cambian las props
  useEffect(() => {
    setLocalOrder(order)
    setLocalTickets(order.tickets || [])
    setShowSuccess(order.status === 'approved')
  }, [order.id, order.status])

  const handleApprove = async () => {
    setLoading('approve')
    setError(null)

    try {
      const res = await fetch(`/api/orders/${order.id}/approve`, {
        method: 'POST',
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Error al aprobar la orden')
        setLoading(null)
        return
      }

      if (result.tickets) setLocalTickets(result.tickets)
      if (result.order) setLocalOrder(result.order)
      
      setShowSuccess(true)
    } catch (err) {
      setError('Error de conexión al aprobar. Por favor, revisá tu internet.')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    setLoading('reject')
    setError(null)

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'rejected',
        rejection_reason: rejectReason,
      })
      .eq('id', order.id)

    if (updateError) {
      setError('Error al rechazar la orden')
      setLoading(null)
      return
    }

    router.refresh()
    setLoading(null)
  }

  if (showSuccess) {
    const activeOrder = localOrder || order
    const orderUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/order/${activeOrder.id}`
    const message = `¡Hola ${activeOrder.buyer_name}! 👋 Tu pago para *${activeOrder.event?.title}* ha sido aprobado. Acá tenés tus pases QR: ${orderUrl}`
    const phone = activeOrder.buyer_phone?.replace(/\D/g, '')
    const whatsappUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : null

    const displayTickets = localTickets.length > 0 ? localTickets : activeOrder.tickets || []

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col p-6 overflow-y-auto animate-in fade-in zoom-in duration-300">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full py-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm shadow-green-100">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          
          <h2 className="text-2xl font-black text-gray-900 mb-2 text-center">¡Orden Aprobada!</h2>
          <p className="text-gray-500 text-center mb-8">Los pases ya están listos para compartir.</p>

          <div className="w-full space-y-4 mb-10">
            {displayTickets.map((t: any, i: number) => (
              <div key={t.id} className="relative bg-gray-50 border border-gray-100 rounded-2xl p-4 flex flex-col items-center shadow-sm">
                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mb-3">Pase {i + 1}</p>
                {t.qr_url ? (
                  <div className="relative group">
                    <img 
                      src={t.qr_url} 
                      alt="QR Code" 
                      className="w-48 h-48 rounded-xl shadow-inner bg-white p-2"
                    />
                    <a 
                      href={t.qr_url}
                      download={`ticket-${t.qr_code}.png`}
                      className="absolute bottom-2 right-2 p-2 bg-white/90 backdrop-blur shadow-md rounded-full text-gray-700 hover:text-indigo-600 transition"
                      title="Descargar QR"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ) : (
                  <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-xl flex items-center justify-center">
                    <Loader className="w-6 h-6 text-gray-300 animate-spin" />
                  </div>
                )}
                <p className="mt-3 font-mono text-[10px] text-gray-400">{t.qr_code}</p>
              </div>
            ))}
          </div>

          <div className="w-full space-y-3">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#128C7E] transition shadow-lg shadow-green-100"
              >
                <Phone className="w-5 h-5" />
                Enviar todo por WhatsApp
              </a>
            )}
            
            <Link 
              href={`/order/${activeOrder.id}`}
              target="_blank"
              className="flex items-center justify-center gap-3 w-full py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition"
            >
              <ExternalLink className="w-5 h-5" />
              Ver como el cliente
            </Link>
          </div>
        </div>

        <button 
          onClick={() => {
            setShowSuccess(false)
            router.refresh()
          }}
          className="mt-auto py-4 text-gray-400 text-sm font-medium hover:text-gray-600 transition flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la orden
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white border-t border-gray-100 p-6 space-y-4">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-3">
          <XCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {!showRejectForm ? (
        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={handleApprove}
            disabled={!!loading}
            className="w-full py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 disabled:opacity-60 transition shadow-lg shadow-green-100 flex items-center justify-center gap-2"
          >
            {loading === 'approve' ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                Aprobar y Generar QR
              </>
            )}
          </button>
          
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={!!loading}
            className="w-full py-4 bg-white text-red-600 font-bold rounded-2xl border-2 border-red-50 hover:bg-red-50 disabled:opacity-60 transition flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            Rechazar orden
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">¿Por qué rechazás este pago?</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ej: El comprobante no corresponde al monto..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 text-sm resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              disabled={!rejectReason.trim() || !!loading}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 disabled:opacity-60 transition"
            >
              {loading === 'reject' ? 'Rechazando...' : 'Confirmar rechazo'}
            </button>
            <button
              onClick={() => setShowRejectForm(false)}
              className="px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
