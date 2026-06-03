'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createEventWithBypass, updateEventWithBypass, uploadImage } from './actions'
import { Plus, Trash2, Upload, Link as LinkIcon } from 'lucide-react'

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
  banner_url_link: z.string().optional(),
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
    watch,
    setValue,
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
  const bannerUrlLink = watch('banner_url_link')

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setBannerFile(file)
      setBannerPreview(URL.createObjectURL(file))
      setValue('banner_url_link', '') // Limpiar link si sube archivo
    }
  }

  const handleLinkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    if (url) {
      setBannerPreview(url)
      setBannerFile(null) // Limpiar archivo si pega link
    } else {
      setBannerPreview(initialData?.banner_url || null)
    }
  }

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    try {
      let banner_url = data.banner_url_link || initialData?.banner_url || null
      
      // Si hay un archivo seleccionado, tiene prioridad la subida
      if (bannerFile) {
        const formData = new FormData()
        formData.append('file', bannerFile)
        const uploadRes = await uploadImage(formData)
        
        if (uploadRes.success) {
          banner_url = uploadRes.url
        } else {
          setError('Error al subir la imagen: ' + uploadRes.error)
          setLoading(false)
          return
        }
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

      let result;
      if (eventId) {
        result = await updateEventWithBypass(eventId, eventData, data.ticket_types)
      } else {
        result = await createEventWithBypass(eventData, data.ticket_types)
      }

      if (result.success) {
        router.push('/admin/eventos')
        router.refresh()
      } else {
        throw new Error(result.error || 'Error al guardar el evento')
      }
    } catch (err: any) {
      setError(err.message || 'Error al guardar el evento')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-gray-900">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Imagen del evento</h2>
        {bannerPreview && (
          <img src={bannerPreview} alt="Banner" className="w-full h-48 object-cover rounded-xl" />
        )}
        
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Pegar link de imagen</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                {...register('banner_url_link')}
                onChange={handleLinkChange}
                placeholder="https://ejemplo.com/foto.jpg"
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-400">O subir archivo</span>
            </div>
          </div>

          <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 transition text-sm text-gray-500">
            <Upload className="w-4 h-4" />
            {bannerFile ? bannerFile.name : 'Seleccionar archivo local'}
            <input type="file" accept="image/*" onChange={handleBannerChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Datos generales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 text-gray-900">
        <h2 className="font-bold">Información del evento</h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título *</label>
          <input
            {...register('title')}
            placeholder="Ej: Encuentro Nacional de Baile Movimiento 60+"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Descripción del evento, artistas, programa..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha y hora *</label>
            <input
              {...register('starts_at')}
              type="datetime-local"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.starts_at && <p className="text-red-500 text-xs mt-1">{errors.starts_at.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fin (opcional)</label>
            <input
              {...register('ends_at')}
              type="datetime-local"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lugar *</label>
          <input
            {...register('location')}
            placeholder="Ej: Club Atlético Santa Fe"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección (opcional)</label>
          <input
            {...register('address')}
            placeholder="Ej: Av. San Martín 1234"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">País</label>
            <select
              {...register('country_id')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="AR">🇦🇷 Argentina</option>
              <option value="MX">🇲🇽 México</option>
              <option value="CR">🇨🇷 Costa Rica</option>
              <option value="PY">🇵🇾 Paraguay</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Estado</label>
            <select
              {...register('status')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Datos de pago */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="font-bold">Datos de pago del evento</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Opcional. Si lo dejás vacío, se usan los datos de pago del país.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tipo de pago</label>
          <input
            {...register('payment_label')}
            placeholder="Ej: Alias CBU, CLABE"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dato de transferencia</label>
          <input
            {...register('payment_instructions')}
            placeholder="Ej: EIB.EVENTOS.2024"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titular</label>
          <input
            {...register('payment_holder')}
            placeholder="Ej: Douglas EIB"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tickets */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Tipos de ticket</h2>
          <button
            type="button"
            onClick={() => append({ name: '', price: 0, capacity: 50 })}
            className="flex items-center gap-1.5 text-sm text-blue-600 font-medium"
          >
            <Plus className="w-4 h-4" />
            Agregar tipo
          </button>
        </div>

        {fields.map((field, index) => (
          <div key={field.id} className="border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Tipo {index + 1}</p>
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(index)} className="text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input
                  {...register(`ticket_types.${index}.name`)}
                  placeholder="Nombre (ej: General, VIP)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <input
                  {...register(`ticket_types.${index}.price`, { valueAsNumber: true })}
                  type="number"
                  placeholder="Precio"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>
              <div>
                <input
                  {...register(`ticket_types.${index}.capacity`, { valueAsNumber: true })}
                  type="number"
                  placeholder="Capacidad"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-60"
      >
        {loading ? 'Guardando...' : eventId ? 'Guardar cambios' : 'Crear evento'}
      </button>
    </form>
  )
}
