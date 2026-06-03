'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Loader, Phone } from 'lucide-react'

type Props = {
  order: any
}

export default function OrderActions({ order }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (order.status === 'approved') {
    const orderUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/order/${order.id}`
    const message = `¡Hola! Tu pago ha sido aprobado. Acá tenés tus pases para ${order.event.title}: ${orderUrl}`
    const phone = order.buyer_phone?.replace(/\D/g, '')
    const whatsappUrl = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
      : null

    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center space-y-4">
        <div>
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="font-semibold text-green-800">Orden aprobada</p>
          <p className="text-sm text-green-600">Los pases QR ya están disponibles.</p>
        </div>
        
        {whatsappUrl ? (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] text-white font-bold rounded-xl hover:bg-[#128C7E] transition shadow-sm"
          >
            <Phone className="w-5 h-5" />
            Enviar pases por WhatsApp
          </a>
        ) : (
          <p className="text-xs text-gray-500 italic">No se registró teléfono para esta orden.</p>
        )}
      </div>
    )
  }

  if (order.status !== 'reviewing') {
    return null
  }

  const handleApprove = async () => {
    setLoading('approve')
    setError(null)

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

    router.refresh()
    setLoading(null)
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

    // TODO: notificar al comprador por email

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
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-60 transition"
          >
            {loading === 'approve' ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            Aprobar y generar QR
          </button>
          <button
            onClick={() => setShowRejectForm(true)}
            disabled={!!loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-white border-2 border-red-200 text-red-600 font-bold rounded-xl hover:bg-red-50 disabled:opacity-60 transition"
          >
            <XCircle className="w-5 h-5" />
            Rechazar
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">¿Por qué rechazás este pago?</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Ej: El comprobante no corresponde al monto, el alias es incorrecto..."
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
