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
        message: err.message,
        details: err,
        env: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10)}...` : 'MISSING',
          service: process.env.SUPABASE_SERVICE_ROLE_KEY ? `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...` : 'MISSING',
        },
        duration_ms: duration
      }, { status: 500 })
    }(

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
