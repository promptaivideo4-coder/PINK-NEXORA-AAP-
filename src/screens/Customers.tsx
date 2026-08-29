import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ScreenName, NavigationProps } from '../types';
import { Search, Plus, MoreVertical, Edit, Trash2, Eye, User, Phone, Mail, Tag, Clock, Filter, SortDesc, SortAsc } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  customer_type: string;
  total_visits: number;
  total_spend_paise: number;
  join_date: string;
  last_visit_at: string;
  notes: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  last_booking_at?: string;
  last_booking_service?: string;
}

interface CustomersProps extends NavigationProps {
  salonId?: string;
}

const Customers: React.FC<CustomersProps> = ({ navigate, salonId: propSalonId }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'visits' | 'spend' | 'recent'>('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
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

  // Fetch customers
  const fetchCustomers = useCallback(async () => {
    if (!salonId) return;

    try {
      setLoading(true);
      setError(null);

      // Get customer types
      const customerTypes = ['VIP', 'Gold Member', 'New', 'Standard', 'Walk-in'];

      // Build query
      let query = supabase
        .from('customers')
        .select(`
          id, first_name, last_name, full_name, email, phone, whatsapp_number,
          address, city, state, pincode, customer_type, total_visits, total_spend_paise,
          join_date, last_visit_at, notes, tags, is_active, created_at,
          bookings(appointment_start, services(name))
        `)
        .eq('salon_id', salonId)
        .is('deleted_at', null);

      // Apply filters
      if (searchQuery) {
        const searchTerm = `%${searchQuery}%`;
        query = query.or(`
          ilike(first_name,${searchTerm}),
          ilike(last_name,${searchTerm}),
          ilike(full_name,${searchTerm}),
          ilike(phone,${searchTerm}),
          ilike(email,${searchTerm}),
          ilike(city,${searchTerm})
        `);
      }

      if (filterType) {
        query = query.eq('customer_type', filterType);
      }

      // Apply sorting
      let orderColumn = 'last_visit_at';
      switch (sortBy) {
        case 'name':
          orderColumn = 'full_name';
          break;
        case 'visits':
          orderColumn = 'total_visits';
          break;
        case 'spend':
          orderColumn = 'total_spend_paise';
          break;
        case 'recent':
        default:
          orderColumn = 'last_visit_at';
          break;
      }

      query = query.order(orderColumn, { ascending: sortOrder === 'asc', nullsLast: true });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Enrich data with last booking info
      const enrichedCustomers = data.map(customer => {
        const lastBooking = customer.bookings?.[0];
        return {
          ...customer,
          last_booking_at: lastBooking?.appointment_start || null,
          last_booking_service: lastBooking?.services?.[0]?.name || null,
          bookings: undefined, // Remove to clean up response
        };
      });

      setCustomers(enrichedCustomers);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [salonId, searchQuery, filterType, sortBy, sortOrder]);

  useEffect(() => {
    if (salonId) {
      fetchCustomers();
    }
  }, [salonId, fetchCustomers]);

  // Refresh customers list
  const refreshCustomers = useCallback(() => {
    if (salonId) {
      fetchCustomers();
    }
  }, [salonId, fetchCustomers]);

  // Handle customer actions
  const handleAddCustomer = () => {
    // For now, redirect to a form or show modal
    // In a real implementation, this would open a modal or navigate to new-customer screen
    navigate('customer-profile', { state: { mode: 'new', salonId } });
  };

  const handleViewCustomer = (customerId: string) => {
    navigate('customer-profile', { state: { customerId, salonId, mode: 'view' } });
  };

  const handleEditCustomer = (customerId: string) => {
    navigate('customer-profile', { state: { customerId, salonId, mode: 'edit' } });
  };

  const handleToggleStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({
          is_active: !currentStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) {
        throw error;
      }

      refreshCustomers();
    } catch (err) {
      console.error('Error toggling customer status:', err);
      setError('Failed to update customer status');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .update({
          deleted_at: new Date().toISOString(),
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customerId);

      if (error) {
        throw error;
      }

      refreshCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      setError('Failed to delete customer');
    }
  };

  // Format currency
  const formatCurrency = (paise: number | null | undefined) => {
    if (!paise) return '₹0';
    const rupees = paise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rupees);
  };

  // Format phone number
  const formatPhone = (phone: string | null) => {
    if (!phone) return 'N/A';
    if (phone.length === 10) {
      return `${phone.slice(0, 5)} ${phone.slice(5)}`;
    }
    return phone;
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Calculate stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => c.is_active).length;
  const totalVisits = customers.reduce((sum, c) => sum + (c.total_visits || 0), 0);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.total_spend_paise || 0), 0);
  const vipCustomers = customers.filter(c => c.customer_type === 'VIP').length;

  // Customer types for filter
  const customerTypes = ['VIP', 'Gold Member', 'New', 'Standard', 'Walk-in'];

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
            onClick={refreshCustomers}
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
          <h1 className="text-2xl font-bold text-on-surface">Customers</h1>
          <p className="text-sm text-on-surface-variant">
            {salonInfo?.name || 'Your Salon'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddCustomer}
            className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-on-surface">{totalCustomers}</p>
          <p className="text-xs text-on-surface-variant">Total</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-on-surface">{activeCustomers}</p>
          <p className="text-xs text-on-surface-variant">Active</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-on-surface">{totalVisits}</p>
          <p className="text-xs text-on-surface-variant">Total Visits</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-on-surface">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-on-surface-variant">Total Revenue</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high pl-10 pr-4 py-2.5 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <select
          value={filterType || ''}
          onChange={(e) => setFilterType(e.target.value || null)}
          className="bg-surface-container-high px-4 py-2.5 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Types</option>
          {customerTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        
        <div className="flex gap-1">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'visits' | 'spend' | 'recent')}
            className="bg-surface-container-high px-4 py-2.5 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="recent">Recent</option>
            <option value="name">Name</option>
            <option value="visits">Visits</option>
            <option value="spend">Spend</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="bg-surface-container-high p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all"
          >
            {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Customers List */}
      <div className="bg-surface-container-highest rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="md" />
            <p className="text-on-surface-variant mt-4">Loading customers...</p>
          </div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 mx-auto text-on-surface-variant mb-4 opacity-50" />
            <p className="text-on-surface-variant">No customers found</p>
            <p className="text-sm text-on-surface-variant/70 mt-1">
              Add your first customer to get started
            </p>
            <button
              onClick={handleAddCustomer}
              className="mt-4 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
            >
              Add Customer
            </button>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className="p-4 hover:bg-surface-container-low transition-all cursor-pointer"
                onClick={() => handleViewCustomer(customer.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-bold text-lg">
                      {customer.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-on-surface truncate">{customer.full_name}</h3>
                      {customer.customer_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          customer.customer_type === 'VIP' ? 'bg-purple-500/10 text-purple-500' :
                          customer.customer_type === 'Gold Member' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-success/10 text-success'
                        }`}>
                          {customer.customer_type}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {formatPhone(customer.phone)}
                        </span>
                      )}
                      {customer.email && (
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <Mail className="w-3 h-3" />
                          {customer.email}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mt-1">
                      {customer.city && (
                        <span className="flex items-center gap-1">
                          <span className="text-xs">📍</span>
                          {customer.city}
                        </span>
                      )}
                      {customer.total_visits > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {customer.total_visits} visits
                        </span>
                      )}
                      {customer.last_visit_at && (
                        <span className="text-on-surface-variant/70">
                          Last: {formatDate(customer.last_visit_at)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleViewCustomer(customer.id)}
                      className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-on-surface-variant" />
                    </button>
                    <button
                      onClick={() => handleEditCustomer(customer.id)}
                      className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-on-surface-variant" />
                    </button>
                    <button
                      onClick={() => handleToggleStatus(customer.id, customer.is_active)}
                      className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                      title={customer.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {customer.is_active ? (
                        <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">Active</span>
                      ) : (
                        <span className="text-xs bg-error/10 text-error px-2 py-0.5 rounded-full">Inactive</span>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer.id)}
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
      {!loading && customers.length === 0 && searchQuery && (
        <div className="mt-4 p-6 bg-surface-container-highest rounded-xl text-center">
          <p className="text-on-surface-variant">No customers match your search</p>
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

export default Customers;
