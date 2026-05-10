import Link from 'next/link'
import { Home } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Barra de navegación superior fija */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link 
            href="/admin" 
            className="flex items-center gap-2 text-blue-600 font-bold text-lg hover:text-blue-700 transition"
          >
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <Home className="w-5 h-5" />
            </div>
            <span>EIB Admin</span>
          </Link>
          
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Douglas Dashboard
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  )
}
