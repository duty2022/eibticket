import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'

/**
 * Genera un código único para el QR
 */
export function generateQRCode(): string {
  return uuidv4().replace(/-/g, '').toUpperCase()
}

/**
 * Genera la imagen QR en base64 a partir del código
 */
export async function generateQRImage(code: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/validate/${code}`
  const dataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'H',
  })
  return dataUrl
}

/**
 * Genera el QR como SVG string
 */
export async function generateQRSVG(code: string): Promise<string> {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/validate/${code}`
  return await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'H' })
}
