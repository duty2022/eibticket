'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader, Phone, ExternalLink } from 'lucide-react'

type Props = {
  order: any
}

export default function OrderActions({ order }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pantalla de éxito (cuando la orden ya está aprobada)
  // Se muestra como un overlay de pantalla completa para simular el cambio de pantalla
  if (order.status === 'approved') {
    const orderUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/order/${order.id}`
    const message = `¡Hola ${order.buyer_name}! 👋 Tu pago para *${order.event.title}* ha sido aprobado. Acá tenés tus pases QR: ${orderUrl}`
    const phone = order.buyer_phone?.replace(/\D/g, '')
    const whatsappUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : null

    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm shadow-green-100">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Orden Aprobada!</h1>
        <p className="text-gray-500 mb-8 max-w-sm">
          El pago fue verificado correctamente y los tickets ya están generados.
        </p>
        
        <div className="w-full max-w-sm space-y-3">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full py-4 bg-[#25D366] text-white font-bold rounded-2xl hover:bg-[#128C7E] transition shadow-lg shadow-green-100"
            >
              <Phone className="w-5 h-5" />
              Enviar por WhatsApp
            </a>
          )}
          
          <a
            href={orderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 w-full py-4 bg-blue-50 text-blue-600 font-bold rounded-2xl hover:bg-blue-100 transition"
          >
            <ExternalLink className="w-5 h-5" />
            Ver QR generado
          </a>
          
          <button
            onClick={() => router.push('/admin/ordenes')}
            className="w-full py-3 text-gray-400 font-medium hover:text-gray-600 transition mt-4"
          >
            Volver al listado
          </button>
        </div>
      </div>
    )
  }

  if (order.status !== 'reviewing' && order.status !== 'pending') {
    return null
  }

  const handleApprove = async () => {
    setLoading('approve')
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token

      const res = await fetch(`/api/orders/${order.id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      const result = await res.json()

      if (!res.ok) {
        setError(result.error || 'Error al aprobar la orden')
        setLoading(null)
        return
      }

      // Refresh server data to trigger the success screen
      router.refresh()
    } catch (err) {
      setError('Error de conexión al aprobar')
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

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h2 className="font-bold text-gray-900">Acciones</h2>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {!showRejectForm ? (
        <div className="flex flex-col gap-3">
          <button
            onClick={handleApprove}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 py-4 bg-green-600 text-white font-bold rounded-2xl hover:bg-green-700 disabled:opacity-60 transition text-lg shadow-sm shadow-green-100"
          >
            {loading === 'approve' ? (
              <Loader className="w-6 h-6 animate-spin" />
            ) : (
              <CheckCircle className="w-6 h-6" />
            )}
            Aprobar y generar QR
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-gray-200 text-gray-400 font-bold rounded-2xl hover:bg-gray-50 disabled:opacity-60 transition"
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
