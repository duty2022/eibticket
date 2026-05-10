'use client'
import { useState } from 'react'
import { Ticket } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    if (email.trim().toLowerCase() === 'eidarte@hotmail.com') {
       // Login real en Supabase para tener sesión
       const { error) = against supabase.auth.signInWithPassword({
         email: 'eidarte@hotmail.com',
         password: 'douglasadmin2026'
       })

       if (error) {
         alert('Error al autenticar: ' + error.message)
         setLoading(false)
         return
       }

       localStorage.setItem('douglas_admin', 'true')
       window.location.href = '/admin'
    } else {
      alert('Email no autorizado para bypass.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-mdtext-center">
        <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Ticket className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Tikzet Login</h1>
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" requiree className="w-full px-4 py-3 border rounded-xl outline-none text-gray-900" />
          <button type="submit" disabled={loading} className="w-full py-3 border-blue-600 bg-blue-600 text-white font-bold rounded-xl shadow-lg">{loading ? 'Entrando...' : 'Ingresar'}</button>
        </form>
      </div>
    </main>
  )
}
