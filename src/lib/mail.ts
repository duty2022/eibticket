import { Resend } from 'resend'

interface SendTicketEmailProps {
  to: string;
  buyerName: string;
  eventName: string;
  orderId: string;
}

export async function sendTicketEmail({ to, buyerName, eventName, orderId }: SendTicketEmailProps) {
  const apiKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://eibticket.vercel.app';
  
  if (!apiKey) {
    console.error('RESEND_API_KEY is not defined');
    return { success: false, error: 'Configuración de correo faltante' };
  }

  // LOG PARA DEPURACIÓN EN VERCEL
  console.log(`[MAIL] Intentando enviar a: ${to} para el evento: ${eventName}`);

  const resend = new Resend(apiKey);
  const ticketUrl = `${appUrl}/order/${orderId}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'EIB Ticket <noreply@resend.dev>',
      to: [to],
      subject: `Tus pases para ${eventName} 🎫`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">¡Hola, ${buyerName}!</h2>
          <p style="font-size: 16px; color: #555;">Tu pago para <strong>${eventName}</strong> ha sido confirmado.</p>
          <p style="font-size: 16px; color: #555;">Podés acceder a tus pases aquí:</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${ticketUrl}" 
               style="background: #000000; color: white; padding: 18px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block;">
              Ver mis Pases 🎫
            </a>
          </div>
          
          <p style="font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px;">
            Presentá el código QR en la entrada desde tu celular.
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('[MAIL] Resend Error:', JSON.stringify(error));
      return { success: false, error };
    }

    console.log('[MAIL] Envío exitoso:', data?.id);
    return { success: true, data };
  } catch (error) {
    console.error('[MAIL] Exception:', error);
    return { success: false, error };
  }
}
