'use client'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [vars, setVars] = useState<any>({})

  useEffect(() => {
    setVars({
      URL_DEFINIDA: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      LLAVE_DEFINIDA: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  }, [])

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ color: '#1d4ed8' }}>Diagnóstico de Conexión</h1>
      <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '12px' }}>
        <pre>{JSON.stringify(vars, null, 2)}</pre>
      </div>
      <p style={{ marginTop: '20px', color: '#6b7280' }}>
        Si arriba dice <b>false</b>, significa que aunque pusiste las llaves en Vercel, 
        la web todavía no las "leyó" porque falta hacer el <b>Redeploy</b>.
      </p>
      <a href="/login" style={{ color: '#1d4ed8', fontWeight: 'bold' }}>Ir al Login</a>
    </div>
  )
}
