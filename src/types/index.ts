// ============================================================
// TIKZET - Tipos principales
// ============================================================

export type Country = {
  id: 'AR' | 'MX' | 'CR'
  name: string
  currency: string
  currency_symbol: string
  payment_instructions: string
  payment_holder: string
  payment_label: string
}

export type Organizer = {
  id: string
  user_id: string
  name: string
  email: string
  slug: string
  logo_url?: string
  country_id: string
  created_at: string
}

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'finished'

export type Event = {
  id: string
  organizer_id: string
  country_id: string
  title: string
  description?: string
  banner_url?: string
  location: string
  address?: string
  starts_at: string
  ends_at?: string
  status: EventStatus
  created_at: string
  updated_at: string
  // Joins
  organizer?: Organizer
  country?: Country
  ticket_types?: TicketType[]
}

export type TicketType = {
  id: string
  event_id: string
  name: string
  description?: string
  price: number
  capacity: number
  sold: number
  available_from?: string
  available_until?: string
  created_at: string
}

export type OrderStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'cancelled'

export type Order = {
  id: string
  event_id: string
  ticket_type_id: string
  country_id: string
  buyer_name: string
  buyer_email: string
  buyer_phone?: string
  quantity: number
  unit_price: number
  total_price: number
  currency: string
  status: OrderStatus
  receipt_url?: string
  receipt_uploaded_at?: string
  rejection_reason?: string
  notes?: string
  created_at: string
  updated_at: string
  // Joins
  event?: Event
  ticket_type?: TicketType
  tickets?: Ticket[]
}

export type TicketStatus = 'pending' | 'valid' | 'used' | 'cancelled'

export type Ticket = {
  id: string
  order_id: string
  event_id: string
  ticket_type_id: string
  attendee_name: string
  attendee_email?: string
  qr_code: string
  qr_url?: string
  status: TicketStatus
  validated_at?: string
  validated_by?: string
  created_at: string
  // Joins
  event?: Event
  ticket_type?: TicketType
}

// ============================================================
// Formularios
// ============================================================

export type CreateOrderForm = {
  buyer_name: string
  buyer_email: string
  buyer_phone?: string
  quantity: number
  ticket_type_id: string
}

export type UploadReceiptForm = {
  receipt: FileList
}
