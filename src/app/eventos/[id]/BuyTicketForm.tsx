'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Event, TicketType } from '@/types'
import PaymentInstructions from '@/components/tickets/PaymentInstructions'
import { Minus, Plus, ChevronDown } from 'lucide-react'

const COUNTRIES = [
  { code: 'AR', name: 'Argentina', prefix: '+54', flag: '🇦🇷' },
  { code: 'MX', name: 'México', prefix: '+52', flag: '🇲🇽' },
  { code: 'CR', name: 'Costa Rica', prefix: '+506', flag: '🇨🇷' },
  { code: 'UY', name: 'Uruguay', prefix: '+598', flag: '🇺🇾' },
  { code: 'CL', name: 'Chile', prefix: '+56', flag: '🇨🇱' },
  { code: 'PY', name: 'Paraguay', prefix: '+595', flag: '🇵🇾' },
  { code: 'BO', prefix: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: 'CO', prefix: '+57', flag: '🇨🇴', name: 'Colombia' },
  { code: 'PE', prefix: '+51', flag: '🇵🇪', name: 'Perú' },
  { code: 'EC', prefix: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: 'VE', prefix: '+58', flag: '🇻🇪', name: 'Venezuela' },
  { code: 'ES', prefix: '+34', flag: '🇪🇸', name: 'España' },
  { code: 'US', prefix: '+1', flag: '🇺🇸', name: 'EEUU' },
]

const schema = z.object({
  buyer_name: z.string().min(2, 'Ingresá tu nombre completo'),
  buyer_email: z.string().email('Email inválido'),
  buyer_phone: z.string().min(6, 'Ingresá tu número de WhatsApp'),
  ticket_type_id: z.string().uuid('Seleccioná un tipo de pase'),
  quantity: z.number().min(1).max(10),
})

type FormData = z.infer<typeof schema>

type Props = {
  event: Event & { ticket_types: TicketType[]; country: any }
}

type Step = 'form' | 'payment' | 'done'

