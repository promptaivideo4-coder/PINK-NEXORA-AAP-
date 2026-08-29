import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useOwnerAccess } from '../hooks/useOwnerAccess';
import { ScreenName, NavigationProps } from '../types';
import { IndianRupee, Calendar, Clock, Users, TrendingUp, TrendingDown, Filter, Download, Eye } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface PayrollRecord {
  id: string;
  staff_id: string;
  staff_name: string;
  staff_avatar: string;
  base_salary: number;
  total_commission: number;
  total_bonus: number;
  total_deductions: number;
  net_payable: number;
  payment_status: string;
  period_start: string;
  period_end: string;
  processed_at: string;
  settled_at: string;
}

interface PayrollEarningsProps extends NavigationProps {
  salonId?: string;
}

const PayrollEarnings: React.FC<PayrollEarningsProps> = ({ navigate, salonId: propSalonId }) => {
  const { hasAccess, loading: accessLoading } = useOwnerAccess();
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(propSalonId || null);
  const [salonInfo, setSalonInfo] = useState<{ id: string; name: string } | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [periods, setPeriods] = useState<{ id: string; period_start: string; period_end: string }[]>([]);

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

  // Fetch payroll periods
  const fetchPeriods = useCallback(async () => {
    if (!salonId) return;

    try {
      const { data, error } = await supabase
        .from('payroll_periods')
        .select('id, period_start, period_end')
        .eq('business_id', salonId)
        .order('period_start', { ascending: false });

      if (error) {
        throw error;
      }

      setPeriods(data || []);
    } catch (err) {
      console.error('Error fetching periods:', err);
    }
  }, [salonId]);

  // Fetch payroll records
  const fetchPayrollRecords = useCallback(async () => {
    if (!salonId) return;

    try {
      setLoading(true);
      setError(null);

      // Get all staff for this salon
      const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id, full_name, avatar_path')
        .eq('salon_id', salonId)
        .is('deleted_at', null)
        .eq('is_active', true);

      if (staffError) {
        throw staffError;
      }

      // Get payroll records for the selected period or latest
      let query = supabase
        .from('staff_payroll_records')
        .select(`
          id, staff_id, base_salary, total_commission, total_bonus, 
          total_deductions, net_payable, payment_status, processed_at, settled_at,
          payroll_periods(period_start, period_end)
        `)
        .eq('staff_id', salonId); // This needs to be fixed - should query by salon

      // Filter by period if selected
      if (selectedPeriod) {
        query = query.eq('payroll_period_id', selectedPeriod);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Enrich with staff info
      const enrichedRecords = (data || []).map(record => {
        const staffMember = staff.find(s => s.id === record.staff_id);
        return {
          ...record,
          staff_name: staffMember?.full_name || 'Unknown Staff',
          staff_avatar: staffMember?.avatar_path || null,
          period_start: record.payroll_periods?.period_start || '',
          period_end: record.payroll_periods?.period_end || '',
          payroll_periods: undefined, // Clean up
        };
      });

      setPayrollRecords(enrichedRecords);
    } catch (err) {
      console.error('Error fetching payroll records:', err);
      setError('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  }, [salonId, selectedPeriod]);

  useEffect(() => {
    if (salonId) {
      fetchPeriods();
      fetchPayrollRecords();
    }
  }, [salonId, fetchPeriods, fetchPayrollRecords]);

  useEffect(() => {
    if (salonId && selectedPeriod) {
      fetchPayrollRecords();
    }
  }, [selectedPeriod, fetchPayrollRecords]);

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
  const totalNetPayable = payrollRecords.reduce((sum, r) => sum + (r.net_payable || 0), 0);
  const totalCommission = payrollRecords.reduce((sum, r) => sum + (r.total_commission || 0), 0);
  const totalBonus = payrollRecords.reduce((sum, r) => sum + (r.total_bonus || 0), 0);
  const totalDeductions = payrollRecords.reduce((sum, r) => sum + (r.total_deductions || 0), 0);
  const settledCount = payrollRecords.filter(r => r.payment_status === 'settled').length;

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'settled':
        return 'bg-success/10 text-success';
      case 'processing':
        return 'bg-warning/10 text-warning';
      case 'paid':
        return 'bg-info/10 text-info';
      default:
        return 'bg-error/10 text-error';
    }
  };

  // Check access
  if (!hasAccess && !accessLoading) {
    return (
      <div className="w-full h-screen flex flex-col items-center justify-center bg-surface p-4">
        <div className="bg-error/10 border border-error rounded-xl p-6 text-center max-w-md">
          <p className="text-error font-bold text-lg mb-4">Access Denied</p>
          <p className="text-on-surface-variant mb-6">
            You do not have permission to access payroll information.
          </p>
          <button
            onClick={() => navigate('dashboard')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

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
            onClick={() => navigate('dashboard')}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all"
          >
            Go to Dashboard
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
          <h1 className="text-2xl font-bold text-on-surface">Payroll & Earnings</h1>
          <p className="text-sm text-on-surface-variant">
            {salonInfo?.name || 'Your Salon'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={selectedPeriod || ''}
            onChange={(e) => setSelectedPeriod(e.target.value || null)}
            className="bg-surface-container-high px-4 py-2.5 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Periods</option>
            {periods.map(period => (
              <option key={period.id} value={period.id}>
                {formatDate(period.period_start)} - {formatDate(period.period_end)}
              </option>
            ))}
          </select>
          
          <button
            className="bg-surface-container-high p-2.5 rounded-xl text-on-surface-variant hover:bg-surface-container-low transition-all"
            title="Export"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <div className="flex justify-center mb-2">
            <IndianRupee className="w-6 h-6 text-primary" />
          </div>
          <p className="text-2xl font-bold text-on-surface">{formatCurrency(totalNetPayable)}</p>
          <p className="text-xs text-on-surface-variant">Total Net Payable</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <div className="flex justify-center mb-2">
            <TrendingUp className="w-6 h-6 text-success" />
          </div>
          <p className="text-2xl font-bold text-on-surface">{formatCurrency(totalCommission)}</p>
          <p className="text-xs text-on-surface-variant">Total Commission</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <div className="flex justify-center mb-2">
            <Users className="w-6 h-6 text-info" />
          </div>
          <p className="text-2xl font-bold text-on-surface">{payrollRecords.length}</p>
          <p className="text-xs text-on-surface-variant">Staff Members</p>
        </div>
        <div className="bg-surface-container-highest rounded-xl p-4 text-center">
          <div className="flex justify-center mb-2">
            <Calendar className="w-6 h-6 text-warning" />
          </div>
          <p className="text-2xl font-bold text-on-surface">{settledCount}</p>
          <p className="text-xs text-on-surface-variant">Settled</p>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="bg-surface-container-highest rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <LoadingSpinner size="md" />
            <p className="text-on-surface-variant mt-4">Loading payroll records...</p>
          </div>
        ) : payrollRecords.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-on-surface-variant mb-4 opacity-50" />
            <p className="text-on-surface-variant">No payroll records found</p>
            <p className="text-sm text-on-surface-variant/70 mt-1">
              Payroll records will appear here after processing
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left p-4 text-sm font-bold text-on-surface-variant">Staff</th>
                  <th className="text-left p-4 text-sm font-bold text-on-surface-variant">Period</th>
                  <th className="text-right p-4 text-sm font-bold text-on-surface-variant">Base Salary</th>
                  <th className="text-right p-4 text-sm font-bold text-on-surface-variant">Commission</th>
                  <th className="text-right p-4 text-sm font-bold text-on-surface-variant">Bonus</th>
                  <th className="text-right p-4 text-sm font-bold text-on-surface-variant">Deductions</th>
                  <th className="text-right p-4 text-sm font-bold text-on-surface-variant">Net Payable</th>
                  <th className="text-left p-4 text-sm font-bold text-on-surface-variant">Status</th>
                  <th className="text-left p-4 text-sm font-bold text-on-surface-variant">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {payrollRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-surface-container-low transition-all">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          {record.staff_avatar ? (
                            <img
                              src={record.staff_avatar}
                              alt={record.staff_name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-primary font-bold text-sm">
                              {record.staff_name.charAt(0).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-on-surface">{record.staff_name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-on-surface">
                        {formatDate(record.period_start)} - {formatDate(record.period_end)}
                      </p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-on-surface">{formatCurrency(record.base_salary * 100)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-success">{formatCurrency(record.total_commission * 100)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-info">{formatCurrency(record.total_bonus * 100)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="text-error">{formatCurrency(record.total_deductions * 100)}</p>
                    </td>
                    <td className="p-4 text-right">
                      <p className="font-bold text-on-surface">{formatCurrency(record.net_payable * 100)}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(record.payment_status)}`}>
                        {record.payment_status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => navigate('staff-payroll-detail', { state: { recordId: record.id, salonId } })}
                        className="p-2 rounded-lg hover:bg-surface-container-high transition-all"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-on-surface-variant" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      {!loading && payrollRecords.length > 0 && (
        <div className="mt-6 bg-surface-container-highest rounded-xl p-4">
          <h3 className="font-bold text-on-surface mb-4">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-on-surface-variant mb-1">Total Base Salary</p>
              <p className="font-bold text-on-surface">{formatCurrency(payrollRecords.reduce((sum, r) => sum + (r.base_salary || 0), 0) * 100)}</p>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant mb-1">Total Commission</p>
              <p className="font-bold text-success">{formatCurrency(totalCommission * 100)}</p>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant mb-1">Total Bonus</p>
              <p className="font-bold text-info">{formatCurrency(totalBonus * 100)}</p>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant mb-1">Total Deductions</p>
              <p className="font-bold text-error">{formatCurrency(totalDeductions * 100)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no results */}
      {!loading && payrollRecords.length === 0 && selectedPeriod && (
        <div className="mt-4 p-6 bg-surface-container-highest rounded-xl text-center">
          <p className="text-on-surface-variant">No payroll records for selected period</p>
          <button
            onClick={() => setSelectedPeriod('')}
            className="mt-2 text-primary font-bold text-sm hover:underline"
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Note about backend wiring */}
      <div className="mt-6 p-4 bg-warning/10 border border-warning/20 rounded-xl">
        <p className="text-warning text-sm">
          <strong>Note:</strong> Payroll backend wiring is not yet complete. This screen shows the UI structure
          with real data binding. Full payroll processing requires the payroll tables to be populated and
          the processing job to be configured.
        </p>
      </div>
    </div>
  );
};

export default PayrollEarnings;
