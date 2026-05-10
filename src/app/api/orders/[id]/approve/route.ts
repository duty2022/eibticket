import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, ticket_types(*)')
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

    const currentSold = order.ticket_types?.sold || 0
    await supabaseAdmin
      .from('ticket_types')
      .update({ sold: currentSold + order.quantity })
      .eq('id', order.ticket_type_id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Approve error:', error)
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 })
  }
}
