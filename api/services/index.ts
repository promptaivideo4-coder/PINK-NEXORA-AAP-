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

// GET /api/services - List services for a salon
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { salon_id, category, is_active, search, page, limit, sort_by, sort_order } = req.query;

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
      .from('services')
      .select('*, staff_services(staff_id, custom_price_paise, custom_duration_minutes, is_active)')
      .eq('salon_id', salon_id);

    // Filter by category
    if (category) {
      query = query.eq('category', category as string);
    }

    // Filter by active status
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    } else {
      query = query.eq('is_active', true);
    }

    // Filter by search term
    if (search) {
      const searchTerm = `%${search}%`;
      query = query.or(`
        ilike(name,${searchTerm}),
        ilike(description,${searchTerm}),
        ilike(category,${searchTerm})
      `);
    }

    // Default: only active (non-deleted) services
    query = query.is('deleted_at', null);

    // Sorting
    const sortColumn = sort_by as string || 'sort_order';
    const order = sort_order as string || 'asc';
    query = query.order(sortColumn, { ascending: order === 'asc' });

    // Pagination
    const pageNum = page ? parseInt(page as string, 10) : 1;
    const limitNum = limit ? parseInt(limit as string, 10) : 100;
    const offset = (pageNum - 1) * limitNum;
    
    query = query.range(offset, offset + limitNum - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return res.status(500).json({ error: 'Failed to fetch services' });
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
    console.error('Services GET error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/services/:id - Get single service
async function handleGetById(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Service ID is required' });
  }

  try {
    const { data: service, error } = await supabase
      .from('services')
      .select(`
        *,
        staff_services(staff_id, custom_price_paise, custom_duration_minutes, is_active, staff(full_name))
      `)
      .eq('id', id as string)
      .is('deleted_at', null)
      .maybeSingle();

    if (error || !service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonStaffAccess(user.id, service.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    return res.status(200).json({ data: service });
  } catch (error) {
    console.error('Service GET by ID error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/services - Create new service
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { salon_id, ...serviceData } = req.body;

  if (!salon_id) {
    return res.status(400).json({ error: 'salon_id is required' });
  }
  if (!serviceData.name) {
    return res.status(400).json({ error: 'name is required' });
  }
  if (!serviceData.price_paise && serviceData.price_paise !== 0) {
    return res.status(400).json({ error: 'price_paise is required' });
  }
  if (!serviceData.duration_minutes && serviceData.duration_minutes !== 0) {
    return res.status(400).json({ error: 'duration_minutes is required' });
  }

  // Verify user has access to this salon
  const hasAccess = await verifySalonAccess(user.id, salon_id);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Forbidden - No access to this salon' });
  }

  try {
    // Get next sort order
    const { count } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salon_id)
      .is('deleted_at', null);

    const sortOrder = (count || 0) + 1;

    // Create service
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .insert({
        salon_id,
        name: serviceData.name,
        description: serviceData.description || null,
        category: serviceData.category || 'Hair',
        price_paise: serviceData.price_paise,
        duration_minutes: serviceData.duration_minutes,
        is_active: serviceData.is_active !== undefined ? serviceData.is_active : true,
        is_popular: serviceData.is_popular || false,
        sort_order: serviceData.sort_order || sortOrder,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (serviceError || !service) {
      console.error('Error creating service:', serviceError);
      return res.status(500).json({ error: 'Failed to create service' });
    }

    // If staff assignments provided, create them
    if (serviceData.staff_ids && Array.isArray(serviceData.staff_ids)) {
      const staffServices = serviceData.staff_ids.map((staffId: string) => ({
        staff_id: staffId,
        service_id: service.id,
        custom_price_paise: serviceData.price_paise,
        custom_duration_minutes: serviceData.duration_minutes,
        is_active: true,
        created_at: new Date().toISOString(),
      }));

      const { error: staffError } = await supabase
        .from('staff_services')
        .insert(staffServices);

      if (staffError) {
        console.error('Error creating staff services:', staffError);
        // Continue without failing - staff can be assigned later
      }
    }

    return res.status(201).json({ data: service });
  } catch (error) {
    console.error('Services POST error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/services/:id - Update service
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Service ID is required' });
  }

  try {
    // Get the service to verify salon access
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('salon_id')
      .eq('id', id as string)
      .maybeSingle();

    if (fetchError || !service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonAccess(user.id, service.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    // Update service
    const { data: updatedService, error: updateError } = await supabase
      .from('services')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id as string)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return res.status(500).json({ error: 'Failed to update service' });
    }

    return res.status(200).json({ data: updatedService });
  } catch (error) {
    console.error('Services PUT error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/services/:id - Delete service (soft delete)
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Service ID is required' });
  }

  try {
    // Get the service to verify salon access
    const { data: service, error: fetchError } = await supabase
      .from('services')
      .select('salon_id')
      .eq('id', id as string)
      .maybeSingle();

    if (fetchError || !service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonAccess(user.id, service.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('services')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id as string);

    if (deleteError) {
      console.error('Error deleting service:', deleteError);
      return res.status(500).json({ error: 'Failed to delete service' });
    }

    return res.status(200).json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('Services DELETE error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Main handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  // Handle /api/services/:id
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

  // Handle /api/services
  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
