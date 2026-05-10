'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteEvent } from '../actions'
import { Trash2 } from 'lucide-react'

export default function DeleteEventButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de que querés borrar este evento? Esta acción no se puede deshacer.')) {
      return
    }

    setLoading(true)
    const res = await deleteEvent(id)
    if (res.success) {
      router.push('/admin/eventos')
      router.refresh()
    } else {
      alert('Error al borrar el evento: ' + res.error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition text-sm"
    >
      <Trash2 className="w-4 h-4" />
      {loading ? 'Borrando...' : 'Borrar evento'}
    </button>
  )
}
