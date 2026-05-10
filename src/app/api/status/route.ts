import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const start = Date.now()
    const { data, error } = await supabaseAdmin.from('events').select('id').limit(1)
    const duration = Date.now() - start

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: error.message,
        details: error,
        duration_ms: duration
      }, { status: 500 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database connection is working',
      data_sample: data,
      duration_ms: duration
    })
  } catch (err: any) {
    return NextResponse.json({
      status: 'exception',
      message: err.message,
      stack: err.stack
    }, { status: 500 })
  }
}
