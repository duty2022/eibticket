'use server'
// Trigger deploy for Douglas bypass - 2026-05-11
import { supabaseAdmin } from '@/lib/supabase'

export async function createEventWithBypass(eventData: any, ticketTypes: any[]) {
  try {
    let { data: organizer, error: orgError } = await supabaseAdmin.from('organizers').select('id').eq('email', 'eidarte@hotmail.com').single()

    if (!organizer) {
      const { data: newOrg, error: createError } = await supabaseAdmin.from('organizers').insert([{ name: 'Douglas', email: 'eidarte@hotmail.com' }]).select().single()
      if (createError) throw createError
      organizer = newOrg
    }

    const { data: event, error: eventError } = await supabaseAdmin.from('events').insert([{ ...eventData, organizer_id: organizer?.id }]).select().single()
    if (eventError) throw eventError

    const tickets = ticketTypes.map(tt => ({ ...tt, event_id: event.id }))
    const { error: ticketsError } = await supabaseAdmin.from('ticket_types').insert(tickets)
    if (ticketsError) throw ticketsError

    return { success: true, eventId: event.id }
  } catch (error: any) {
    console.error('Error in createEventWithBypass:', error)
    return { success: false, error: error.message }
  }
}

export async function deleteEvent(id: string) {
  try {
    const { error } = await supabaseAdmin.from('events').delete().eq('id', id)
    if (error) throw error
    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteEvent:', error)
    return { success: false, error: error.message }
  }
}
