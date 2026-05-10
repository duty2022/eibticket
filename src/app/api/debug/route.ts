import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  // 1. Conteo total por status
  const { data: statusCounts } = await supabaseAdmin
    .from('tickets')
    .select('status')

  const stats = statusCounts?.reduce((acc: any, curr: any) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1
    return acc
  }, {})

  // 2. Ver si hay discrepancia en ticket_types.sold
  const { data: eventStats } = await supabaseAdmin
    .from('events')
    .select('id, title, ticket_types(id, name, sold, capacity)')

  // 3. Últimos tickets para ver nombres y estados
  const { data: lastTickets } = await supabaseAdmin
    .from('tickets')
    .select('id, attendee_name, status, created_at, validated_at, qr_code')
    .order('created_at', { ascending: false })
    .limit(20)
    
  return NextResponse.json({ 
    summary: stats,
    events: eventStats,
    lastTickets 
  })
}
