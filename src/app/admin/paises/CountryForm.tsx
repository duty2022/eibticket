'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Plus } from 'lucide-react'

const schema = z.object({
  id: z.string().length(2, 'Código de 2 letras (ej: CO)').toUpperCase(),
  name: z.string().min(2, 'Requerido'),
  currency: z.string().length(3, 'Código de 3 letras (ej: COP)').toUpperCase(),
  currency_symbol: z.string().min(1, 'Requerido'),
  payment_label: z.string().min(1, 'Requerido'),
  payment_instructions: z.string().min(1, 'Requerido'),
  payment_holder: z.string().min(1, 'Requerido'),
})

type FormData = z.infer<typeof schema>

export default function CountryForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    const { error: insertError } = await supabase
      .from('countries')
      .insert({
        id: data.id.toUpperCase(),
        name: data.name,
        currency: data.currency.toUpperCase(),
        currency_symbol: data.currency_symbol,
        payment_label: data.payment_label,
        payment_instructions: data.payment_instructions,
        payment_holder: data.payment_holder,
      })

    if (insertError) {
      if (insertError.message.includes('duplicate')) {
        setError('Ya existe un país con ese código')
      } else {
        setError(insertError.message)
      }
      setLoading(false)
      return
    }

    reset()
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-blue-300 hover:text-blue-600 transition font-medium"
      >
        <Plus className="w-4 h-4" />
        Agregar nuevo país
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
      <h2 className="font-bold text-gray-900">Nuevo país</h2>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Código *</label>
          <input
            {...register('id')}
            placeholder="CO"
            maxLength={2}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.id && <p className="text-red-500 text-xs mt-1">{errors.id.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">País *</label>
          <input
            {...register('name')}
            placeholder="Colombia"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Moneda *</label>
          <input
            {...register('currency')}
            placeholder="COP"
            maxLength={3}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.currency && <p className="text-red-500 text-xs mt-1">{errors.currency.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Símbolo *</label>
          <input
            {...register('currency_symbol')}
            placeholder="$"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.currency_symbol && <p className="text-red-500 text-xs mt-1">{errors.currency_symbol.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Tipo de pago *</label>
        <input
          {...register('payment_label')}
          placeholder="ej: Nequi / Bancolombia"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.payment_label && <p className="text-red-500 text-xs mt-1">{errors.payment_label.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Dato de transferencia *</label>
        <input
          {...register('payment_instructions')}
          placeholder="número, alias, CBU, etc."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.payment_instructions && <p className="text-red-500 text-xs mt-1">{errors.payment_instructions.message}</p>}
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Titular *</label>
        <input
          {...register('payment_holder')}
          placeholder="ej: EIB Latinoamérica CO"
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.payment_holder && <p className="text-red-500 text-xs mt-1">{errors.payment_holder.message}</p>}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {loading ? 'Guardando...' : 'Agregar país'}
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); reset() }}
          className="px-5 py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
