import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = "force-dynamic"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData()
    const file = formData.get('receipt') as File

    if (!file) {
      return NextResponse.json({ error: 'No se subió ningún archivo' }, { status: 400 })
    }

    const orderId = params.id

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${orderId}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `receipts/${fileName}`

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const { error: uploadError } = await supabaseAdmin.storage
      .from('receipts')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Error al subir el archivo' }, { status: 500 })
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('receipts')
      .getPublicUrl(filePath)

    const { error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'reviewing',
        receipt_url: publicUrl,
        receipt_uploaded_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      return NextResponse.json({ error: 'Error al actualizar la orden' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Receipt upload error:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
