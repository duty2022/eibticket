'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { CheckCircle2, XCircle, AlertTriangle, Camera, RefreshCw } from 'lucide-react'

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

export default function QRScanner() {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
        { facingMode: 'environment' },
        {
          fps: 15,
          // Ajustamos para que el área de escaneo sea un CUADRADO perfecto y grande
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.floor(minEdge * 0.8); // 80% del ancho/alto disponible
            return { width: edgeSize, height: edgeSize };
          },
          aspectRatio: 1.0 // Forzar aspecto cuadrado en el video si es posible
        },
        async (decodedText) => {
          if (cooldown || isLoading) return

          // Extraer el código QR de la URL o el texto directo
          const code = decodedText.split('/validate/').pop() || decodedText

          setCooldown(true)
          await validateTicket(code)

          // Esperar 4 segundos antes de permitir otro scan para que el usuario vea el resultado
          setTimeout(() => {
            setCooldown(false)
            setResult(null) 
          }, 4000)
        },
        undefined
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
    setIsLoading(true)
    try {
      // Llamada directa sin requerir token en el header (el backend ya no lo pide)
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qr_code: code }),
      })

      const data = await res.json()
      setResult(data)
      
      // Vibración
      if (data.valid && navigator.vibrate) {
        navigator.vibrate([200, 100, 200])
      } else if (!data.valid && navigator.vibrate) {
        navigator.vibrate(500)
      }
    } catch (err) {
      console.error(err)
      setResult({
        valid: false,
        status: 'error',
        message: '❌ Error de conexión',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Visor de la cámara - Forzamos cuadrado en el contenedor */}
      <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl">
        <div id="qr-reader" className="w-full h-full object-cover" />
        
        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white p-6 text-center">
            <Camera className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium">Cámara lista</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
            <RefreshCw className="w-10 h-10 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Botones de control */}
      <div className="w-full max-w-sm">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition"
          >
            Abrir Cámara
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-xl shadow-lg active:scale-95 transition"
          >
            Detener Scanner
          </button>
        )}
      </div>

      {/* Resultado del scan */}
      {result && (
        <div className={`w-full max-w-sm p-6 rounded-3xl border-4 shadow-2xl animate-in fade-in zoom-in duration-300 ${
          result.valid 
            ? 'bg-green-100 border-green-600' 
            : result.status === 'already_used'
            ? 'bg-amber-100 border-amber-600'
            : 'bg-red-100 border-red-600'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            {result.valid && <CheckCircle2 className="w-10 h-10 text-green-600" />}
            {result.status === 'already_used' && <AlertTriangle className="w-10 h-10 text-amber-600" />}
            {!result.valid && result.status !== 'already_used' && <XCircle className="w-10 h-10 text-red-600" />}
            
            <h3 className={`text-2xl font-black ${
              result.valid ? 'text-green-900' : result.status === 'already_used' ? 'text-amber-900' : 'text-red-900'
            }`}>
              {result.message}
            </h3>
          </div>

          {result.ticket && (
            <div className="space-y-3 bg-white/60 p-4 rounded-2xl border border-black/10">
              <div>
                <p className="text-xs uppercase font-bold text-gray-500">Asistente</p>
                <p className="text-xl font-black text-gray-900">{result.ticket.attendee_name}</p>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-3">
                <div>
                  <p className="text-xs uppercase font-bold text-gray-500">Entrada</p>
                  <p className="text-sm font-bold text-gray-800">{result.ticket.ticket_type}</p>
                </div>
                {result.valid && (
                  <div className="text-right">
                    <p className="text-xs uppercase font-bold text-green-700">Estado</p>
                    <p className="text-sm font-black text-green-600">INGRESÓ OK</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {result.status === 'already_used' && result.validated_at && (
            <div className="mt-4 p-4 bg-amber-200/50 rounded-2xl text-center border border-amber-300">
              <p className="text-sm font-black text-amber-900 uppercase">
                ¡ALERTA! YA ENTRÓ A LAS {new Date(result.validated_at).toLocaleTimeString('es-AR', { 
                  hour: '2-digit', minute: '2-digit' 
                })} hs
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="w-full max-w-sm p-4 bg-red-600 text-white rounded-2xl flex items-center gap-3">
          <XCircle className="w-6 h-6 flex-shrink-0" />
          <p className="font-bold">{error}</p>
        </div>
      )}
    </div>
  )
}
