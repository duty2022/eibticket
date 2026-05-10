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
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const edgeSize = Math.floor(minEdge * 0.8);
            return { width: edgeSize, height: edgeSize };
          },
          aspectRatio: 1.0
        },
        async (decodedText) => {
          // Bloqueo estricto para evitar doble escaneo accidental
          if (cooldown || isLoading) return

          const code = decodedText.split('/validate/').pop() || decodedText

          setCooldown(true)
          await validateTicket(code)

          // 5 segundos de espera total antes de permitir el próximo
          // para dar tiempo a ver el resultado y mover el celular
          setTimeout(() => {
            setCooldown(false)
            setResult(null) 
          }, 5000)
        },
        undefined
      )
      setScanning(true)
    } catch (err) {
      setError('No se pudo acceder a la cámara.')
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
      const res = await fetch('/api/tickets/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: code }),
      })

      const data = await res.json()
      setResult(data)
      
      // Vibración diferenciada
      if (data.valid && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]) // Dos cortitos para OK
      } else if (!data.valid && navigator.vibrate) {
        navigator.vibrate(400) // Uno largo para ERROR
      }
    } catch (err) {
      setResult({
        valid: false,
        status: 'error',
        message: '❌ Error de red',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 p-4">
      <div className="relative w-full max-w-sm aspect-square bg-black rounded-3xl overflow-hidden border-4 border-gray-800 shadow-2xl">
        <div id="qr-reader" className="w-full h-full object-cover" />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="w-12 h-12 text-white animate-spin" />
              <p className="text-white font-bold text-xs">VALIDANDO...</p>
            </div>
          </div>
        )}

        {cooldown && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/20 z-10 pointer-events-none">
             {/* Overlay visual para indicar que está en pausa */}
          </div>
        )}
      </div>

      <div className="w-full max-w-sm">
        {!scanning ? (
          <button onClick={startScanner} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black text-xl shadow-xl">
            ABRIR CÁMARA
          </button>
        ) : (
          <button onClick={stopScanner} className="w-full py-5 bg-red-500 text-white rounded-2xl font-black text-xl shadow-xl">
            DETENER
          </button>
        )}
      </div>

      {result && (
        <div className={`w-full max-w-sm p-6 rounded-3xl border-[6px] shadow-2xl animate-in zoom-in duration-200 ${
          result.valid 
            ? 'bg-green-100 border-green-600' 
            : result.status === 'already_used'
            ? 'bg-amber-100 border-amber-600'
            : 'bg-red-100 border-red-600'
        }`}>
          <div className="flex items-center gap-4 mb-4">
            {result.valid ? <CheckCircle2 className="w-12 h-12 text-green-600" /> : <AlertTriangle className={`w-12 h-12 ${result.status === 'already_used' ? 'text-amber-600' : 'text-red-600'}`} />}
            <h3 className={`text-2xl font-black leading-tight ${result.valid ? 'text-green-900' : 'text-amber-900'}`}>
              {result.message}
            </h3>
          </div>

          {result.ticket && (
            <div className="bg-white/80 p-4 rounded-2xl border border-black/5">
              <p className="text-xs font-bold text-gray-500 uppercase">Asistente</p>
              <p className="text-2xl font-black text-gray-900 mb-2">{result.ticket.attendee_name}</p>
              <div className="flex justify-between items-end border-t border-black/5 pt-2">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase">Tipo</p>
                  <p className="text-base font-bold text-gray-800">{result.ticket.ticket_type}</p>
                </div>
                {result.valid && <p className="text-sm font-black text-green-600 bg-green-200 px-3 py-1 rounded-full">OK</p>}
              </div>
            </div>
          )}

          {result.status === 'already_used' && (
            <div className="mt-4 p-4 bg-amber-600 text-white rounded-2xl text-center">
              <p className="text-sm font-bold uppercase">Ya ingresó: {new Date(result.validated_at!).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
