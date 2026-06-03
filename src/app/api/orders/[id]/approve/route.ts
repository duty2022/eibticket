import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateQRImage } from '@/lib/qr'
import { createClient } from '@supabase/supabase-js'

// POST /api/orders/[id]/approve — aprobar pago y generar QRs (solo organizadores)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Obtener el token del header
    const authHeader = req.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      console.error('No se recibió token en el header de autorización')
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 2. Obtener la orden PRIMERO para saber de qué evento hablamos
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, event:events(*, organizer:organizers(*))')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      console.error('Error al obtener orden:', orderError)
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // 3. Validar el usuario contra el token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    // Si getUser falla, probamos una validación manual de la sesión en perfiles
    if (authError || !user) {
      console.error('Error de autenticación Supabase:', authError)
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // 4. Verificar que el usuario es el dueño de la orden (organizador)
    const isOrganizer = order.event.organizer.user_id === user.id
    
    if (!isOrganizer) {
      console.error(`Acceso denegado: User ${user.id} no es organizador de ${order.event.organizer.user_id}`)
      return NextResponse.json({ error: 'No tenés permisos para esta orden' }, { status: 403 })
    }

    // Si la orden ya está aprobada, devolvemos éxito directo
    if (order.status === 'approved') {
      const { data: tickets } = await supabaseAdmin
        .from('tickets')
        .select('*')
        .eq('order_id', order.id)
      
      return NextResponse.json({
        success: true,
        tickets,
        order,
        message: 'La orden ya estaba aprobada'
      })
    }

    // Obtener los tickets de esta orden
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('order_id', params.id)

    if (ticketsError || !tickets) {
      return NextResponse.json({ error: 'Error al obtener los tickets' }, { status: 500 })
    }

    // Generar QR para cada ticket y actualizar
    const updatedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const qrDataUrl = await generateQRImage(ticket.qr_code)

        // Subir QR a Storage
        const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64')
        const qrPath = `qrcodes/${ticket.id}.png`

        await supabaseAdmin.storage
          .from('tikzet')
          .upload(qrPath, qrBuffer, {
            contentType: 'image/png',
            upsert: true,
          })

        const { data: qrUrl } = supabaseAdmin.storage
          .from('tikzet')
          .getPublicUrl(qrPath)

        // Actualizar ticket a válido
        const { data: updatedTicket } = await supabaseAdmin
          .from('tickets')
          .update({
            status: 'valid',
            qr_url: qrUrl.publicUrl,
          })
          .eq('id', ticket.id)
          .select()
          .single()

        return updatedTicket
      })
    )

    // Actualizar la orden a aprobada y capturar la data
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .update({ status: 'approved' })
      .eq('id', params.id)
      .select('*, event:events(title, starts_at, location), ticket_type:ticket_types(name)')
      .single()

    // Actualizar sold en ticket_type
    await supabaseAdmin.rpc('increment_sold', {
      ticket_type_id: order.ticket_type_id,
      amount: order.quantity,
    })

    // Notificar por email (opcional) o integrar con API de WhatsApp

    return NextResponse.json({
      success: true,
      tickets: updatedTickets,
      order: updatedOrder,
      message: `${tickets.length} pase(s) aprobado(s) y QR generado(s)`,
    })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
