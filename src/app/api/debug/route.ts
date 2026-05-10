import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('tickets')
    .select('attendee_name, status, qr_code, validated_at')
    .order('validated_at', { ascending: false })
    .limit(10)
    
  return NextResponse.json({ data, error })
}
