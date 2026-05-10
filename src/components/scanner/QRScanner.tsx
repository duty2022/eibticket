'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

type ScanResult = {
  valid: boolean
  status: string
  message: string
  ticket?: {
    attendee_name: string
    ticket_type: string
    event_title: string
    validated_at: string
  }
  validated_at?: string
  attendee_name?: string
}

type Props = {
  eventId?: string
  onResult?: (result: ScanResult) => void
}

export default function QRScanner({ onResult }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(false)

  useEffect(() => {
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [scanning])

  const startScanner = async () => {
    setError(null)
    setResult(null)

    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' }, // cámara trasera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          if (cooldown) return

          // Extraer el código QR de la URL
          const code = decodedText.split('/validate/').pop() || decodedText

          setCooldown(true)
          await validateTicket(code)

          // Esperar 3 segundos antes de permitir otro scan
          setTimeout(() => setCooldown(false), 3000)
        },
        undefined // error silencioso
      )
      setScanning(true)
    } catch (err) {
      setError('No se pudo acceder a la cámara. Verificá los permisos.')
      console.error(err)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop()
      scannerRef.current = null
    }
    setScanning(false)
  }

  const validateTicket = async (code: string) => {
    try {
      const token = localStorage.getItem('supabase.auth.token')
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_code: code }),
      })

      const data = await res.json()
      setResult(data)
      onResult?.(data)
    } catch {
      setResult({
        valid: false,
        status: 'error',
        message: '❌ Error de conexión',
      })
    }
  }

  const resultColor = result
    ? result.valid
      ? 'bg-green-100 border-green-500 text-green-800'
      : result.status === 'already_used'
      ? 'bg-yellow-100 border-yellow-500 text-yellow-800'
      : 'bg-red-100 border-red-500 text-red-800'
    : ''

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <h2 className="text-xl font-bold">Scanner de QR</h2>

      {/* Visor de la cámara */}
      <div
        id="qr-reader"
        className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-gray-300"
      />

      {/* Botones */}
      <div className="flex gap-3">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
          >
            Iniciar scanner
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="px-6 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition"
          >
            Detener
          </button>
        )}
      </div>

      {/* Resultado del scan */}
      {result && (
        <div className={`w-full max-w-sm p-4 rounded-xl border-2 ${resultColor} transition-all`}>
          <p className="text-lg font-bold">{result.message}</p>
          {result.ticket && (
            <div className="mt-2 text-sm">
              <p><span className="font-semibold">Nombre:</span> {result.ticket.attendee_name}</p>
              <p><span className="font-semibold">Tipo:</span> {result.ticket.ticket_type}</p>
              <p><span className="font-semibold">Evento:</span> {result.ticket.event_title}</p>
            </div>
          )}
          {result.status === 'already_used' && result.validated_at && (
            <p className="mt-2 text-sm">
              Usado el {new Date(result.validated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}

      {/* Error de cámara */}
      {error && (
        <div className="w-full max-w-sm p-4 bg-red-100 border-2 border-red-500 text-red-800 rounded-xl">
          {error}
        </div>
      )}
    </div>
  )
}
