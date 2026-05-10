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

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, ticket_types(*, events(*))')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.status === 'approved') {
      return NextResponse.json({ error: 'La orden ya está aprobada' }, { status: 400 })
    }

    const { error: updateOrderError } = await supabaseAdmin
      .from('orders')
      .update({ status: 'approved' })
      .eq('id', orderId)

    if (updateOrderError) throw updateOrderError

    const { error: updateTicketsError } = await supabaseAdmin
      .from('tickets')
      .update({ status: 'valid' })
      .eq('order_id', orderId)

    if (updateTicketsError) throw updateTicketsError

    const { data: tickets } = await supabaseAdmin
      .from('tickets')
      .select('id')
      .eq('order_id', orderId)

    const currentSold = order.ticket_types?.sold || 0
    await supabaseAdmin
      .from('ticket_types')
      .update({ sold: currentSold + order.quantity })
      .eq('id', order.ticket_type_id)

    // Enviar email
    if (tickets && tickets.length > 0) {
      const ticketUrl = `https://eibticket.vercel.app/ticket/${tickets[0].id}`
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
