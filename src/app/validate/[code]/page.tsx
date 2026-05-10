export const dynamic = "force-dynamic"

export const dynamic = "force-dynamic"
// Esta página es el destino del QR cuando lo escanea un celular normal (no el scanner admin).
// Redirige a la página del ticket para mostrar los datos.
import { redirect } from 'next/navigation'

export default function ValidatePage({ params }: { params: { code: string } }) {
  redirect(`/ticket/${params.code}`)
}
