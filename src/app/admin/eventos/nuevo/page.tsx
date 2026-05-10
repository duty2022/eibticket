export const dynamic = "force-dynamic"
import EventForm from '../EventForm'

export default function NuevoEventoPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Crear nuevo evento</h1>
      <EventForm />
    </div>
  )
}
