'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Pencil, Check, X } from 'lucide-react'

type Country = {
  id: string
  name: string
  currency: string
  currency_symbol: string
  payment_instructions: string
  payment_holder: string
  payment_label: string
}

const FLAGS: Record<string, string> = {
  AR: '🇦🇷', MX: '🇲🇽', CR: '🇨🇷', PY: '🇵🇾',
  CO: '🇨🇴', PE: '🇵🇪', CL: '🇨🇱', UY: '🇺🇾', BO: '🇧🇴',
}

export default function CountryList({ countries }: { countries: Country[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<Partial<Country>>({})
  const [saving, setSaving] = useState(false)

  const startEdit = (country: Country) => {
    setEditing(country.id)
    setForm({
      payment_label: country.payment_label,
      payment_instructions: country.payment_instructions,
      payment_holder: country.payment_holder,
    })
  }

  const saveEdit = async (id: string) => {
    setSaving(true)
    await supabase.from('countries').update(form).eq('id', id)
    setEditing(null)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-800">Países configurados</h2>
      </div>
      <div className="divide-y divide-gray-50">
        {countries.map((country) => (
          <div key={country.id} className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{FLAGS[country.id] || '🌍'}</span>
                <div>
                  <p className="font-semibold text-gray-900">{country.name}</p>
                  <p className="text-xs text-gray-400">{country.currency} · {country.currency_symbol}</p>
                </div>
              </div>
              {editing !== country.id && (
                <button
                  onClick={() => startEdit(country)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>

            {editing === country.id ? (
              <div className="space-y-2 mt-2">
                <input
                  value={form.payment_label || ''}
                  onChange={e => setForm(f => ({ ...f, payment_label: e.target.value }))}
                  placeholder="Tipo (ej: Alias CBU, SINPE Móvil)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={form.payment_instructions || ''}
                  onChange={e => setForm(f => ({ ...f, payment_instructions: e.target.value }))}
                  placeholder="Dato de transferencia (alias, número, CLABE)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={form.payment_holder || ''}
                  onChange={e => setForm(f => ({ ...f, payment_holder: e.target.value }))}
                  placeholder="Titular de la cuenta"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => saveEdit(country.id)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition"
                  >
                    <Check className="w-4 h-4" />
                    {saving ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button
                    onClick={() => setEditing(null)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="text-gray-400 text-xs">{country.payment_label}:</span> <span className="font-mono font-medium">{country.payment_instructions}</span></p>
                <p><span className="text-gray-400 text-xs">Titular:</span> {country.payment_holder}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
