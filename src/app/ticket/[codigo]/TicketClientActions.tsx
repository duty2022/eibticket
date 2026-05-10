'use client'

import { Download, Share2 } from 'lucide-react'

export default function TicketClientActions({ 
  qrUrl, 
  ticketName, 
  eventName 
}: { 
  qrUrl: string, 
  ticketName: string, 
  eventName: string 
}) {
  const downloadQR = async () => {
    try {
      const response = await fetch(qrUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `Ticket-${ticketName.replace(/\s+/g, '-')}-${eventName.replace(/\s+/g, '-')}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading QR:', error)
      // Fallback: abrir en nueva pestaña
      window.open(qrUrl, '_blank')
    }
  }

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket para ${eventName}`,
          text: `¡Hola! Acá tengo mi ticket para ${eventName}.`,
          url: window.location.href,
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copiar link
      navigator.clipboard.writeText(window.location.href)
      alert('Link copiado al portapapeles')
    }
  }

  return (
    <div className="grid grid-cols-2 gap-3 w-full mt-4">
      <button
        onClick={downloadQR}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl text-sm font-bold active:scale-95 transition"
      >
        <Download className="w-4 h-4" />
        Descargar QR
      </button>
      <button
        onClick={shareTicket}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold active:scale-95 transition shadow-sm"
      >
        <Share2 className="w-4 h-4" />
        Compartir
      </button>
    </div>
  )
}
