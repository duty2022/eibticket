import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateQRCode } from '@/lib/qr'
import { z } from 'zod'

const createOrderSchema = z.object({
  event_id: z.string().uuid(),
  ticket_type_id: z.string().uuid(),
  buyer_name: z.string().min(2),
  buyer_email: z.string().email(),
  buyer_phone: z.string().optional(),
  quantity: z.number().int().min(1).max(10),
})

// POST /api/orders — crear una orden nueva
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = createOrderSchema.parse(body)

    // 1. Obtener evento y tipo de ticket
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*, country:countries(*)')
      .eq('id', data.event_id)
      .eq('status', 'published')
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Evento no encontrado' }, { status: 404 })
    }

    const { data: ticketType, error: ttError } = await supabaseAdmin
      .from('ticket_types')
      .select('*')
      .eq('id', data.ticket_type_id)
      .eq('event_id', data.event_id)
      .single()

    if (ttError || !ticketType) {
      return NextResponse.json({ error: 'Tipo de ticket no encontrado' }, { status: 404 })
    }

    // 2. Verificar disponibilidad
    const available = ticketType.capacity - ticketType.sold
    if (available < data.quantity) {
      return NextResponse.json(
        { error: `Solo quedan ${available} tickets disponibles` },
        { status: 400 }
      )
    }

    // 3. Calcular precio
    const unit_price = ticketType.price
    const total_price = unit_price * data.quantity

    // 4. Crear la orden
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        event_id: data.event_id,
        ticket_type_id: data.ticket_type_id,
        country_id: event.country_id,
        buyer_name: data.buyer_name,
        buyer_email: data.buyer_email,
        buyer_phone: data.buyer_phone,
        quantity: data.quantity,
        unit_price,
        total_price,
        currency: event.country.currency,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Error al crear la orden' }, { status: 500 })
    }

    // 5. Pre-generar los tickets (en estado pending, sin QR aún)
    //    Los QR se generan cuando se aprueba el pago
    const ticketsToInsert = Array.from({ length: data.quantity }, () => ({
      order_id: order.id,
      event_id: data.event_id,
      ticket_type_id: data.ticket_type_id,
      attendee_name: data.buyer_name,
      attendee_email: data.buyer_email,
      qr_code: generateQRCode(),
      status: 'pending',
    }))

    await supabaseAdmin.from('tickets').insert(ticketsToInsert)

    // Datos de pago: usar los del evento si existen, sino los del país (Opción C)
    const paymentLabel        = event.payment_label        || event.country.payment_label
    const paymentInstructions = event.payment_instructions || event.country.payment_instructions
    const paymentHolder       = event.payment_holder       || event.country.payment_holder

    return NextResponse.json({
      order,
      payment_instructions: {
        country_id: event.country_id,
        label: paymentLabel,
        instructions: paymentInstructions,
        holder: paymentHolder,
        amount: total_price,
        currency: event.country.currency,
        currency_symbol: event.country.currency_symbol,
        reference: order.id.slice(0, 8).toUpperCase(),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
