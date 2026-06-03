'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Copy, CheckCircle, Upload } from 'lucide-react'

type PaymentInfo = {
  country_id: string
  label: string
  instructions: string
  holder: string
  amount: number
  currency: string
  currency_symbol: string
  reference: string
}

type Props = {
  orderId: string
  paymentInfo: PaymentInfo
  onReceiptUploaded: () => void
}

export default function PaymentInstructions({ orderId, paymentInfo, onReceiptUploaded }: Props) {
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { register, handleSubmit, watch } = useForm<{ receipt: FileList }>()
  const file = watch('receipt')

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = async (data: { receipt: FileList }) => {
    if (!data.receipt?.[0]) return

    setUploading(true)
    setUploadError(null)

    const formData = new FormData()
    formData.append('receipt', data.receipt[0])

    try {
      const res = await fetch(`/api/orders/${orderId}/receipt`, {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()

      if (!res.ok) {
        setUploadError(result.error || 'Error al subir el comprobante')
        return
      }

      setUploaded(true)
      onReceiptUploaded()
    } catch {
      setUploadError('Error de conexión. Intentá de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  if (uploaded) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-green-800">¡Comprobante enviado!</h3>
        <p className="text-green-700 mt-1">
          Revisaremos tu pago y recibirás tu ticket por WhatsApp en breve.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Instrucciones de pago</h2>
        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <p>1. Transferir a la cuenta que se te indica abajo.</p>
          <p>2. Subir el comprobante en la sección correspondiente.</p>
          <p>3. Toca el botón de ya pagué.</p>
        </div>
      </div>

      {/* Datos de transferencia */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">{paymentInfo.label}</p>
            <p className="text-lg font-mono font-bold text-gray-900">
              {paymentInfo.instructions}
            </p>
          </div>
          <button
            onClick={() => copyToClipboard(paymentInfo.instructions)}
            className="p-2 rounded-lg hover:bg-gray-200 transition text-gray-600"
          >
            {copied ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        <div>
          <p className="text-xs text-gray-500">Titular</p>
          <p className="font-semibold text-gray-800">{paymentInfo.holder}</p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Monto a transferir</p>
          <p className="text-2xl font-bold text-blue-600">
            {paymentInfo.currency_symbol} {paymentInfo.amount.toLocaleString('es')} {paymentInfo.currency}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-500">Referencia (ponela en el concepto)</p>
          <p className="font-mono font-bold text-gray-800">{paymentInfo.reference}</p>
        </div>
      </div>

      {/* Subir comprobante */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Subí tu comprobante de pago
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-400 transition">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              accept="image/*,.pdf"
              {...register('receipt', { required: true })}
              className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-blue-50 file:text-blue-700 file:font-semibold hover:file:bg-blue-100"
            />
            {file?.[0] && (
              <p className="mt-2 text-sm text-green-600 font-medium">
                ✓ {file[0].name}
              </p>
            )}
          </div>
        </div>

        {uploadError && (
          <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{uploadError}</p>
        )}

        <button
          type="submit"
          disabled={!file?.[0] || uploading}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {uploading ? 'Enviando...' : '✓ Ya pagué — enviar comprobante'}
        </button>
      </form>
    </div>
  )
}
