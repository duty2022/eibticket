'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  Ticket, LayoutDashboard, ListOrdered,
  CalendarDays, Users, QrCode, LogOut, Menu, X, Globe
} from 'lucide-react'

const navItems = [
  { href: '/admin',          label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/eventos',  label: 'Eventos',   icon: CalendarDays },
  { href: '/admin/ordenes',  label: 'Órdenes',   icon: ListOrdered },
  { href: '/admin/scanner',  label: 'Scanner',   icon: QrCode },
  { href: '/admin/usuarios', label: 'Usuarios',  icon: Users },
  { href: '/admin/paises',   label: 'Países',    icon: Globe },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [userEmail, setUserEmail] = useState('')

  useEffect(() => {
    console.log("AdminLayout: checking user...");
    supabase.auth.getUser().then(({ data, error }) => {
      console.log("AdminLayout: user response:", { data, error });
      if (error || !data.user) {
        console.error("AdminLayout: No user found, redirecting to login");
        router.push("/login");
        return;
      }
      const role = data.user.email === "eidarte@hotmail.com" ? "admin" : data.user.user_metadata?.role;
      console.log("AdminLayout: identified role:", role);
      if (role !== "admin") {
        console.error("AdminLayout: Not an admin, redirecting to login");
        router.push("/login");
        return;
      }
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || '')
    })
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-gray-200 fixed h-full">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Ticket className="w-6 h-6 text-blue-600" />
            <span className="text-lg font-bold text-gray-900">Tikzet</span>
          </div>
          <p className="text-xs text-gray-400 mt-1 truncate">{userEmail}</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive(href, exact)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Header mobile */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="w-5 h-5 text-blue-600" />
          <span className="font-bold text-gray-900">Tikzet Admin</span>
        </div>
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-white pt-16">
          <nav className="p-4 space-y-1">
            {navItems.map(({ href, label, icon: Icon, exact }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition ${
                  isActive(href, exact)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 w-full mt-4"
            >
              <LogOut className="w-5 h-5" />
              Cerrar sesión
            </button>
          </nav>
        </div>
      )}

      {/* Contenido */}
      <main className="flex-1 md:ml-60 pt-16 md:pt-0">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  )
}
