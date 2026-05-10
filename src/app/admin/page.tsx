import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>Dashboard de Emergencia</h1>
      <p style={{ color: '#666' }}>Modo de recuperación activo para Douglas</p>
      
      <div style={{ marginTop: '40px', padding: '20px', border: '1px solid #ddd', borderRadius: '10px' }}>
        <h2>¡Entraste, Douglas!</h2>
        <p>Este es un modo de acceso directo porque la base de datos está caída.</p>
        <p>Desde aquí confirmamos que el bypass funciona.</p>
      </div>

      <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
        <Link href="/admin/eventos/nuevo" style={{ background: '#2563eb', color: 'white', padding: '15px', borderRadius: '10px', textDecoration: 'none' }}>+ Crear evento</Link>
      </div>
    </div>
  )
}
