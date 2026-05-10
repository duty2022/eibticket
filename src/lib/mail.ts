import { Resend } from 'resend'

interface SendTicketEmailProps {
  to: string;
  buyerName: string;
  eventName: string;
  ticketUrl: string;
}

export async function sendTicketEmail({ to, buyerName, eventName, ticketUrl }: SendTicketEmailProps) {
  const apiKey = process.env.RESEND_API_KEY;
  
  if (!apiKey) {
    console.error('RESEND_API_KEY is not defined in environment variables');
    return { success: false, error: 'Configuración de correo faltante' };
  }

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'EIB Ticket <noreply@resend.dev>',
      to: [to],
      subject: `¡Tu entrada para ${eventName}! 🎫`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">¡Hola, ${buyerName}!</h2>
          <p style="font-size: 16px; color: #555;">Gracias por tu compra para <strong>${eventName}</strong>.</p>
          <p style="font-size: 16px; color: #555;">Ya podés ver tu ticket y el código QR haciendo clic en el siguiente botón:</p>
          
          <div style="text-align: center; margin: 40px 0;">
            <a href="${ticketUrl}" 
               style="background: #2563eb; color: white; padding: 18px 32px; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 18px; display: inline-block;">
              Ver mi Ticket 🎫
            </a>
          </div>
          
          <p style="font-size: 14px; color: #888; border-top: 1px solid #eee; pt-20px; margin-top: 40px;">
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
