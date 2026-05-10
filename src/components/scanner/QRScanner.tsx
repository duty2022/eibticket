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
          // BLOQUEO TOTAL DURANTE PROCESAMIENTO Y PAUSA
          if (cooldown || isLoading) return

          const code = decodedText.split('/validate/').pop() || decodedText

          setCooldown(true)
          await validateTicket(code)

          // PAUSA DE 5 SEGUNDOS para que el verde se quede pegado en pantalla
          setTimeout(() => {
            setCooldown(false)
            setResult(null) // Recién después de 5 segundos se limpia la pantalla
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
      
      // SOLO ACTUALIZAMOS EL RESULTADO SI NO TENEMOS UNO YA MOSTRÁNDOSE
      // Esto evita que el amarillo pise al verde si hubo un doble escaneo
      setResult((prev) => {
        if (prev && prev.valid) return prev; // Si ya hay un verde, no lo cambies por nada
        return data;
      })
      
      // Vibración diferenciada
      if (data.valid && navigator.vibrate) {
        navigator.vibrate([100, 50, 100])
      } else if (!data.valid && navigator.vibrate) {
        navigator.vibrate(400)
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
    <div className="flex flex-col items-center gap-6 p-4 max-w-lg mx-auto">
      {/* VISOR DE CÁMARA */}
      <div className="relative w-full aspect-square bg-black rounded-[40px] overflow-hidden border-8 border-gray-800 shadow-2xl">
        <div id="qr-reader" className="w-full h-full object-cover" />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-30">
            <RefreshCw className="w-16 h-16 text-white animate-spin" />
          </div>
        )}

        {/* Marco visual de escaneo */}
        <div className="absolute inset-0 border-[40px] border-black/20 pointer-events-none">
          <div className="w-full h-full border-4 border-white/30 rounded-2xl" />
        </div>
      </div>

      <div className="w-full">
        {!scanning ? (
          <button onClick={startScanner} className="w-full py-6 bg-blue-600 text-white rounded-3xl font-black text-2xl shadow-xl active:scale-95 transition-all">
            ACTIVAR ESCÁNER
          </button>
        ) : (
          <button onClick={stopScanner} className="w-full py-6 bg-red-500/10 text-red-500 border-2 border-red-500 rounded-3xl font-bold text-xl">
            DETENER
          </button>
        )}
      </div>

      {/* RESULTADO GIGANTE Y PERSISTENTE */}
      {result && (
        <div className={`w-full p-8 rounded-[35px] border-[8px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-10 duration-300 ${
          result.valid 
            ? 'bg-green-500 border-green-200' 
            : result.status === 'already_used'
            ? 'bg-amber-500 border-amber-100'
            : 'bg-red-500 border-red-100'
        }`}>
          <div className="flex flex-col items-center text-center gap-4">
            {result.valid ? (
              <CheckCircle2 className="w-24 h-24 text-white animate-bounce" />
            ) : (
              <AlertTriangle className="w-24 h-24 text-white" />
            )}
            
            <h3 className="text-4xl font-black text-white leading-tight uppercase tracking-tighter">
              {result.message}
            </h3>

            {result.ticket && (
              <div className="w-full bg-white/20 backdrop-blur-md mt-4 p-6 rounded-2xl border border-white/30">
                <p className="text-white/80 font-bold uppercase text-sm mb-1">Asistente</p>
                <p className="text-3xl font-black text-white truncate w-full">{result.ticket.attendee_name}</p>
                
                <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-center">
                   <span className="bg-white text-gray-900 px-4 py-1 rounded-full font-black text-sm uppercase">
                     {result.ticket.ticket_type}
                   </span>
                   {result.valid && <span className="text-white font-black text-2xl">INGRESÓ!</span>}
                </div>
              </div>
            )}

            {result.status === 'already_used' && (
              <div className="w-full bg-black/20 p-4 rounded-2xl mt-2 border border-black/10">
                <p className="text-white font-bold text-lg">
                  YA ENTRÓ: {new Date(result.validated_at!).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} HS
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
