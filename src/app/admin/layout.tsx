'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Check bypass first (no network needed)
    const isDouglas = localStorage.getItem('douglas_admin') === 'true'
    if (isDouglas) {
      setLoading(false)
      return
    }

    // 2. Fallback to normal session check
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email?.toLowerCase()
      if (email === 'eidarte@hotmail.com' || data.user?.user_metadata?.role === 'admin') {
        setLoading(false)
      } else {
        router.replace('/login')
      }
    }).catch(() => {
      router.replace('/login')
    })
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Verificando acceso...</div>
  return <div className="min-h-screen bg-gray-50">{children}</div>
}
