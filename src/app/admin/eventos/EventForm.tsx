'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { supabase } from '@/lib/supabase'
import { Plus, Trash2, Upload } from 'lucide-react'

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
  // Datos de pago opcionales por evento (si se dejan vacíos, usa el default del país)
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

      // Bypass de identidad para Douglas
      let organizerId = null
      
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: organizer } = await supabase
          .from('organizers')
          .select('id')
          .eq('user_id', session.user.id)
          .single()
        organizerId = organizer?.id
      }

      // Si no hay sesión (Bypass), intentamos obtener o CREAR el organizador para Douglas
      if (!organizerId) {
        const { data: existing } = await supabase.from('organizers').select('id').limit(1)
        if (existing && existing.length > 0) {
          organizerId = existing[0].id
        } else {
          // Si no hay nada, creamos el perfil de Douglas de prepo
          const { data: newOrg, error: createError } = await supabase
            .from('organizers')
            .insert([{ 
              name: 'Douglas', 
              email: 'eidarte@hotmail.com'
            }])
            .select()
            .single()
          
          if (createError) {
            setError('Error creand organizador: ' + createError.message)
            return
          }
          organizerId = newOrg?.id
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
        organizer_id: organizerId,
        // Datos de pago opcionales por evento
        payment_label:        data.payment_label        || null,
        payment_instructions: data.payment_instructions || null,
        payment_holder:       data.payment_holder       || null,
      }

      let savedEventId = eventId

      if (eventId) {
        // Editar
        await supabase.from('events').update(eventData).eq('id', eventId)
        // Eliminar tipos anteriores y reinsertar
        await supabase.from('ticket_types').delete().eq('event_id', eventId)
      } else {
        // Crear
        const { data: newEvent, error: eventError } = await supabase
          .from('events')
          .insert(eventData)
          .select()
          .single()

        if (eventError || !newEvent) throw new Error('Error al crear el evento')
        savedEventId = newEvent.id
      }

      // Insertar tipos de ticket
      await supabase.from('ticket_types').insert(
        data.ticket_types.map(tt => ({
          ...tt,
          event_id: savedEventId,
          sold: 0,
        }))
      )

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
      {/* Banner */}
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

      {/* Datos generales */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <h2 className="font-bold text-gray-900">Información del evento</h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Título *</label>
          <input
            {...register('title')}
            placeholder="Ej: Encuentro Nacional de Baile Movimiento 60+"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descripción</label>
          <textarea
            {...register('description')}
            rows={4}
            placeholder="Descripción del evento, artistas, programa..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fecha y hora *</label>
            <input
              {...register('starts_at')}
              type="datetime-local"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
            {errors.starts_at && <p className="text-red-500 text-xs mt-1">{errors.starts_at.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fin (opcional)</label>
            <input
              {...register('ends_at')}
              type="datetime-local"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lugar *</label>
          <input
            {...register('location')}
            placeholder="Ej: Club Atlético Santa Fe"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
          {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Dirección (opcional)</label>
          <input
            {...register('address')}
            placeholder="Ej: Av. San Martín 1234"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">País</label>
            <select
              {...register('country_id')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
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
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>
      </div>

      {/* Datos de pago específicos del evento (opcional) */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <h2 className="font-bold text-gray-900">Datos de pago del evento</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Opcional. Si lo dejás vacío, se usan los datos de pago configurados para el país.
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Tipo de pago <span className="text-gray-400 font-normal">(ej: Alias CBU, CLABE, SINPE Móvil)</span>
          </label>
          <input
            {...register('payment_label')}
            placeholder="Dejar vacío para usar el default del país"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            Dato de transferencia <span className="text-gray-400 font-normal">(alias, número, CLABE)</span>
          </label>
          <input
            {...register('payment_instructions')}
            placeholder="Dejar vacío para usar el default del país"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Titular de la cuenta</label>
          <input
            {...register('payment_holder')}
            placeholder="Dejar vacío para usar el default del país"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          />
        </div>
      </div>

      {/* Tipos de ticket */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900">Tipos de ticket</h2>
          <button
            type="button"
            onClick={() => append({ name: '', price: 0, capacity: 50 })}
            className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-700"
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
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="text-red-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <input
                  {...register(`ticket_types.${index}.name`)}
                  placeholder="Nombre (ej: General, VIP)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  {...register(`ticket_types.${index}.price`, { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="Precio"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <input
                  {...register(`ticket_types.${index}.capacity`, { valueAsNumber: true })}
                  type="number"
                  min="1"
                  placeholder="Capacidad"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">
                <input
                  {...register(`ticket_types.${index}.description`)}
                  placeholder="Descripción (opcional)"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
        {errors.ticket_types && (
          <p className="text-red-500 text-xs">{errors.ticket_types.message}</p>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition"
        >
          {loading ? 'Guardando...' : eventId ? 'Guardar cambios' : 'Crear evento'}
        </button>
      </div>
    </form>
  )
}



