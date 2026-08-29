import type { IncomingMessage, ServerResponse } from 'node:http';
import { createClient } from '@supabase/supabase-js';

type NextApiRequest = IncomingMessage & {
  method?: string;
  body?: any;
  query: Record<string, string | string[] | undefined>;
};
type NextApiResponse = ServerResponse & {
  status: (code: number) => NextApiResponse;
  json: (body: unknown) => void;
};

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://qwaehqsmodekbgvnaavz.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  throw new Error('Supabase anonymous key is required');
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

// Helper to get authenticated user
async function getAuthenticatedUser(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return user;
  } catch {
    return null;
  }
}

// Helper to verify user has access to salon
async function verifySalonAccess(userId: string, salonId: string) {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('user_id', userId)
    .eq('organization_id', salonId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.status === 'active' && ['owner', 'manager', 'admin'].includes(data.role);
}

// Helper to verify user is staff or owner of salon
async function verifySalonStaffAccess(userId: string, salonId: string) {
  const { data, error } = await supabase
    .from('organization_members')
    .select('role, status')
    .eq('user_id', userId)
    .eq('organization_id', salonId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return data.status === 'active' && ['owner', 'manager', 'admin', 'staff', 'receptionist'].includes(data.role);
}

// GET /api/bookings - List bookings for a salon
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { salon_id, status, start_date, end_date, staff_id, customer_id, page, limit } = req.query;

  if (!salon_id) {
    return res.status(400).json({ error: 'salon_id is required' });
  }

  // Verify user has access to this salon
  const hasAccess = await verifySalonStaffAccess(user.id, salon_id as string);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Forbidden - No access to this salon' });
  }

  try {
    let query = supabase
      .from('bookings')
      .select(`
        *,
        customers(id, first_name, last_name, full_name, phone, email, customer_type),
        staff(id, full_name, phone, primary_role),
        booking_items(id, service_id, unit_price_paise, quantity, line_total_paise)
      `)
      .eq('salon_id', salon_id);

    // Filter by status
    if (status) {
      query = query.eq('status', status as string);
    }

    // Filter by staff
    if (staff_id) {
      query = query.eq('staff_id', staff_id as string);
    }

    // Filter by customer
    if (customer_id) {
      query = query.eq('customer_id', customer_id as string);
    }

    // Filter by date range
    if (start_date) {
      query = query.gte('appointment_start', start_date as string);
    }
    if (end_date) {
      query = query.lte('appointment_start', end_date as string);
    }

    // Default: only active (non-deleted) bookings
    query = query.is('deleted_at', null);

    // Order by appointment start time
    query = query.order('appointment_start', { ascending: false });

    // Pagination
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const offset = (pageNum - 1) * limitNum;
    
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }

    return res.status(200).json({ 
      data,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limitNum) : 0,
      }
    });
  } catch (error) {
    console.error('Bookings GET error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/bookings/:id - Get single booking
async function handleGetById(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  try {
    const { data: booking, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customers(id, first_name, last_name, full_name, phone, email, customer_type, address, city),
        staff(id, full_name, phone, primary_role, specialty),
        salon_id,
        booking_items(id, service_id, unit_price_paise, quantity, line_total_paise, services(name, duration_minutes))
      `)
      .eq('id', id as string)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonStaffAccess(user.id, booking.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    return res.status(200).json({ data: booking });
  } catch (error) {
    console.error('Booking GET by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/bookings - Create new booking
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { salon_id, services, staff_id, appointment_start, appointment_end, advance_paise, notes } = req.body || {};
  let customer_id = req.body?.customer_id;

  if (!salon_id) {
    return res.status(400).json({ error: 'salon_id is required' });
  }
  if (!appointment_start || !appointment_end) {
    return res.status(400).json({ error: 'appointment_start and appointment_end are required' });
  }
  if (!services || !Array.isArray(services) || services.length === 0) {
    return res.status(400).json({ error: 'At least one service is required' });
  }

  // Verify user has access to this salon
  const hasAccess = await verifySalonAccess(user.id, salon_id);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Forbidden - No access to this salon' });
  }

  try {
    // Calculate total from services
    const total_paise = services.reduce((sum: number, service: any) => {
      return sum + (service.price_paise || 0) * (service.quantity || 1);
    }, 0);

    // Validate customer exists or create new one
    let customerData;
    if (customer_id) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customer_id)
        .eq('salon_id', salon_id)
        .maybeSingle();
      
      if (!existingCustomer) {
        return res.status(400).json({ error: 'Customer not found for this salon' });
      }
      customerData = existingCustomer;
    } else {
      // Create new customer
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          salon_id,
          first_name: req.body.customer_first_name || 'Customer',
          last_name: req.body.customer_last_name || '',
          phone: req.body.customer_phone || '',
          email: req.body.customer_email || '',
        })
        .select()
        .single();

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError);
        return res.status(500).json({ error: 'Failed to create customer' });
      }
      customerData = newCustomer;
      customer_id = newCustomer.id;
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        salon_id,
        customer_id,
        staff_id: staff_id || null,
        appointment_start,
        appointment_end,
        status: 'confirmed',
        total_paise,
        advance_paise: advance_paise || 0,
        payment_status: advance_paise > 0 ? 'partial' : 'pending',
        customer_name: customerData.full_name || `${customerData.first_name} ${customerData.last_name || ''}`.trim(),
        customer_phone: customerData.phone || '',
        customer_email: customerData.email || '',
        notes: notes || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bookingError || !booking) {
      console.error('Error creating booking:', bookingError);
      return res.status(500).json({ error: 'Failed to create booking' });
    }

    // Create booking items
    const bookingItems = services.map((service: any) => ({
      booking_id: booking.id,
      service_id: service.id,
      staff_id: service.staff_id || staff_id || null,
      unit_price_paise: service.price_paise || 0,
      quantity: service.quantity || 1,
    }));

    const { error: itemsError } = await supabase
      .from('booking_items')
      .insert(bookingItems);

    if (itemsError) {
      console.error('Error creating booking items:', itemsError);
      // Rollback: delete the booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      return res.status(500).json({ error: 'Failed to create booking items' });
    }

    // Return full booking with items
    const { data: fullBooking } = await supabase
      .from('bookings')
      .select(`
        *,
        customers(id, first_name, last_name, full_name, phone, email),
        staff(id, full_name, phone),
        booking_items(id, service_id, unit_price_paise, quantity, line_total_paise)
      `)
      .eq('id', booking.id)
      .maybeSingle();

    return res.status(201).json({ data: fullBooking });
  } catch (error) {
    console.error('Bookings POST error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/bookings/:id - Update booking
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  try {
    // Get the booking to verify salon access
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('salon_id, status')
      .eq('id', id as string)
      .maybeSingle();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonAccess(user.id, booking.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    // Prevent modifying completed/cancelled bookings
    if (['completed', 'cancelled', 'no_show'].includes(booking.status)) {
      return res.status(400).json({ error: 'Cannot modify a completed or cancelled booking' });
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id as string)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating booking:', updateError);
      return res.status(500).json({ error: 'Failed to update booking' });
    }

    return res.status(200).json({ data: updatedBooking });
  } catch (error) {
    console.error('Bookings PUT error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/bookings/:id/cancel - Cancel booking
async function handleCancel(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const { reason, refund_advance } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Booking ID is required' });
  }

  try {
    // Get the booking to verify access
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('salon_id, status, advance_paise, customer_id')
      .eq('id', id as string)
      .maybeSingle();

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonStaffAccess(user.id, booking.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    // Cannot cancel already completed/cancelled bookings
    if (['completed', 'cancelled', 'no_show'].includes(booking.status)) {
      return res.status(400).json({ error: 'Booking cannot be cancelled' });
    }

    // Update booking status
    const { data: cancelledBooking, error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'cancelled',
        cancellation_reason: reason || null,
        cancelled_at: new Date().toISOString(),
        payment_status: refund_advance ? 'refunded' : (booking as { payment_status?: string }).payment_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id as string)
      .select()
      .single();

    if (updateError) {
      console.error('Error cancelling booking:', updateError);
      return res.status(500).json({ error: 'Failed to cancel booking' });
    }

    // TODO: Handle refund logic for advance payments
    if (refund_advance && booking.advance_paise > 0) {
      // This would integrate with Razorpay refund API
      console.log('Refund required for booking:', id, 'Amount:', booking.advance_paise);
    }

    return res.status(200).json({ 
      data: cancelledBooking,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Bookings CANCEL error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Main handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Handle /api/bookings/:id/cancel separately
  if (req.url?.includes('/cancel')) {
    return handleCancel(req, res);
  }

  // Handle /api/bookings/:id
  if (req.url?.match(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
    if (method === 'GET') {
      return handleGetById(req, res);
    }
    if (method === 'PUT') {
      return handlePut(req, res);
    }
  }

  // Handle /api/bookings
  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
