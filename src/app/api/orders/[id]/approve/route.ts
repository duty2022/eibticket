import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import QRCode from 'qrcode'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // 1. Obtener la orden y tickets
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*, event:events(*)')
      .eq('id', id)
      .single()

    if (orderError || !order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from('tickets')
      .select('*')
      .eq('order_id', id)

    if (ticketsError || !tickets) return NextResponse.json({ error: 'Tickets no encontrados' }, { status: 404 })

    // 2. Procesar tickets uno por uno (Sencillo)
    const updatedTickets = []
    for (const ticket of tickets) {
      const qrPath = `qrs/${ticket.qr_code}.png`
      const url = `${process.env.NEXT_PUBLIC_APP_URL}/validate/${ticket.qr_code}`
      
      // Generar QR Buffer directamente
      const qrBuffer = await QRCode.toBuffer(url, {
        width: 400,
        margin: 2,
        errorCorrectionLevel: 'H',
      })

      // Subir a Storage
      await supabaseAdmin.storage
        .from('tickets')
        .upload(qrPath, qrBuffer, { contentType: 'image/png', upsert: true })

      const { data: qrUrl } = supabaseAdmin.storage.from('tickets').getPublicUrl(qrPath)

      // Actualizar ticket
      const { data: ut } = await supabaseAdmin
        .from('tickets')
        .update({ status: 'valid', qr_url: qrUrl.publicUrl })
        .eq('id', ticket.id)
        .select()
        .single()
      
      updatedTickets.push(ut)
    }

    // 3. Actualizar orden
    const { data: updatedOrder } = await supabaseAdmin
      .from('orders')
      .update({ status: 'approved' })
      .eq('id', id)
      .select('*, event:events(title, starts_at, location), ticket_type:ticket_types(name)')
      .single()

    // 4. Incrementar contador
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
    console.error('Error:', error)
    return NextResponse.json({ error: 'Error al procesar' }, { status: 500 })
  }
}
