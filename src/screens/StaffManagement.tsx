import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { NavigationProps } from '../types';
import { Search, Plus, Edit, Trash2, Eye, User, Clock, Star } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { firstRelation } from '../lib/relation';

interface StaffMember {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  primary_role: string;
  specialty: string;
  rating_average: number;
  review_count: number;
  is_active: boolean;
  is_public: boolean;
  avatar_path: string;
  created_at: string;
  staff_role_id: string;
  role_name?: string;
  role_description?: string;
}

interface StaffManagementProps extends NavigationProps {
  salonId?: string;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ navigate, salonId: propSalonId }) => {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(propSalonId || null);
  const [salonInfo, setSalonInfo] = useState<{ id: string; name: string } | null>(null);

  // Fetch salon ID if not provided
  useEffect(() => {
    const fetchSalonId = async () => {
      if (propSalonId) {
        setSalonId(propSalonId);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate('login');
          return;
        }

        // Get the user's salon
        const { data: salon, error: salonError } = await supabase
          .from('salons')
          .select('id, name')
          .eq('owner_id', user.id)
          .is('deleted_at', null)
          .maybeSingle();

        if (salonError) {
          console.error('Error fetching salon:', salonError);
          setError('Failed to load salon information');
        } else if (salon) {
          setSalonId(salon.id);
          setSalonInfo(salon);
        } else {
          // Try via organization_members
          const { data: orgMember, error: orgError } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          if (orgError || !orgMember) {
            setError('No salon found for this account');
          } else {
            const { data: orgSalon, error: orgSalonError } = await supabase
              .from('salons')
              .select('id, name')
              .eq('organization_id', orgMember.organization_id)
              .is('deleted_at', null)
              .maybeSingle();

            if (orgSalonError || !orgSalon) {
              setError('No salon found for this account');
            } else {
              setSalonId(orgSalon.id);
              setSalonInfo(orgSalon);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to authenticate');
      }
    };

    fetchSalonId();
  }, [propSalonId, navigate]);

  // Fetch staff members
  const fetchStaff = useCallback(async () => {
    if (!salonId) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('staff')
        .select(`
          id, full_name, email, phone, primary_role, specialty, 
          rating_average, review_count, is_active, is_public, 
          avatar_path, created_at, staff_role_id,
          staff_roles(name, description)
        `)
        .eq('salon_id', salonId)
        .is('deleted_at', null);

      // Apply filters
      if (searchQuery) {
        const searchTerm = `%${searchQuery}%`;
        query = query.or(`
          ilike(full_name,${searchTerm}),
          ilike(email,${searchTerm}),
          ilike(phone,${searchTerm}),
          ilike(primary_role,${searchTerm}),
          ilike(specialty,${searchTerm})
        `);
      }

      if (filterRole) {
        query = query.eq('primary_role', filterRole);
      }

      if (filterStatus) {
        query = query.eq('is_active', filterStatus === 'active');
      }

      query = query.order('full_name', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      type StaffQueryRow = StaffMember & {
        staff_roles?: { name: string; description: string } | { name: string; description: string }[] | null;
      };
      const rows = (data || []) as StaffQueryRow[];
      setStaffMembers(rows.map((row) => {
        const role = firstRelation(row.staff_roles);
        return {
          ...row,
          role_name: role?.name,
          role_description: role?.description,
        };
      }));
    } catch (err) {
      console.error('Error fetching staff:', err);
      setError('Failed to load staff members');
    } finally {
      setLoading(false);
    }
  }, [salonId, searchQuery, filterRole, filterStatus]);

  useEffect(() => {
    if (salonId) {
      fetchStaff();
    }
  }, [salonId, fetchStaff]);

  // Refresh staff list
  const refreshStaff = useCallback(() => {
    if (salonId) {
      fetchStaff();
    }
  }, [salonId, fetchStaff]);

  // Handle staff actions
  const handleAddStaff = () => {
    if (salonId) {
      navigate('new-staff');
    }
  };

  const handleViewStaff = (_staffId: string) => {
    navigate('staff-detail');
  };

  const handleEditStaff = (_staffId: string) => {
    navigate('staff-detail');
  };

  const handleToggleStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staffId);

      if (error) {
        throw error;
      }

      refreshStaff();
    } catch (err) {
      console.error('Error toggling staff status:', err);
      setError('Failed to update staff status');
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!window.confirm('Are you sure you want to delete this staff member? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('staff')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staffId);

      if (error) {
        throw error;
      }

      refreshStaff();
    } catch (err) {
      console.error('Error deleting staff:', err);
      setError('Failed to delete staff member');
    }
  };

  // Get unique roles for filter
  const roles = [...new Set(staffMembers.map(s => s.primary_role).filter(Boolean))];

  // Format phone number
  const formatPhone = (phone: string | null) => {
    if (!phone) return 'N/A';
    // Simple formatting for Indian numbers
    if (phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  // Calculate stats
  const totalStaff = staffMembers.length;
  const activeStaff = staffMembers.filter(s => s.is_active).length;
  const averageRating = staffMembers.reduce((sum, s) => sum + (s.rating_average || 0), 0) / staffMembers.length;

  if (!salonId) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-surface">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-surface p-4">
        <div className="bg-error/10 border border-error rounded-xl p-6 text-center max-w-md">
          <p className="text-error font-bold text-lg mb-4">Error</p>
          <p className="text-on-surface-variant mb-6">{error}</p>
          <button
            onClick={refreshStaff}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-surface p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Staff Management</h1>
          <p className="text-sm text-on-surface-variant">
            {salonInfo?.name || 'Your Salon'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddStaff}
            className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-on-surface">{totalStaff}</p>
          <p className="text-xs text-on-surface-variant">Total Staff</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-on-surface">{activeStaff}</p>
          <p className="text-xs text-on-surface-variant">Active</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-on-surface">
            {averageRating > 0 ? averageRating.toFixed(1) : 'N/A'}
          </p>
          <p className="text-xs text-on-surface-variant">Avg Rating</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high pl-10 pr-4 py-2.5 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <select
          value={filterRole || ''}
          onChange={(e) => setFilterRole(e.target.value || null)}
          className="bg-surface-container-high px-4 py-2.5 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Roles</option>
          {roles.map(role => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
        
        <select
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          className="bg-surface-container-high px-4 py-2.5 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Staff List */}
      <div className="bg-surface-container-highest rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="md" />
            <p className="text-on-surface-variant mt-4">Loading staff...</p>
          </div>
        ) : staffMembers.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 mx-auto text-on-surface-variant mb-4 opacity-50" />
            <p className="text-on-surface-variant">No staff members found</p>
            <p className="text-sm text-on-surface-variant/70 mt-1">
              Add your first staff member to get started
            </p>
            <button
              onClick={handleAddStaff}
              className="mt-4 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
            >
              Add Staff
            </button>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {staffMembers.map((staff) => (
              <div
                key={staff.id}
                className="p-4 hover:bg-surface-container-low transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {staff.avatar_path ? (
                      <img
                        src={staff.avatar_path}
                        alt={staff.full_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-bold text-lg">
                        {staff.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-on-surface truncate">{staff.full_name}</h3>
                      {staff.role_name && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {staff.role_name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                      <span>{staff.primary_role}</span>
                      {staff.specialty && (
                        <span className="text-on-surface-variant/70">{staff.specialty}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mt-1">
                      {staff.phone && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatPhone(staff.phone)}
                        </span>
                      )}
                      {staff.rating_average && (
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-500" />
                          {staff.rating_average.toFixed(1)} ({staff.review_count})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewStaff(staff.id)}
                      className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-on-surface-variant" />
                    </button>
                    <button
                      onClick={() => handleEditStaff(staff.id)}
                      className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-on-surface-variant" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(staff.id, staff.is_active)}
                      className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                      title={staff.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {staff.is_active ? (
                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="p-2 rounded-lg hover:bg-error/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-error" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state when no results */}
      {!loading && staffMembers.length === 0 && searchQuery && (
        <div className="mt-4 p-6 bg-surface-container-highest rounded-xl text-center">
          <p className="text-on-surface-variant">No staff members match your search</p>
          <button
            onClick={() => setSearchQuery('')}
            className="mt-2 text-primary font-bold text-sm hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
