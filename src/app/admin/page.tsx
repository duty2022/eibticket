import Link from 'next/link'

export default function AdminDashboard() {
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '28px', marginBottom: '10px' }}>Panel de Administración</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>Bienvenido Douglas. Gestioná tus eventos y ventas desde acá.</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <Link href='/admin/ordenes' style={{ 
          background: '#10b981', color: 'white', padding: '30px 20px', borderRadius: '15px', 
          textDecoration: 'none', textAlign: 'center', fontWeight: 'bold', fontSize: '18px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          🛒 Órdenes y Pagos
        </Link>
        
        <Link href='/admin/eventos' style={{ 
          background: '#3b82f6', color: 'white', padding: '30px 20px', borderRadius: '15px', 
          textDecoration: 'none', textAlign: 'center', fontWeight: 'bold', fontSize: '18px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          📅 Gestionar Eventos
        </Link>
        
        <Link href='/admin/eventos/nuevo' style={{ 
          background: '#6366f1', color: 'white', padding: '30px 20px', borderRadius: '15px', 
          textDecoration: 'none', textAlign: 'center', fontWeight: 'bold', fontSize: '18px',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
        }}>
          ➕ Crear Evento
        </Link>
      </div>

      <div style={{ marginTop: '40px', padding: '20px', background: '#fef3c7', borderRadius: '10px', border: '1px solid #fcd34d' }}>
        <p style={{ margin: 0, color: '#92400e', fontWeight: '500' }}>
          💡 Tip: En la sección de "Órdenes y Pagos" podés ver el comprobante que subieron los clientes y aprobar el envío del QR.
        </p>
      </div>
    </div>
  )
}
