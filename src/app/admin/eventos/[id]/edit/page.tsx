import { supabaseAdmin } from '@/lib/supabase'
import EventForm from '../../EventForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const { data: event } = await supabaseAdmin
    .from('events')
    .select('*, ticket_types(*)')
    .eq('id', params.id)
    .single()

  if (!event) notFound()

  // Formatear fechas para datetime-local (YYYY-MM-DDTHH:mm)
  const formattedEvent = {
    ...event,
    starts_at: event.starts_at ? format(new Date(event.starts_at), "yyyy-MM-dd'T'HH:mm") : '',
    ends_at: event.ends_at ? format(new Date(event.ends_at), "yyyy-MM-dd'T'HH:mm") : '',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <Link href={`/admin/eventos/${params.id}`} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition text-sm mb-4">
        <ArrowLeft className="w-4 h-4" />
        Volver al detalle
      </Link>
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <h1 className="text-2xl font-bold mb-6">Editar Evento</h1>
        <EventForm initialData={formattedEvent} eventId={event.id} />
      </div>
    </div>
  )
}
