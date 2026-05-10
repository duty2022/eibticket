import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const start = Date.now()
  try {
    // Probar conexión a la base de datos usando el cliente admin
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      message: 'Connection successful with hardcoded keys',
      data_count: data?.length || 0,
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
