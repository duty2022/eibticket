'use client'
import { useEffect, useState } from 'react'
import { supabaseAdmin } from '@/lib/supabase'
import EventForm from '../../EventForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditEventPage({ params }: { params: { id: string } }) {
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadEvent() {
      const { data } = await supabaseAdmin.from('events').select('*, ticket_types(*)').eq('id', params.id).single()
      setEvent(data)
      setLoading(false)
    }
    loadEvent()
  }, [params.id])

  if (loading) return <div className="p-8 text-center">Cargando...</div>
  if (!event) return <div className="p-8 text-center">Evento no encontrado</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Link href={`/admin/eventos/${params.id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition text-sm mb-4">
        <ArrowLeft className="w-4 h-4" />
        Volver al detalle
      </Link>
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Editar Evento</h1>
        <EventForm initialData={event} eventId={event.id} />
      </div>
    </div>
  )
}
