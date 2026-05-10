import CreateUserForm from './CreateUserForm'
import { supabaseAdmin } from '@/lib/supabase'

async function getScannerUsers() {
  const { data } = await supabaseAdmin.auth.admin.listUsers()
  return (data?.users || []).filter(u => u.user_metadata?.role === 'scanner')
}

export default async function UsuariosPage() {
  const scanners = await getScannerUsers()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usuarios scanner</h1>
        <p className="text-gray-500 text-sm mt-1">
          Creá accesos para tus colaboradores de puerta. Solo pueden usar el scanner.
        </p>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-800">Colaboradores activos</h2>
        </div>
        {scanners.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400">
            <p>Aún no hay usuarios scanner</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {scanners.map((user) => (
              <div key={user.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-400">
                    Creado el {new Date(user.created_at).toLocaleDateString('es')}
                  </p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                  Scanner
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario para crear */}
      <CreateUserForm />
    </div>
  )
}
