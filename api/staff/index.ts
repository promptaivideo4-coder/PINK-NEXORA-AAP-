import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

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
async function verifyStaffAccess(userId: string, salonId: string) {
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

// GET /api/staff - List staff for a salon
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { salon_id, include_inactive } = req.query;

  if (!salon_id) {
    return res.status(400).json({ error: 'salon_id is required' });
  }

  // Verify user has access to this salon
  const hasAccess = await verifySalonAccess(user.id, salon_id as string);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Forbidden - No access to this salon' });
  }

  try {
    let query = supabase
      .from('staff')
      .select('*, staff_roles(name as role_name, description as role_description)')
      .eq('salon_id', salon_id);

    if (!include_inactive || include_inactive === 'false') {
      query = query.eq('deleted_at', null).eq('is_active', true);
    }

    const { data, error } = await query.order('full_name', { ascending: true });

    if (error) {
      console.error('Error fetching staff:', error);
      return res.status(500).json({ error: 'Failed to fetch staff' });
    }

    return res.status(200).json({ data });
  } catch (error) {
    console.error('Staff GET error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/staff - Create new staff member
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { salon_id, ...staffData } = req.body;

  if (!salon_id) {
    return res.status(400).json({ error: 'salon_id is required' });
  }

  // Verify user has access to this salon
  const hasAccess = await verifySalonAccess(user.id, salon_id);
  if (!hasAccess) {
    return res.status(403).json({ error: 'Forbidden - No access to this salon' });
  }

  try {
    // Create staff member
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert({
        ...staffData,
        salon_id,
        organization_member_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (staffError) {
      console.error('Error creating staff:', staffError);
      return res.status(500).json({ error: 'Failed to create staff member' });
    }

    return res.status(201).json({ data: staff });
  } catch (error) {
    console.error('Staff POST error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// PUT /api/staff/:id - Update staff member
async function handlePut(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;
  const updates = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Staff ID is required' });
  }

  try {
    // Get the staff member to verify salon access
    const { data: staff, error: fetchError } = await supabase
      .from('staff')
      .select('salon_id')
      .eq('id', id as string)
      .maybeSingle();

    if (fetchError || !staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonAccess(user.id, staff.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    // Update staff member
    const { data: updatedStaff, error: updateError } = await supabase
      .from('staff')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id as string)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating staff:', updateError);
      return res.status(500).json({ error: 'Failed to update staff member' });
    }

    return res.status(200).json({ data: updatedStaff });
  } catch (error) {
    console.error('Staff PUT error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/staff/:id - Delete staff member (soft delete)
async function handleDelete(req: NextApiRequest, res: NextApiResponse) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Staff ID is required' });
  }

  try {
    // Get the staff member to verify salon access
    const { data: staff, error: fetchError } = await supabase
      .from('staff')
      .select('salon_id')
      .eq('id', id as string)
      .maybeSingle();

    if (fetchError || !staff) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    // Verify user has access to this salon
    const hasAccess = await verifySalonAccess(user.id, staff.salon_id);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Forbidden - No access to this salon' });
    }

    // Soft delete
    const { error: deleteError } = await supabase
      .from('staff')
      .update({
        deleted_at: new Date().toISOString(),
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id as string);

    if (deleteError) {
      console.error('Error deleting staff:', deleteError);
      return res.status(500).json({ error: 'Failed to delete staff member' });
    }

    return res.status(200).json({ success: true, message: 'Staff member deleted' });
  } catch (error) {
    console.error('Staff DELETE error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Main handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { method } = req;

  switch (method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    case 'PUT':
      return handlePut(req, res);
    case 'DELETE':
      return handleDelete(req, res);
    default:
      return res.status(405).json({ error: `Method ${method} not allowed` });
  }
}
