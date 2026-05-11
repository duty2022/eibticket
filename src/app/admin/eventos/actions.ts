'use server'
import { supabaseAdmin } from '@/lib/supabase'

async function getOrCreateDouglasOrganizer() {
  let { data: organizer, error: orgError } = await supabaseAdmin
    .from('organizers')
    .select('id')
    .eq('email', 'eidarte@hotmail.com')
    .single()

  if (!organizer) {
    const { data: newOrg, error: createError } = await supabaseAdmin
      .from('organizers')
      .insert([{ name: 'Douglas', email: 'eidarte@hotmail.com' }])
      .select()
      .single()
    if (createError) throw createError
    organizer = newOrg
  }
  return organizer
}

export async function createEventWithBypass(eventData: any, ticketTypes: any[]) {
  try {
    const organizer = await getOrCreateDouglasOrganizer()

    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .insert([{ ...eventData, organizer_id: organizer?.id }])
      .select()
      .single()
    if (eventError) throw eventError

    const tickets = ticketTypes.map(tt => ({ ...tt, event_id: event.id, sold: 0 }))
    const { error: ticketsError } = await supabaseAdmin
      .from('ticket_types')
      .insert(tickets)
    if (ticketsError) throw ticketsError

    return { success: true, eventId: event.id }
  } catch (error: any) {
    console.error('Error in createEventWithBypass:', error)
    return { success: false, error: error.message }
  }
}

export async function updateEventWithBypass(eventId: string, eventData: any, ticketTypes: any[]) {
  try {
    const organizer = await getOrCreateDouglasOrganizer()

    const { error: eventError } = await supabaseAdmin
      .from('events')
      .update({ ...eventData, organizer_id: organizer?.id })
      .eq('id', eventId)
    if (eventError) throw eventError

    // Re-insert ticket types (delete old ones first)
    await supabaseAdmin.from('ticket_types').delete().eq('event_id', eventId)
    
    const tickets = ticketTypes.map(tt => ({ ...tt, event_id: eventId, sold: tt.sold || 0 }))
    const { error: ticketsError } = await supabaseAdmin
      .from('ticket_types')
      .insert(tickets)
    if (ticketsError) throw ticketsError

    return { success: true }
  } catch (error: any) {
    console.error('Error in updateEventWithBypass:', error)
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
