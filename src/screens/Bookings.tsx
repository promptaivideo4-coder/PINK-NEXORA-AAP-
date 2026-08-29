import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ScreenName, NavigationProps } from '../types';
import { Calendar, Clock, User, Phone, IndianRupee, Search, Plus, MoreVertical, Edit, Trash2, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface Booking {
  id: string;
  salon_id: string;
  staff_id: string | null;
  customer_id: string | null;
  appointment_start: string;
  appointment_end: string;
  status: string;
  total_paise: number;
  advance_paise: number;
  payment_status: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  notes: string;
  staff_name?: string;
  staff_phone?: string;
  customer_type?: string;
  services?: Array<{
    name: string;
    duration_minutes: number;
    price_paise: number;
  }>;
}

interface BookingsProps extends NavigationProps {
  salonId?: string;
}

const Bookings: React.FC<BookingsProps> = ({ navigate, salonId: propSalonId }) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(propSalonId || null);
  const [salonInfo, setSalonInfo] = useState<{ id: string; name: string } | null>(null);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);

  // Fetch salon ID
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

        // Get the user's salon via organization_members
        const { data: orgMember, error: orgError } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .maybeSingle();

        if (orgError || !orgMember) {
          setError('No salon found for this account');
          return;
        }

        const { data: salon, error: salonError } = await supabase
          .from('salons')
          .select('id, name')
          .eq('organization_id', orgMember.organization_id)
          .is('deleted_at', null)
          .maybeSingle();

        if (salonError || !salon) {
          setError('No salon found for this account');
        } else {
          setSalonId(salon.id);
          setSalonInfo(salon);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to authenticate');
      }
    };

    fetchSalonId();
  }, [propSalonId, navigate]);

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    if (!salonId) return;

    try {
      setLoading(true);
      setError(null);

      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Build query
      let query = supabase
        .from('bookings')
        .select(`
          id, salon_id, staff_id, customer_id, appointment_start, appointment_end,
          status, total_paise, advance_paise, payment_status, customer_name,
          customer_phone, customer_email, notes, created_at,
          staff(full_name, phone),
          customers(customer_type),
          booking_items(service_id, unit_price_paise, quantity, services(name, duration_minutes))
        `)
        .eq('salon_id', salonId)
        .is('deleted_at', null);

      // Filter by search
      if (searchQuery) {
        const searchTerm = `%${searchQuery}%`;
        query = query.or(`
          ilike(customer_name,${searchTerm}),
          ilike(customer_phone,${searchTerm}),
          ilike(status,${searchTerm})
        `);
      }

      // Filter by status
      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      // Filter by date
      if (filterDate) {
        const startDate = new Date(filterDate);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        
        query = query
          .gte('appointment_start', startDate.toISOString())
          .lt('appointment_start', endDate.toISOString());
      }

      // Order by appointment start time
      query = query.order('appointment_start', { ascending: true });

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Enrich data
      const enrichedBookings = (data || []).map(booking => {
        const services = booking.booking_items?.map(item => ({
          name: item.services?.name || 'Unknown Service',
          duration_minutes: item.services?.duration_minutes || 0,
          price_paise: item.unit_price_paise || 0,
        })) || [];

        return {
          ...booking,
          staff_name: booking.staff?.full_name || null,
          staff_phone: booking.staff?.phone || null,
          customer_type: booking.customers?.customer_type || null,
          services,
          staff: undefined,
          customers: undefined,
          booking_items: undefined,
        };
      });

      setBookings(enrichedBookings);
      
      // Filter today's bookings
      const todayBookings = enrichedBookings.filter(b => {
        const bookingDate = new Date(b.appointment_start).toISOString().split('T')[0];
        return bookingDate === today;
      });
      setTodayBookings(todayBookings);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [salonId, searchQuery, filterStatus, filterDate]);

  useEffect(() => {
    if (salonId) {
      fetchBookings();
    }
  }, [salonId, fetchBookings]);

  // Refresh bookings
  const refreshBookings = useCallback(() => {
    if (salonId) {
      fetchBookings();
    }
  }, [salonId, fetchBookings]);

  // Handle booking actions
  const handleAddBooking = () => {
    navigate('new-appointment');
  };

  const handleViewBooking = (bookingId: string) => {
    // In a real implementation, this would navigate to a booking detail screen
    navigate('new-appointment', { state: { bookingId, mode: 'view', salonId } });
  };

  const handleEditBooking = (bookingId: string) => {
    navigate('new-appointment', { state: { bookingId, mode: 'edit', salonId } });
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) {
        throw error;
      }

      refreshBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking');
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

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format short date
  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-success/10 text-success';
      case 'completed':
        return 'bg-info/10 text-info';
      case 'in_progress':
        return 'bg-warning/10 text-warning';
      case 'cancelled':
        return 'bg-error/10 text-error';
      case 'no_show':
        return 'bg-error/20 text-error';
      default:
        return 'bg-outline-variant/10 text-on-surface-variant';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="w-3 h-3" />;
      case 'completed':
        return <CheckCircle className="w-3 h-3" />;
      case 'in_progress':
        return <Clock className="w-3 h-3" />;
      case 'cancelled':
        return <XCircle className="w-3 h-3" />;
      case 'no_show':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <AlertCircle className="w-3 h-3" />;
    }
  };

  // Calculate stats
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const todayCount = todayBookings.length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.total_paise || 0), 0);

  // Status options
  const statusOptions = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'];

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
            onClick={refreshBookings}
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
          <h1 className="text-2xl font-bold text-on-surface">Bookings</h1>
          <p className="text-sm text-on-surface-variant">
            {salonInfo?.name || 'Your Salon'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleAddBooking}
            className="bg-primary text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-primary/90 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Booking
          </button>
        </div>
      </div>

      {/* Today's Bookings Summary */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-on-surface">Today's Bookings ({todayCount})</h2>
        </div>
        
        {todayBookings.length === 0 ? (
          <div className="bg-surface-container-highest rounded-xl p-4 text-center text-on-surface-variant">
            No bookings for today
          </div>
        ) : (
          <div className="space-y-2">
            {todayBookings.map(booking => (
              <div
                key={booking.id}
                className="bg-surface-container-highest rounded-xl p-3 flex items-center gap-3 hover:bg-surface-container-low transition-all"
                onClick={() => handleViewBooking(booking.id)}
              >
                <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-on-surface truncate">{booking.customer_name}</p>
                  <p className="text-sm text-on-surface-variant">
                    {formatTime(booking.appointment_start)} - {formatTime(booking.appointment_end)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {booking.staff_name && (
                    <span className="text-sm text-on-surface-variant">{booking.staff_name}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-on-surface">{totalBookings}</p>
          <p className="text-xs text-on-surface-variant">Total</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-success">{confirmedBookings}</p>
          <p className="text-xs text-on-surface-variant">Confirmed</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-info">{completedBookings}</p>
          <p className="text-xs text-on-surface-variant">Completed</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-error">{cancelledBookings}</p>
          <p className="text-xs text-on-surface-variant">Cancelled</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-container-high pl-10 pr-4 py-2.5 rounded-xl text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <select
          value={filterStatus || ''}
          onChange={(e) => setFilterStatus(e.target.value || null)}
          className="bg-surface-container-high px-4 py-2.5 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All Status</option>
          {statusOptions.map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </option>
          ))}
        </select>
        
        <input
          type="date"
          value={filterDate || ''}
          onChange={(e) => setFilterDate(e.target.value || null)}
          className="bg-surface-container-high px-4 py-2.5 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Bookings List */}
      <div className="bg-surface-container-highest rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="md" />
            <p className="text-on-surface-variant mt-4">Loading bookings...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-on-surface-variant mb-4 opacity-50" />
            <p className="text-on-surface-variant">No bookings found</p>
            <p className="text-sm text-on-surface-variant/70 mt-1">
              Create your first booking to get started
            </p>
            <button
              onClick={handleAddBooking}
              className="mt-4 bg-primary text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
            >
              New Booking
            </button>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="p-4 hover:bg-surface-container-low transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Date/Time */}
                  <div className="text-center min-w-[60px]">
                    <p className="font-bold text-on-surface">{formatShortDate(booking.appointment_start)}</p>
                    <p className="text-xs text-on-surface-variant">{formatTime(booking.appointment_start)}</p>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-on-surface truncate">{booking.customer_name}</h3>
                      {booking.customer_type && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          booking.customer_type === 'VIP' ? 'bg-purple-500/10 text-purple-500' :
                          booking.customer_type === 'Gold Member' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-success/10 text-success'
                        }`}>
                          {booking.customer_type}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant">
                      {booking.customer_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {booking.customer_phone}
                        </span>
                      )}
                      {booking.services && booking.services.length > 0 && (
                        <span className="truncate max-w-[200px]" title={booking.services.map(s => s.name).join(', ')}>
                          {booking.services.map(s => s.name).join(', ')}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-on-surface-variant mt-1">
                      {booking.staff_name && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {booking.staff_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {formatCurrency(booking.total_paise)}
                      </span>
                      {booking.advance_paise > 0 && (
                        <span className="text-success">
                          +{formatCurrency(booking.advance_paise)} advance
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(booking.status)} flex items-center gap-1`}>
                      {getStatusIcon(booking.status)}
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewBooking(booking.id)}
                      className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                      title="View"
                    >
                      <Eye className="w-4 h-4 text-on-surface-variant" />
                    </button>
                    {booking.status !== 'completed' && booking.status !== 'cancelled' && (
                      <>
                        <button
                          onClick={() => handleEditBooking(booking.id)}
                          className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4 text-on-surface-variant" />
                        </button>
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="p-2 rounded-lg hover:bg-error/10 transition-all"
                          title="Cancel"
                        >
                          <XCircle className="w-4 h-4 text-error" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state when no results */}
      {!loading && bookings.length === 0 && (searchQuery || filterStatus || filterDate) && (
        <div className="mt-4 p-6 bg-surface-container-highest rounded-xl text-center">
          <p className="text-on-surface-variant">No bookings match your filters</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('');
              setFilterDate('');
            }}
            className="mt-2 text-primary font-bold text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Bookings;
