import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const start = Date.now()
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .limit(5)

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      events_found: data?.length || 0,
      events: data,
      duration_ms: Date.now() - start
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Unknown error',
      details: error,
      duration_ms: Date.now() - start
    }, { status: 500 })
  }
}
