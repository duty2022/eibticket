'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Upload } from 'lucide-react'
import { createEventWithBypass } from './actions'

const ticketTypeSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  price: z.number().min(0),
  capacity: z.number().int().min(1),
  description: z.string().optional(),
})

const schema = z.object({
  title: z.string().min(2, 'Título requerido'),
  description: z.string().optional(),
  location: z.string().min(2, 'Ubicación requerida'),
  address: z.string().optional(),
  starts_at: z.string().min(1, 'Fecha requerida'),
  ends_at: z.string().optional(),
  country_id: z.enum(['AR', 'MX', 'CR', 'PY']),
  status: z.enum(['draft', 'published']),
  payment_label: z.string().optional(),
  payment_instructions: z.string().optional(),
  payment_holder: z.string().optional(),
  ticket_types: z.array(ticketTypeSchema).min(1, 'Agregá al menos un tipo de ticket'),
})

type FormData = z.infer<typeof schema>

type Props = {
  initialData?: any
  eventId?: string
}

export default function EventForm({ initialData, eventId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bannerFile, setBannerFile] = useState<File | null>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(initialData?.banner_url || null)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {
      status: 'draft',
      country_id: 'AR',
      ticket_types: [{ name: 'General', price: 0, capacity: 100 }],
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'ticket_types' })

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
    }
  }

  const uploadBanner = async (file: File): Promise<string | null> => {
    const path = `banners/${Date.now()}-${file.name}`
    const { error } = await supabase.storage.from('tikzet').upload(path, file, { upsert: true })
    if (error) return null
    const { data } = supabase.storage.from('tikzet').getPublicUrl(path)
    return data.publicUrl
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    try {
      let banner_url = initialData?.banner_url || null
      if (bannerFile) {
        banner_url = await uploadBanner(bannerFile)
      }

      const eventData = {
        title: data.title,
        description: data.description,
        location: data.location,
        address: data.address,
        starts_at: data.starts_at,
        ends_at: data.ends_at || null,
        country_id: data.country_id,
        status: data.status,
        banner_url,
        payment_label: data.payment_label || null,
        payment_instructions: data.payment_instructions || null,
        payment_holder: data.payment_holder || null,
      }

      const ticketTypes = data.ticket_types.map(tt => ({
        ...tt,
        sold: 0
      }))

      const res = await createEventWithBypass(eventData, ticketTypes)

      if (!res.success) {
        throw new Error(res.error)
      }

      router.push('/admin/eventos')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error al guardar el evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Imagen del evento</h2>
        {bannerPreview && (
          <img src={bannerPreview} alt="Banner" className="w-full h-48 object-cover rounded-xl" />
        )}
        <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition text-sm text-gray-500">
          <Upload className="w-4 h-4" />
          {bannerPreview ? 'Cambiar imagen' : 'Subir imagen de portada'}
          <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Información del evento</h2>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título *</label>
          <input {...register('title')} placeholder="Ej: Encuentro Nacional de Baile" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
          <textarea {...register('description')} rows={4} placeholder="Descripción del evento..." className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha y hora *</label>
            <input {...register('starts_at')} type="datetime-local" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
            {errors.starts_at && <p className="text-red-500 text-xs mt-1">{errors.starts_at.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fin (opcional)</label>
            <input {...register('ends_at')} type="datetime-local" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lugar *</label>
          <input {...register('location')} placeholder="Ej: Club Atlético Santa Fe" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900" />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">País</label>
            <select {...register('country_id')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
              <option value="AR">🇦🇷 Argentina</option>
              <option value="MX">🇲🇽 México</option>
              <option value="CR">🇨🇷 Costa Rica</option>
              <option value="PY">🇵🇾 Paraguay</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado</label>
            <select {...register('status')} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white">
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Datos de pago</h2>
        <input {...register('payment_label')} placeholder="Alias, CBU, etc." className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
        <input {...register('payment_instructions')} placeholder="Dato de transferencia" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
        <input {...register('payment_holder')} placeholder="Titular" className="w-full px-4 py-3 border border-gray-200 rounded-xl" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Tickets</h2>
          <button type="button" onClick={() => append({ name: '', price: 0, capacity: 50 })} className="text-blue-600 font-medium">+ Agregar</button>
        </div>
        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <input {...register(`ticket_types.${index}.name`)} placeholder="Nombre" className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
            <div className="grid grid-cols-2 gap-3">
              <input {...register(`ticket_types.${index}.price`, { valueAsNumber: true })} type="number" placeholder="Precio" className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
              <input {...register(`ticket_types.${index}.capacity`, { valueAsNumber: true })} type="number" placeholder="Cupo" className="w-full px-3 py-2 border border-gray-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{error}</div>}

      <button type="submit" disabled={loading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition">
        {loading ? 'Guardando...' : eventId ? 'Guardar cambios' : 'Crear evento'}
      </button>
    </form>
  )
}
