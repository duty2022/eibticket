import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateQRImage } from '@/lib/qr'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Obtener la orden
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, event:events(title, starts_at, location), ticket_type:ticket_types(name)')
      .eq('id', params.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    // 2. Obtener los tickets
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('order_id', params.id)

    if (ticketsError || !tickets) {
      return NextResponse.json({ error: 'Tickets no encontrados' }, { status: 404 })
    }

    // 3. Generar QRs para cada ticket
    const updatedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        const qrPath = `qrs/${ticket.qr_code}.png`
        
        // Generar imagen y subir a storage
        const qrBuffer = await generateQRImage(ticket.qr_code)
        await supabaseAdmin.storage
          .from('tickets')
          .upload(qrPath, qrBuffer, { contentType: 'image/png', upsert: true })

        const { data: qrUrl } = supabaseAdmin.storage
          .from('tickets')
          .getPublicUrl(qrPath)

        // Actualizar ticket
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

    // 4. Actualizar la orden a aprobada
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .update({ status: 'approved' })
      .eq('id', params.id)
      .select()
      .single()

    // 5. Incrementar contador
    await supabaseAdmin.rpc('increment_sold', {
      ticket_type_id: order.ticket_type_id,
      amount: order.quantity,
    })

    return NextResponse.json({
      success: true,
      tickets: updatedTickets,
      order: updatedOrder
    })
  } catch (error: any) {
    console.error('Error in approve:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
