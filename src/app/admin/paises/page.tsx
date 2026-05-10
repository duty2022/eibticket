import { supabaseAdmin } from '@/lib/supabase'
import CountryForm from './CountryForm'
import CountryList from './CountryList'

async function getCountries() {
  const { data } = await supabaseAdmin
    .from('countries')
    .select('*')
    .order('name')
  return data || []
}

export default async function PaisesPage() {
  const countries = await getCountries()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Países y pagos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Configurá los datos de pago por defecto para cada país. Podés pisarlos en cada evento si necesitás.
        </p>
      </div>

      <CountryList countries={countries} />
      <CountryForm />
    </div>
  )
}