export default function BuyTicketForm({ event }: Props) {
  const defaultCountry = COUNTRIES.find(c => c.code === event.country_id) || COUNTRIES[0]
  const [countryPrefix, setCountryPrefix] = useState(defaultCountry.prefix)
  const [step, setStep] = useState<Step>('form')
  const [orderId, setOrderId] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const availableTypes = event.ticket_types?.filter(t => t.sold < t.capacity) || []
  const allSoldOut = availableTypes.length === 0

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      quantity: 1,
      ticket_type_id: availableTypes[0]?.id || '',
    },
  })

  const quantity = watch('quantity')
  const selectedTypeId = watch('ticket_type_id')
  const selectedType = event.ticket_types?.find(t => t.id === selectedTypeId)
  const available = selectedType ? (selectedType.capacity - selectedType.sold) : 0
  const maxAllowed = Math.min(10, available)
  const total = selectedType ? selectedType.price * quantity : 0

  // Ajustar cantidad si excede el máximo permitido al cambiar de tipo
  useEffect(() => {
    if (quantity > maxAllowed && maxAllowed > 0) {
      setValue('quantity', maxAllowed)
    }
  }, [maxAllowed, quantity, setValue])

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setApiError(null)

    // Normalizar número de teléfono: quitar no-dígitos y asegurar código de país
    const prefixDigits = countryPrefix.replace(/\D/g, '')
    let cleanNumber = data.buyer_phone.replace(/\D/g, '')
    
    // Evitar duplicar el código de área si el usuario ya lo escribió
    if (cleanNumber.startsWith(prefixDigits) && cleanNumber.length > prefixDigits.length + 5) {
      cleanNumber = cleanNumber.substring(prefixDigits.length)
    }
    
    const fullPhone = `${prefixDigits}${cleanNumber}`

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, buyer_phone: fullPhone, event_id: event.id }),
      })

      const result = await res.json()

      if (!res.ok) {
        setApiError(result.error || 'Error al procesar tu pedido')
        return
      }

      setOrderId(result.order.id)
      setPaymentInfo(result.payment_instructions)
      setStep('payment')
    } catch {
      setApiError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  if (allSoldOut) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-700 font-semibold">Este evento está agotado</p>
      </div>
    )
  }

  if (step === 'payment' && orderId && paymentInfo) {
    return (
      <PaymentInstructions
        orderId={orderId}
        paymentInfo={paymentInfo}
        onReceiptUploaded={() => setStep('done')}
      />
    )
  }

  if (step === 'done') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-green-800 mb-2">¡Todo listo!</h3>
        <p className="text-green-700">
          Revisaremos tu comprobante y te enviaremos el ticket con el código QR por WhatsApp.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-md p-6 space-y-5">
      <h2 className="text-lg font-bold text-gray-900">Comprar tickets</h2>

      {/* Tipo de ticket */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Tipo de ticket
        </label>
        <div className="space-y-2">
          {event.ticket_types?.map((type) => {
            const available = type.capacity - type.sold
            const isSoldOut = available <= 0
            return (
              <label
                key={type.id}
                className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition ${
                  selectedTypeId === type.id
                    ? 'border-blue-500 bg-blue-50'
                    : isSoldOut
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    value={type.id}
                    disabled={isSoldOut}
                    {...register('ticket_type_id')}
                    className="accent-blue-600"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{type.name}</p>
                    {type.description && (
                      <p className="text-xs text-gray-500">{type.description}</p>
                    )}
                    <p className="text-xs text-gray-400">{available} disponibles</p>
                  </div>
                </div>
                <span className="font-bold text-blue-600">
                  {type.price === 0
                    ? 'Gratis'
                    : `${event.country?.currency_symbol}${type.price.toLocaleString('es')}`}
                </span>
              </label>
            )
          })}
        </div>
        {errors.ticket_type_id && (
          <p className="text-red-500 text-xs mt-1">{errors.ticket_type_id.message}</p>
        )}
      </div>

      {/* Cantidad */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad</label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setValue('quantity', Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-xl font-bold w-8 text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => setValue('quantity', Math.min(maxAllowed, quantity + 1))}
            className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-30"
            disabled={quantity >= maxAllowed}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Datos del comprador */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700">Tus datos</h3>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">
            Nombre completo
          </label>
          <input
            {...register('buyer_name')}
            placeholder="Tu nombre"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          {errors.buyer_name && (
            <p className="text-red-500 text-xs mt-1">{errors.buyer_name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">
            Email
          </label>
          <input
            {...register('buyer_email')}
            type="email"
            placeholder="tu@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          {errors.buyer_email && (
            <p className="text-red-500 text-xs mt-1">{errors.buyer_email.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">
            WhatsApp (obligatorio)
          </label>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={countryPrefix}
                onChange={(e) => setCountryPrefix(e.target.value)}
                className="appearance-none bg-white border border-gray-200 rounded-xl px-3 py-3 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 font-medium cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.prefix}>
                    {c.flag} {c.prefix}
                  </option>
                ))}
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <ChevronDown size={14} />
              </div>
            </div>
            <input
              {...register('buyer_phone')}
              type="tel"
              placeholder="Número sin código de país"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          {errors.buyer_phone && (
            <p className="text-red-500 text-xs mt-1">{errors.buyer_phone.message}</p>
          )}
        </div>
      </div>

      {/* Total */}
      {selectedType && total > 0 && (
        <div className="bg-gray-50 rounded-xl p-4 flex justify-between items-center">
          <span className="text-gray-600 font-medium">Total</span>
          <span className="text-xl font-bold text-blue-600">
            {event.country?.currency_symbol}{total.toLocaleString('es')} {event.country?.currency}
          </span>
        </div>
      )}

      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {apiError}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition text-lg"
      >
        {loading ? 'Procesando...' : 'Continuar con el pago →'}
      </button>
    </form>
  )
}
