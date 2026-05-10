export const dynamic = "force-dynamic"
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { qr_code } = await req.json()

    if (!qr_code) {
      return NextResponse.json({ error: 'Código QR requerido' }, { status: 400 })
    }

    // 1. Buscar el ticket PRIMERO sin actualizar nada
    const { data: ticket, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .select('*, event:events(*), ticket_type:ticket_types(*)')
      .eq('qr_code', qr_code)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({
        valid: false,
        status: 'not_found',
        message: '❌ Ticket no encontrado',
      }, { status: 404 })
    }

    // 2. Si YA está usado, avisar inmediatamente
    if (ticket.status === 'used') {
      return NextResponse.json({
        valid: false,
        status: 'already_used',
        message: '⚠️ Ticket ya utilizado',
        validated_at: ticket.validated_at,
        attendee_name: ticket.attendee_name,
      })
    }

    // 3. Si es válido (status === 'confirmed' o similar), marcar como usado
    const now = new Date().toISOString()
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'used',
        validated_at: now
      })
      .eq('id', ticket.id)

    if (updateError) {
      throw updateError
    }

    // 4. Responder ÉXITO
    return NextResponse.json({
      valid: true,
      status: 'success',
      message: '✅ Ticket válido',
      ticket: {
        attendee_name: ticket.attendee_name,
        ticket_type: ticket.ticket_type?.name || 'General',
        validated_at: now,
      },
    })

  } catch (err) {
    console.error('Error en validación:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
