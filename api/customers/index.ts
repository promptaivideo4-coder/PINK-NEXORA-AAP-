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

// Helper to verify user is staff of salon
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

// GET /api/customers - List customers for a salon
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { salon_id, search, customer_type, page, limit, sort_by, sort_order } = req.query;

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
      .from('customers')
      .select('*, bookings(count as total_bookings, max(created_at) as last_booking_at)')
      .eq('salon_id', salon_id);

    // Filter by search term (name, phone, email)
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`
        ilike(first_name,${searchTerm}),
        ilike(last_name,${searchTerm}),
        ilike(full_name,${searchTerm}),
        ilike(phone,${searchTerm}),
        ilike(email,${searchTerm})
      `);
    }

    // Filter by customer type
    if (customer_type) {
      query = query.eq('customer_type', customer_type as string);
    }

    // Default: only active (non-deleted) customers
    query = query.is('deleted_at', null).eq('is_active', true);

    // Sorting
    const sortColumn = sort_by as string || 'last_visit_at';
    const order = sort_order as string || 'desc';
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // Pagination
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 50;
    const offset = (pageNum - 1) * limitNum;
    
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return res.status(500).json({ error: 'Failed to fetch customers' });
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
    console.error('Customers GET error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/customers/:id - Get single customer
async function handleGetById(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select(`
        *,
        bookings(
          id, appointment_start, appointment_end, status, total_paise, advance_paise,
          services(name, duration_minutes),
          staff(full_name)
        )
      `)
      .eq('id', id as string)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonStaffAccess(user.id, customer.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    return res.status(200).json({ data: customer });
  } catch (error) {
    console.error('Customer GET by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/customers - Create new customer
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { salon_id, ...customerData } = req.body;

  if (!salon_id) {
    return res.status(400).json({ error: 'salon_id is required' });
  }
  if (!customerData.phone) {
    return res.status(400).json({ error: 'phone is required' });
  }

  // Verify user has access to this salon
  const hasAccess = await verifySalonAccess(user.id, salon_id);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Forbidden - No access to this salon' });
  }

  try {
    // Check if customer with this phone already exists for this salon
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('salon_id', salon_id)
      .eq('phone', customerData.phone)
      .is('deleted_at', null)
      .maybeSingle();

    if (existingCustomer) {
      return res.status(409).json({ 
        error: 'Customer with this phone number already exists for this salon',
        existingId: existingCustomer.id
      });
    }

    // Create customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .insert({
        salon_id,
        user_id: customerData.user_id || null,
        first_name: customerData.first_name || 'Customer',
        last_name: customerData.last_name || '',
        phone: customerData.phone,
        email: customerData.email || null,
        whatsapp_number: customerData.whatsapp_number || null,
        address: customerData.address || null,
        city: customerData.city || null,
        state: customerData.state || null,
        pincode: customerData.pincode || null,
        customer_type: customerData.customer_type || 'Standard',
        notes: customerData.notes || null,
        tags: customerData.tags || [],
        join_date: customerData.join_date || new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (customerError || !customer) {
      console.error('Error creating customer:', customerError);
      return res.status(500).json({ error: 'Failed to create customer' });
    }

    return res.status(201).json({ data: customer });
  } catch (error) {
    console.error('Customers POST error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/customers/:id - Update customer
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  try {
    // Get the customer to verify salon access
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('salon_id')
      .eq('id', id as string)
      .maybeSingle();

    if (fetchError || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonAccess(user.id, customer.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    // Update customer
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id as string)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating customer:', updateError);
      return res.status(500).json({ error: 'Failed to update customer' });
    }

    return res.status(200).json({ data: updatedCustomer });
  } catch (error) {
    console.error('Customers PUT error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/customers/:id - Delete customer (soft delete)
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Customer ID is required' });
  }

  try {
    // Get the customer to verify salon access
    const { data: customer, error: fetchError } = await supabase
      .from('customers')
      .select('salon_id')
      .eq('id', id as string)
      .maybeSingle();

    if (fetchError || !customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonAccess(user.id, customer.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('customers')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id as string);

    if (deleteError) {
      console.error('Error deleting customer:', deleteError);
      return res.status(500).json({ error: 'Failed to delete customer' });
    }

    return res.status(200).json({ success: true, message: 'Customer deleted' });
  } catch (error) {
    console.error('Customers DELETE error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Main handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Handle /api/customers/:id
  if (req.url?.match(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/)) {
    if (method === 'GET') {
      return handleGetById(req, res);
    }
    if (method === 'PUT') {
      return handlePut(req, res);
    }
    if (method === 'DELETE') {
      return handleDelete(req, res);
    }
  }

  // Handle /api/customers
  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
