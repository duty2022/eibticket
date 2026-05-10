import { Resend } from 'resend'
const resend = new Resend(process.env.RESEND_API_KEY)
export async function sendTicketEmail({to, buyerName, eventName, ticketUrl}) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'EIB Ticket <noreply@resend.dev>',
      to: [to],
      subject: `¡Tu entrada para ${eventName}! 🎫`,
      html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;"><h2>¡Hola, ${buyerName}!</h2><p>Gracias por tu compra para <strong>${eventName}</strong>.</p><p>Ya podés ver tu ticket haciendo clic acá:</p><div style="text-align: center; margin: 30px 0;"><a href="${ticketUrl}" style="background: #10b981; color: white; padding: 15px 25px; border-radius: 10px; text-decoration: none; font-weight: bold;">Ver mi Ticket 🎫</a></div><p>Presentalo en la entrada. ¡Que disfrutes el evento!</p></div>`,
    })
    return { success: !error, data, error }
  } catch (error) { return { success: false, error } }
}
