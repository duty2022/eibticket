'use client'

import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '@/lib/supabase'
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
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          if (cooldown || isLoading) return

          // Extraer el código QR de la URL
          const code = decodedText.split('/validate/').pop() || decodedText

          setCooldown(true)
          await validateTicket(code)

          // Esperar 4 segundos antes de permitir otro scan para que el usuario vea el resultado
          setTimeout(() => {
            setCooldown(false)
            setResult(null) // Limpiar resultado para el siguiente scan
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
      // Obtener el token de la sesión activa de Supabase
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setResult({
          valid: false,
          status: 'error',
          message: '❌ No has iniciado sesión',
        })
        return
      }

      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ qr_code: code }),
      })

      const data = await res.json()
      setResult(data)
      
      // Vibración si es exitoso
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
        message: '❌ Error de conexión con el servidor',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      {/* Visor de la cámara */}
      <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl">
        <div id="qr-reader" className="w-full h-full" />
        
        {!scanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 text-white p-6 text-center">
            <Camera className="w-12 h-12 mb-4 opacity-50" />
            <p className="font-medium">Cámara lista para escanear</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <RefreshCw className="w-10 h-10 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Botones de control */}
      <div className="w-full max-w-sm">
        {!scanning ? (
          <button
            onClick={startScanner}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition"
          >
            Abrir Cámara
          </button>
        ) : (
          <button
            onClick={stopScanner}
            className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-lg shadow-lg active:scale-95 transition"
          >
            Detener Scanner
          </button>
        )}
      </div>

      {/* Resultado del scan - Superposición clara */}
      {result && (
        <div className={`w-full max-w-sm p-6 rounded-3xl border-2 shadow-2xl animate-in fade-in zoom-in duration-300 ${
          result.valid 
            ? 'bg-green-50 border-green-500' 
            : result.status === 'already_used'
            ? 'bg-amber-50 border-amber-500'
            : 'bg-red-50 border-red-500'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            {result.valid && <CheckCircle2 className="w-8 h-8 text-green-600" />}
            {result.status === 'already_used' && <AlertTriangle className="w-8 h-8 text-amber-600" />}
            {!result.valid && result.status !== 'already_used' && <XCircle className="w-8 h-8 text-red-600" />}
            
            <h3 className={`text-xl font-black ${
              result.valid ? 'text-green-800' : result.status === 'already_used' ? 'text-amber-800' : 'text-red-800'
            }`}>
              {result.message}
            </h3>
          </div>

          {result.ticket && (
            <div className="space-y-2 bg-white/50 p-4 rounded-xl border border-black/5">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-400">Asistente</p>
                <p className="text-base font-bold text-gray-900">{result.ticket.attendee_name}</p>
              </div>
              <div className="flex justify-between border-t border-black/5 pt-2">
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Tipo</p>
                  <p className="text-xs font-bold text-gray-800">{result.ticket.ticket_type}</p>
                </div>
                {result.valid && (
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-gray-400">Validado</p>
                    <p className="text-xs font-bold text-green-600">RECIÉN</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {result.status === 'already_used' && result.validated_at && (
            <div className="mt-4 p-3 bg-amber-100 rounded-xl text-center">
              <p className="text-xs font-bold text-amber-900">
                YA INGRESÓ EL {new Date(result.validated_at).toLocaleString('es', { 
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
                })} hs
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error de permisos */}
      {error && (
        <div className="w-full max-w-sm p-4 bg-red-100 border-2 border-red-500 text-red-800 rounded-2xl flex items-center gap-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {scanning && !result && (
        <p className="text-gray-400 text-sm font-medium animate-pulse">
          Buscando código QR...
        </p>
      )}
    </div>
  )
}
