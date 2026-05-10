import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendTicketEmail } from '@/lib/mail'

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    // 1. Obtener la orden con tickets y detalles del evento
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, tickets(*), ticket_types(*, events(*))')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.status === 'approved') {
      return NextResponse.json({ error: 'La orden ya está aprobada' }, { status: 400 })
    }

    // 2. Actualizar estado de la orden
    const { error: updateOrderError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'approved' })
      .eq('id', orderId)

    if (updateOrderError) throw updateOrderError

    // 3. Generar QRs y activar tickets
    const tickets = order.tickets || []
    for (const ticket of tickets) {
      const qrCode = ticket.qr_code
      // La URL de validación que el personal de puerta va a escanear
      const validationUrl = `https://eibticket.vercel.app/validate/${qrCode}`
      // Generamos el QR usando Google Charts
      const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=400x400&chl=${encodeURIComponent(validationUrl)}`
      
      await supabaseAdmin
        .from('tickets')
        .update({ 
          status: 'valid',
          qr_url: qrUrl 
        })
        .eq('id', ticket.id)
    }

    // 4. Actualizar contador de vendidos
    const currentSold = order.ticket_types?.sold || 0
    await supabaseAdmin
      .from('ticket_types')
      .update({ sold: currentSold + order.quantity })
      .eq('id', order.ticket_type_id)

    // 5. Enviar email al comprador
    if (tickets.length > 0) {
      // Usamos el qr_code del primer ticket para el link principal
      const ticketUrl = `https://eibticket.vercel.app/ticket/${tickets[0].qr_code}`
      
      await sendTicketEmail({
        to: order.buyer_email,
        buyerName: order.buyer_name,
        eventName: order.ticket_types.events.name,
        ticketUrl: ticketUrl
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Approve error:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
