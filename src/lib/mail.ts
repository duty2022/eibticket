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

  const resend = new Resend(apiKey);
  const ticketUrl = `${appUrl}/order/${orderId}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'EIB Ticket <tickets@eibinternacional.com>',
      to: [to],
      subject: `¡Tu pago para ${eventName} ha sido aprobado! 🎫`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">¡Hola, ${buyerName}!</h2>
          <p style="font-size: 16px; color: #555;">Buenas noticias: tu pago para <strong>${eventName}</strong> ya fue aprobado.</p>
          <p style="font-size: 16px; color: #555;">Ya podés acceder a tus pases y códigos QR haciendo clic en el siguiente botón:</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${ticketUrl}" 
               style="background: #2563eb; color: white; padding: 18px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block;">
              Ver mis Pases 🎫
            </a>
          </div>
          
          <p style="font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px;">
            Presentá el código QR en la entrada desde tu celular. ¡Que disfrutes el evento!
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Mail catch error:', error)
    return { success: false, error }
  }
}
