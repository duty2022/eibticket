export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// POST /api/tickets/validate — validar un QR en la puerta
// Simplificado para modo emergencia sin validación de JWT si no es necesario,
// pero por ahora mantenemos la lógica pero con manejo de errores mejorado.
export async function POST(req: NextRequest) {
  try {
    const { qr_code } = await req.json()

    if (!qr_code) {
      return NextResponse.json({ error: 'Código QR requerido' }, { status: 400 })
    }

    // Buscar el ticket
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*, event:events(*, organizer:organizers(*)), ticket_type:ticket_types(*)')
      .eq('qr_code', qr_code)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json(
        {
          valid: false,
          status: 'not_found',
          message: '❌ Ticket no encontrado',
        },
        { status: 404 }
      )
    }

    // Verificar estado del ticket
    if (ticket.status === 'used') {
      return NextResponse.json({
        valid: false,
        status: 'already_used',
        message: '⚠️ Ticket ya utilizado',
        validated_at: ticket.validated_at,
        attendee_name: ticket.attendee_name,
      })
    }

    if (ticket.status === 'cancelled' || ticket.status === 'pending') {
      return NextResponse.json({
        valid: false,
        status: ticket.status,
        message: '❌ Ticket no válido',
      })
    }

    // Ticket válido — marcar como usado
    const now = new Date().toISOString()
    await supabaseAdmin
      .from('tickets')
      .update({
        status: 'used',
        validated_at: now
      })
      .eq('id', ticket.id)

    return NextResponse.json({
      valid: true,
      status: 'used',
      message: '✅ Ticket válido',
      ticket: {
        id: ticket.id,
        attendee_name: ticket.attendee_name,
        ticket_type: ticket.ticket_type?.name || 'General',
        event_title: ticket.event?.title || 'Evento',
        validated_at: now,
      },
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Error interno de validación' }, { status: 500 })
  }
}
