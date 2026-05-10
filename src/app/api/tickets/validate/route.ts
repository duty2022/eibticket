import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// POST /api/tickets/validate — validar un QR en la puerta
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticación (solo organizadores/staff)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

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

    // Verificar que el organizador tiene permisos sobre este evento
    if (ticket.event.organizer.user_id !== user.id) {
      return NextResponse.json({ error: 'Sin permisos para este evento' }, { status: 403 })
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
        validated_at: now,
        validated_by: user.id,
      })
      .eq('id', ticket.id)

    return NextResponse.json({
      valid: true,
      status: 'used',
      message: '✅ Ticket válido',
      ticket: {
        id: ticket.id,
        attendee_name: ticket.attendee_name,
        ticket_type: ticket.ticket_type.name,
        event_title: ticket.event.title,
        validated_at: now,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
