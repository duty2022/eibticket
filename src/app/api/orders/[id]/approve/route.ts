import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateQRImage } from '@/lib/qr'

// Este endpoint ahora usa privilegios de administrador para evitar problemas de sesión
// al momento de la aprobación crítica.
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Obtener la orden con toda su información
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, event:events(title, starts_at, location), ticket_type:ticket_types(name)')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      console.error('Error al obtener orden:', orderError)
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // 2. Obtener los tickets asociados
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('order_id', params.id)

    if (ticketsError || !tickets) {
      return NextResponse.json({ error: 'Tickets no encontrados' }, { status: 404 })
    }

    // Si la orden ya está aprobada, simplemente devolvemos la información actual
    if (order.status === 'approved') {
      return NextResponse.json({
        success: true,
        tickets: tickets,
        order: order,
        message: 'La orden ya estaba aprobada'
      })
    }

    // 3. Generar QRs para cada ticket (solo si no están generados o la orden no está aprobada)
    const updatedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const qrPath = `qrs/${ticket.qr_code}.png`
        
        // Generar imagen del QR (dataURL en base64)
        const qrDataUrl = await generateQRImage(ticket.qr_code)
        
        // Convertir dataURL a Buffer para subir a Supabase
        // El dataURL viene como 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        const base64Data = qrDataUrl.split(',')[1]
        const qrBuffer = Buffer.from(base64Data, 'base64')
        
        // Subir a Storage
        const { error: uploadError } = await supabaseAdmin.storage
          .from('tickets')
          .upload(qrPath, qrBuffer, { 
            contentType: 'image/png', 
            upsert: true 
          })

        if (uploadError) {
          console.error('Error al subir QR:', uploadError)
        }

        // Obtener la URL pública
        const { data: qrUrl } = supabaseAdmin.storage
          .from('tickets')
          .getPublicUrl(qrPath)

        // Actualizar el estado del ticket a 'valid' y guardar su URL
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

    // 4. Actualizar la orden a 'approved'
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .update({ status: 'approved' })
      .eq('id', params.id)
      .select('*, event:events(title, starts_at, location), ticket_type:ticket_types(name)')
      .single()

    // 5. Incrementar el contador de vendidos
    await supabaseAdmin.rpc('increment_sold', {
      ticket_type_id: order.ticket_type_id,
      amount: order.quantity,
    })

    return NextResponse.json({
      success: true,
      tickets: updatedTickets,
      order: updatedOrder,
      message: 'Orden aprobada con éxito'
    })
  } catch (error: any) {
    console.error('Error crítico en aprobación:', error)
    return NextResponse.json({ 
      error: 'Hubo un problema al procesar la aprobación. Intentá de nuevo.' 
    }, { status: 500 })
  }
}
