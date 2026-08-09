/**
 * NexoraOS Staff Management — Supabase Data Access Layer (Phase 6)
 *
 * Connects all 12 Staff Management screens to the real Supabase database.
 * Replaces localStorage/demo data with proper RLS-aware queries.
 *
 * Every query is scoped by business_id (salon_id) via RLS policies.
 * Staff self-service queries use auth.uid() to resolve the staff member.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type StaffStatus = 'active' | 'probation' | 'inactive' | 'terminated';
export type PaymentStatus = 'pending' | 'processing' | 'paid' | 'settled';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type ShiftSwapStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half_day' | 'leave';
export type BonusType = 'performance' | 'sales_incentive' | 'festival' | 'other';
export type DeductionType = 'advance' | 'tax' | 'penalty' | 'other';
export type CommissionType = 'percentage' | 'fixed';
export type DocType = 'government_id' | 'address_proof' | 'employment_contract' | 'skill_certificate' | 'other';
export type DocStatus = 'pending' | 'verified' | 'rejected';

export interface StaffRow {
  id: string;
  salon_id: string;
  name: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  role_title: string | null;
  specialty: string | null;
  bio: string | null;
  avatar_path: string | null;
  profile_photo_url: string | null;
  employment_status: string;
  live_status: string;
  rating_average: number;
  review_count: number;
  user_id: string | null;
  staff_role_id: string | null;
  is_active: boolean;
  is_public: boolean;
  self_service_enabled: boolean;
  experience_years: number;
  gender: string | null;
  date_of_birth: string | null;
  joining_date: string | null;
  primary_role: string | null;
  commission_percent: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StaffScheduleRow {
  id: string;
  staff_id: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  is_working: boolean;
}

export interface StaffShiftRow {
  id: string;
  staff_id: string;
  schedule_id: string | null;
  shift_date: string | null;
  start_time: string;
  end_time: string;
  shift_type: string;
}

export interface StaffBreakRow {
  id: string;
  staff_id: string;
  shift_id: string | null;
  break_start: string;
  break_end: string;
  break_date: string | null;
}

export interface StaffBlockedTimeRow {
  id: string;
  staff_id: string;
  start_at: string;
  end_at: string;
  reason: string | null;
}

export interface AttendanceRow {
  id: string;
  staff_id: string;
  business_id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  worked_minutes: number;
  status: AttendanceStatus;
  manager_note: string | null;
}

export interface LeaveTypeRow {
  id: string;
  business_id: string;
  name: string;
  default_days: number;
  is_paid: boolean;
  is_active: boolean;
}

export interface LeaveBalanceRow {
  id: string;
  staff_id: string;
  leave_type_id: string;
  year: number;
  allocated_days: number;
  used_days: number;
  remaining_days: number;
}

export interface LeaveRequestRow {
  id: string;
  staff_id: string;
  leave_type_id: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: LeaveStatus;
  manager_note: string | null;
  requested_at: string;
  reviewed_at: string | null;
}

export interface ShiftSwapRow {
  id: string;
  requesting_staff_id: string;
  replacement_staff_id: string;
  shift_id: string | null;
  swap_date: string;
  original_start_time: string;
  original_end_time: string;
  reason: string | null;
  status: ShiftSwapStatus;
  requested_at: string;
  reviewed_at: string | null;
}

export interface PayrollPeriodRow {
  id: string;
  business_id: string;
  period_start: string;
  period_end: string;
  status: string;
}

export interface PayrollRecordRow {
  id: string;
  payroll_period_id: string;
  staff_id: string;
  base_salary: number;
  total_commission: number;
  total_bonus: number;
  total_deductions: number;
  net_payable: number;
  payment_status: PaymentStatus;
  processed_at: string | null;
  settled_at: string | null;
}

export interface CommissionRow {
  id: string;
  payroll_record_id: string;
  staff_id: string;
  booking_id: string | null;
  service_id: string | null;
  service_amount: number;
  commission_rate: number;
  commission_type: string;
  commission_amount: number;
  status: string;
}

export interface BonusRow {
  id: string;
  staff_id: string;
  payroll_period_id: string | null;
  bonus_type: BonusType;
  amount: number;
  description: string | null;
}

export interface DeductionRow {
  id: string;
  payroll_record_id: string;
  staff_id: string;
  deduction_type: DeductionType;
  description: string | null;
  amount: number;
}

export interface StaffRoleRow {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  is_system_role: boolean;
}

export interface PermissionRow {
  id: string;
  module: string;
  action: string;
  description: string | null;
}

export interface RolePermissionRow {
  id: string;
  role_id: string;
  permission_id: string;
}

export interface ServiceRow {
  id: string;
  salon_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_paise: number;
  is_active: boolean;
  is_bookable_online: boolean;
}

export interface SkillRow {
  id: string;
  business_id: string;
  name: string;
}

export interface StaffServiceRow {
  staff_id: string;
  service_id: string;
  custom_price_paise: number | null;
  custom_duration_minutes: number | null;
  commission_percent_override: number | null;
  is_active: boolean;
}

export interface StaffSkillRow {
  staff_id: string;
  skill_id: string;
}

export interface EmergencyContactRow {
  id: string;
  staff_id: string;
  name: string;
  relationship: string;
  phone: string;
}

export interface DocumentRow {
  id: string;
  staff_id: string;
  document_type: DocType;
  file_name: string;
  storage_path: string;
  mime_type: string | null;
  file_size: number | null;
  verification_status: DocStatus;
  created_at: string;
}

export interface AuditLogRow {
  id: string;
  business_id: string;
  staff_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  old_value: any;
  new_value: any;
  performed_by: string | null;
  performed_at: string;
  note: string | null;
}

export interface PaymentAccountRow {
  id: string;
  staff_id: string;
  payment_method: string;
  account_name: string | null;
  account_number_encrypted: string | null;
  ifsc_encrypted: string | null;
  upi_id_encrypted: string | null;
  is_primary: boolean;
}

export interface StaffServiceCommissionRow {
  id: string;
  staff_id: string;
  service_id: string;
  commission_type: CommissionType;
  commission_value: number;
  effective_from: string;
  effective_to: string | null;
  is_active: boolean;
}

export interface CommissionSettingsRow {
  id: string;
  staff_id: string;
  commission_model: string;
  default_percentage: number;
  default_fixed_amount: number;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function money(paise: number): string {
  return `₹${Math.round(paise / 100).toLocaleString('en-IN')}`;
}

function moneyFromRupees(rupees: number): string {
  return `₹${Math.round(rupees).toLocaleString('en-IN')}`;
}

// ---------------------------------------------------------------------------
// Staff CRUD
// ---------------------------------------------------------------------------

export async function fetchStaffList(
  client: SupabaseClient,
  salonId: string,
): Promise<StaffRow[]> {
  const { data, error } = await client
    .from('staff')
    .select('*')
    .eq('salon_id', salonId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StaffRow[];
}

export async function fetchStaffById(
  client: SupabaseClient,
  staffId: string,
): Promise<StaffRow | null> {
  const { data, error } = await client
    .from('staff')
    .select('*')
    .eq('id', staffId)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data as StaffRow | null;
}

export async function createStaffRecord(
  client: SupabaseClient,
  salonId: string,
  input: {
    name: string;
    role_title?: string;
    specialty?: string;
    phone?: string;
    email?: string;
    bio?: string;
    employment_status?: string;
    is_active?: boolean;
    is_public?: boolean;
    self_service_enabled?: boolean;
    experience_years?: number;
    gender?: string;
    joining_date?: string;
    staff_role_id?: string;
    commission_percent?: number;
  },
): Promise<StaffRow> {
  const { data, error } = await client
    .from('staff')
    .insert({
      salon_id: salonId,
      name: input.name.trim(),
      full_name: input.name.trim(),
      role_title: input.role_title?.trim() || null,
      specialty: input.specialty?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim() || null,
      bio: input.bio?.trim() || null,
      employment_status: input.employment_status || 'active',
      is_active: input.is_active ?? true,
      is_public: input.is_public ?? false,
      self_service_enabled: input.self_service_enabled ?? false,
      experience_years: input.experience_years || 0,
      gender: input.gender || null,
      joining_date: input.joining_date || null,
      staff_role_id: input.staff_role_id || null,
      commission_percent: input.commission_percent || null,
    })
    .select()
    .single();
  if (error) throw error;
  return data as StaffRow;
}

export async function updateStaffRecord(
  client: SupabaseClient,
  staffId: string,
  patch: Record<string, any>,
): Promise<void> {
  const { error } = await client
    .from('staff')
    .update(patch)
    .eq('id', staffId);
  if (error) throw error;
}

export async function deleteStaffRecord(
  client: SupabaseClient,
  staffId: string,
): Promise<void> {
  const { error } = await client
    .from('staff')
    .update({ deleted_at: new Date().toISOString(), employment_status: 'inactive', is_active: false })
    .eq('id', staffId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Staff Schedules
// ---------------------------------------------------------------------------

export async function fetchStaffSchedules(
  client: SupabaseClient,
  staffId: string,
): Promise<StaffScheduleRow[]> {
  const { data, error } = await client
    .from('staff_schedules')
    .select('*')
    .eq('staff_id', staffId)
    .order('day_of_week');
  if (error) throw error;
  return (data ?? []) as StaffScheduleRow[];
}

export async function fetchAllSchedulesForSalon(
  client: SupabaseClient,
  salonId: string,
): Promise<StaffScheduleRow[]> {
  const { data, error } = await client
    .from('staff_schedules')
    .select('*, staff!inner(salon_id)')
    .eq('staff.salon_id', salonId)
    .order('day_of_week');
  if (error) throw error;
  return (data ?? []) as StaffScheduleRow[];
}

export async function upsertSchedule(
  client: SupabaseClient,
  staffId: string,
  dayOfWeek: number,
  startTime: string | null,
  endTime: string | null,
  isWorking: boolean,
): Promise<void> {
  const { data: existing } = await client
    .from('staff_schedules')
    .select('id')
    .eq('staff_id', staffId)
    .eq('day_of_week', dayOfWeek)
    .maybeSingle();

  if (existing) {
    const { error } = await client
      .from('staff_schedules')
      .update({ start_time: startTime, end_time: endTime, is_working: isWorking })
      .eq('id', (existing as any).id);
    if (error) throw error;
  } else {
    const { error } = await client
      .from('staff_schedules')
      .insert({ staff_id: staffId, day_of_week: dayOfWeek, start_time: startTime, end_time: endTime, is_working: isWorking });
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Staff Shifts
// ---------------------------------------------------------------------------

export async function fetchStaffShifts(
  client: SupabaseClient,
  staffId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<StaffShiftRow[]> {
  let q = client.from('staff_shifts').select('*').eq('staff_id', staffId);
  if (dateFrom) q = q.gte('shift_date', dateFrom);
  if (dateTo) q = q.lte('shift_date', dateTo);
  const { data, error } = await q.order('shift_date');
  if (error) throw error;
  return (data ?? []) as StaffShiftRow[];
}

export async function createShift(
  client: SupabaseClient,
  input: { staff_id: string; schedule_id?: string; shift_date?: string; start_time: string; end_time: string; shift_type?: string },
): Promise<StaffShiftRow> {
  const { data, error } = await client
    .from('staff_shifts')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as StaffShiftRow;
}

// ---------------------------------------------------------------------------
// Staff Breaks
// ---------------------------------------------------------------------------

export async function fetchStaffBreaks(
  client: SupabaseClient,
  staffId: string,
): Promise<StaffBreakRow[]> {
  const { data, error } = await client
    .from('staff_breaks')
    .select('*')
    .eq('staff_id', staffId);
  if (error) throw error;
  return (data ?? []) as StaffBreakRow[];
}

export async function createBreak(
  client: SupabaseClient,
  input: { staff_id: string; shift_id?: string; break_start: string; break_end: string; break_date?: string },
): Promise<StaffBreakRow> {
  const { data, error } = await client
    .from('staff_breaks')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as StaffBreakRow;
}

// ---------------------------------------------------------------------------
// Blocked Times
// ---------------------------------------------------------------------------

export async function fetchBlockedTimes(
  client: SupabaseClient,
  staffId: string,
): Promise<StaffBlockedTimeRow[]> {
  const { data, error } = await client
    .from('staff_blocked_times')
    .select('*')
    .eq('staff_id', staffId)
    .order('start_at');
  if (error) throw error;
  return (data ?? []) as StaffBlockedTimeRow[];
}

export async function createBlockedTime(
  client: SupabaseClient,
  input: { staff_id: string; start_at: string; end_at: string; reason?: string },
): Promise<void> {
  const { error } = await client.from('staff_blocked_times').insert(input);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------

export async function fetchAttendance(
  client: SupabaseClient,
  salonId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<AttendanceRow[]> {
  let q = client.from('staff_attendance').select('*').eq('business_id', salonId);
  if (dateFrom) q = q.gte('attendance_date', dateFrom);
  if (dateTo) q = q.lte('attendance_date', dateTo);
  const { data, error } = await q.order('attendance_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

export async function fetchAttendanceForStaff(
  client: SupabaseClient,
  staffId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<AttendanceRow[]> {
  let q = client.from('staff_attendance').select('*').eq('staff_id', staffId);
  if (dateFrom) q = q.gte('attendance_date', dateFrom);
  if (dateTo) q = q.lte('attendance_date', dateTo);
  const { data, error } = await q.order('attendance_date', { ascending: false });
  if (error) throw error;
  return (data ?? []) as AttendanceRow[];
}

export async function clockIn(
  client: SupabaseClient,
  staffId: string,
  businessId: string,
  date: string,
): Promise<AttendanceRow> {
  const { data, error } = await client
    .from('staff_attendance')
    .insert({
      staff_id: staffId,
      business_id: businessId,
      attendance_date: date,
      check_in: new Date().toISOString(),
      status: 'present',
    })
    .select()
    .single();
  if (error) throw error;
  return data as AttendanceRow;
}

export async function clockOut(
  client: SupabaseClient,
  attendanceId: string,
): Promise<void> {
  const { error } = await client
    .from('staff_attendance')
    .update({ check_out: new Date().toISOString() })
    .eq('id', attendanceId);
  if (error) throw error;
}

export async function updateAttendance(
  client: SupabaseClient,
  attendanceId: string,
  patch: Partial<AttendanceRow>,
): Promise<void> {
  const { error } = await client
    .from('staff_attendance')
    .update(patch)
    .eq('id', attendanceId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------

export async function fetchLeaveTypes(
  client: SupabaseClient,
  salonId: string,
): Promise<LeaveTypeRow[]> {
  const { data, error } = await client
    .from('leave_types')
    .select('*')
    .eq('business_id', salonId)
    .eq('is_active', true)
    .order('name');
  if (error) throw error;
  return (data ?? []) as LeaveTypeRow[];
}

export async function fetchLeaveBalances(
  client: SupabaseClient,
  staffId: string,
  year: number,
): Promise<LeaveBalanceRow[]> {
  const { data, error } = await client
    .from('staff_leave_balances')
    .select('*')
    .eq('staff_id', staffId)
    .eq('year', year);
  if (error) throw error;
  return (data ?? []) as LeaveBalanceRow[];
}

export async function fetchLeaveRequests(
  client: SupabaseClient,
  staffId: string,
): Promise<LeaveRequestRow[]> {
  const { data, error } = await client
    .from('staff_leave_requests')
    .select('*')
    .eq('staff_id', staffId)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeaveRequestRow[];
}

export async function fetchAllLeaveRequests(
  client: SupabaseClient,
  salonId: string,
): Promise<LeaveRequestRow[]> {
  const { data, error } = await client
    .from('staff_leave_requests')
    .select('*, staff!inner(salon_id)')
    .eq('staff.salon_id', salonId)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LeaveRequestRow[];
}

export async function createLeaveRequest(
  client: SupabaseClient,
  input: { staff_id: string; leave_type_id: string; start_date: string; end_date: string; total_days: number; reason?: string },
): Promise<LeaveRequestRow> {
  const { data, error } = await client
    .from('staff_leave_requests')
    .insert({ ...input, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data as LeaveRequestRow;
}

export async function approveLeave(
  client: SupabaseClient,
  requestId: string,
  managerNote?: string,
): Promise<any> {
  const { data, error } = await client.rpc('approve_leave_request', {
    p_request_id: requestId,
    p_manager_note: managerNote || null,
  });
  if (error) throw error;
  return data;
}

export async function rejectLeave(
  client: SupabaseClient,
  requestId: string,
  managerNote?: string,
): Promise<any> {
  const { data, error } = await client.rpc('reject_leave_request', {
    p_request_id: requestId,
    p_manager_note: managerNote || null,
  });
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Shift Swap
// ---------------------------------------------------------------------------

export async function fetchShiftSwapRequests(
  client: SupabaseClient,
  staffId: string,
): Promise<ShiftSwapRow[]> {
  const { data, error } = await client
    .from('staff_shift_swap_requests')
    .select('*')
    .or(`requesting_staff_id.eq.${staffId},replacement_staff_id.eq.${staffId}`)
    .order('requested_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ShiftSwapRow[];
}

export async function createShiftSwapRequest(
  client: SupabaseClient,
  input: {
    requesting_staff_id: string;
    replacement_staff_id: string;
    shift_id?: string;
    swap_date: string;
    original_start_time: string;
    original_end_time: string;
    reason?: string;
  },
): Promise<ShiftSwapRow> {
  const { data, error } = await client
    .from('staff_shift_swap_requests')
    .insert({ ...input, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data as ShiftSwapRow;
}

export async function approveSwap(
  client: SupabaseClient,
  requestId: string,
): Promise<any> {
  const { data, error } = await client.rpc('approve_shift_swap', { p_request_id: requestId });
  if (error) throw error;
  return data;
}

export async function rejectSwap(
  client: SupabaseClient,
  requestId: string,
): Promise<any> {
  const { data, error } = await client.rpc('reject_shift_swap', { p_request_id: requestId });
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export async function fetchPayrollPeriods(
  client: SupabaseClient,
  salonId: string,
): Promise<PayrollPeriodRow[]> {
  const { data, error } = await client
    .from('payroll_periods')
    .select('*')
    .eq('business_id', salonId)
    .order('period_start', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PayrollPeriodRow[];
}

export async function createPayrollPeriod(
  client: SupabaseClient,
  salonId: string,
  periodStart: string,
  periodEnd: string,
): Promise<PayrollPeriodRow> {
  const { data, error } = await client
    .from('payroll_periods')
    .insert({ business_id: salonId, period_start: periodStart, period_end: periodEnd, status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  return data as PayrollPeriodRow;
}

export async function fetchPayrollRecords(
  client: SupabaseClient,
  periodId: string,
): Promise<PayrollRecordRow[]> {
  const { data, error } = await client
    .from('staff_payroll_records')
    .select('*')
    .eq('payroll_period_id', periodId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as PayrollRecordRow[];
}

export async function fetchPayrollRecordForStaff(
  client: SupabaseClient,
  staffId: string,
): Promise<PayrollRecordRow[]> {
  const { data, error } = await client
    .from('staff_payroll_records')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PayrollRecordRow[];
}

export async function calculatePayrollRecord(
  client: SupabaseClient,
  periodId: string,
  staffId: string,
  baseSalary: number,
): Promise<string> {
  const { data, error } = await client.rpc('calculate_payroll_record', {
    p_payroll_period_id: periodId,
    p_staff_id: staffId,
    p_base_salary: baseSalary,
  });
  if (error) throw error;
  return data as string;
}

export async function processPayroll(
  client: SupabaseClient,
  periodId: string,
): Promise<any> {
  const { data, error } = await client.rpc('process_payroll', { p_payroll_period_id: periodId });
  if (error) throw error;
  return data;
}

export async function settlePayroll(
  client: SupabaseClient,
  periodId: string,
): Promise<any> {
  const { data, error } = await client.rpc('settle_payroll', { p_payroll_period_id: periodId });
  if (error) throw error;
  return data;
}

export async function fetchCommissions(
  client: SupabaseClient,
  recordId: string,
): Promise<CommissionRow[]> {
  const { data, error } = await client
    .from('staff_payroll_commissions')
    .select('*')
    .eq('payroll_record_id', recordId)
    .order('created_at');
  if (error) throw error;
  return (data ?? []) as CommissionRow[];
}

export async function addBonus(
  client: SupabaseClient,
  input: { staff_id: string; payroll_period_id?: string; bonus_type: BonusType; amount: number; description?: string },
): Promise<void> {
  const { error } = await client.from('staff_bonus_records').insert(input);
  if (error) throw error;
}

export async function addDeduction(
  client: SupabaseClient,
  input: { payroll_record_id: string; staff_id: string; deduction_type: DeductionType; amount: number; description?: string },
): Promise<void> {
  const { error } = await client.from('staff_payroll_deductions').insert(input);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Roles & Permissions
// ---------------------------------------------------------------------------

export async function fetchRoles(
  client: SupabaseClient,
  salonId: string,
): Promise<StaffRoleRow[]> {
  const { data, error } = await client
    .from('staff_roles')
    .select('*')
    .eq('business_id', salonId)
    .order('is_system_role', { ascending: false })
    .order('name');
  if (error) throw error;
  return (data ?? []) as StaffRoleRow[];
}

export async function fetchPermissions(client: SupabaseClient): Promise<PermissionRow[]> {
  const { data, error } = await client
    .from('permissions')
    .select('*')
    .order('module')
    .order('action');
  if (error) throw error;
  return (data ?? []) as PermissionRow[];
}

export async function fetchRolePermissions(
  client: SupabaseClient,
  roleId: string,
): Promise<RolePermissionRow[]> {
  const { data, error } = await client
    .from('role_permissions')
    .select('*')
    .eq('role_id', roleId);
  if (error) throw error;
  return (data ?? []) as RolePermissionRow[];
}

export async function setRolePermission(
  client: SupabaseClient,
  roleId: string,
  permissionId: string,
  grant: boolean,
): Promise<void> {
  if (grant) {
    const { error } = await client
      .from('role_permissions')
      .insert({ role_id: roleId, permission_id: permissionId })
      .select();
    if (error && !error.message.includes('duplicate')) throw error;
  } else {
    const { error } = await client
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);
    if (error) throw error;
  }
}

export async function createRole(
  client: SupabaseClient,
  salonId: string,
  name: string,
  description: string,
): Promise<StaffRoleRow> {
  const { data, error } = await client
    .from('staff_roles')
    .insert({ business_id: salonId, name: name.trim(), description: description.trim(), is_system_role: false })
    .select()
    .single();
  if (error) throw error;
  return data as StaffRoleRow;
}

export async function deleteRole(
  client: SupabaseClient,
  roleId: string,
): Promise<void> {
  const { error } = await client.from('staff_roles').delete().eq('id', roleId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Services & Skills
// ---------------------------------------------------------------------------

export async function fetchServices(
  client: SupabaseClient,
  salonId: string,
): Promise<ServiceRow[]> {
  const { data, error } = await client
    .from('services')
    .select('*')
    .eq('salon_id', salonId)
    .is('deleted_at', null)
    .order('name');
  if (error) throw error;
  return (data ?? []) as ServiceRow[];
}

export async function fetchSkills(
  client: SupabaseClient,
  salonId: string,
): Promise<SkillRow[]> {
  const { data, error } = await client
    .from('skills')
    .select('*')
    .eq('business_id', salonId)
    .order('name');
  if (error) throw error;
  return (data ?? []) as SkillRow[];
}

export async function fetchStaffServices(
  client: SupabaseClient,
  staffId: string,
): Promise<StaffServiceRow[]> {
  const { data, error } = await client
    .from('staff_services')
    .select('*')
    .eq('staff_id', staffId);
  if (error) throw error;
  return (data ?? []) as StaffServiceRow[];
}

export async function setStaffService(
  client: SupabaseClient,
  staffId: string,
  serviceId: string,
  isActive: boolean,
  customPrice?: number,
  customDuration?: number,
  commissionOverride?: number,
): Promise<void> {
  const { error } = await client
    .from('staff_services')
    .upsert({
      staff_id: staffId,
      service_id: serviceId,
      is_active: isActive,
      custom_price_paise: customPrice || null,
      custom_duration_minutes: customDuration || null,
      commission_percent_override: commissionOverride || null,
    }, { onConflict: 'staff_id,service_id' });
  if (error) throw error;
}

export async function fetchStaffSkills(
  client: SupabaseClient,
  staffId: string,
): Promise<StaffSkillRow[]> {
  const { data, error } = await client
    .from('staff_skills')
    .select('*')
    .eq('staff_id', staffId);
  if (error) throw error;
  return (data ?? []) as StaffSkillRow[];
}

export async function setStaffSkill(
  client: SupabaseClient,
  staffId: string,
  skillId: string,
  add: boolean,
): Promise<void> {
  if (add) {
    const { error } = await client
      .from('staff_skills')
      .insert({ staff_id: staffId, skill_id: skillId })
      .select();
    if (error && !error.message.includes('duplicate')) throw error;
  } else {
    const { error } = await client
      .from('staff_skills')
      .delete()
      .eq('staff_id', staffId)
      .eq('skill_id', skillId);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Emergency Contacts
// ---------------------------------------------------------------------------

export async function fetchEmergencyContacts(
  client: SupabaseClient,
  staffId: string,
): Promise<EmergencyContactRow[]> {
  const { data, error } = await client
    .from('staff_emergency_contacts')
    .select('*')
    .eq('staff_id', staffId);
  if (error) throw error;
  return (data ?? []) as EmergencyContactRow[];
}

export async function saveEmergencyContact(
  client: SupabaseClient,
  staffId: string,
  name: string,
  relationship: string,
  phone: string,
): Promise<void> {
  const { error } = await client
    .from('staff_emergency_contacts')
    .insert({ staff_id: staffId, name, relationship, phone });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

export async function fetchDocuments(
  client: SupabaseClient,
  staffId: string,
): Promise<DocumentRow[]> {
  const { data, error } = await client
    .from('staff_documents')
    .select('*')
    .eq('staff_id', staffId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as DocumentRow[];
}

export async function createDocument(
  client: SupabaseClient,
  input: { staff_id: string; document_type: DocType; file_name: string; storage_path: string; mime_type?: string; file_size?: number },
): Promise<DocumentRow> {
  const { data, error } = await client
    .from('staff_documents')
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data as DocumentRow;
}

// ---------------------------------------------------------------------------
// Audit Logs
// ---------------------------------------------------------------------------

export async function fetchAuditLogs(
  client: SupabaseClient,
  salonId: string,
  staffId?: string,
): Promise<AuditLogRow[]> {
  let q = client.from('staff_audit_logs').select('*').eq('business_id', salonId);
  if (staffId) q = q.eq('staff_id', staffId);
  const { data, error } = await q.order('performed_at', { ascending: false }).limit(100);
  if (error) throw error;
  return (data ?? []) as AuditLogRow[];
}

export async function insertAuditLog(
  client: SupabaseClient,
  input: { business_id: string; staff_id?: string; action: string; entity_type?: string; entity_id?: string; note?: string },
): Promise<void> {
  const { error } = await client.from('staff_audit_logs').insert(input);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Payment Accounts
// ---------------------------------------------------------------------------

export async function fetchPaymentAccounts(
  client: SupabaseClient,
  staffId: string,
): Promise<PaymentAccountRow[]> {
  const { data, error } = await client
    .from('staff_payment_accounts')
    .select('*')
    .eq('staff_id', staffId);
  if (error) throw error;
  return (data ?? []) as PaymentAccountRow[];
}

// ---------------------------------------------------------------------------
// Commission Settings
// ---------------------------------------------------------------------------

export async function fetchCommissionSettings(
  client: SupabaseClient,
  staffId: string,
): Promise<CommissionSettingsRow | null> {
  const { data, error } = await client
    .from('staff_commission_settings')
    .select('*')
    .eq('staff_id', staffId)
    .maybeSingle();
  if (error) throw error;
  return data as CommissionSettingsRow | null;
}

export async function fetchServiceCommissions(
  client: SupabaseClient,
  staffId: string,
): Promise<StaffServiceCommissionRow[]> {
  const { data, error } = await client
    .from('staff_service_commissions')
    .select('*')
    .eq('staff_id', staffId);
  if (error) throw error;
  return (data ?? []) as StaffServiceCommissionRow[];
}

// ---------------------------------------------------------------------------
// Bookings (reuse existing)
// ---------------------------------------------------------------------------

export async function fetchBookingsForStaff(
  client: SupabaseClient,
  staffId: string,
  dateFrom?: string,
  dateTo?: string,
): Promise<any[]> {
  let q = client
    .from('bookings')
    .select('*, booking_items(service_id, service_name_snapshot, unit_price_paise, line_total_paise)')
    .eq('staff_id', staffId);
  if (dateFrom) q = q.gte('appointment_start', dateFrom);
  if (dateTo) q = q.lte('appointment_start', dateTo);
  const { data, error } = await q.order('appointment_start', { ascending: false }).limit(50);
  if (error) throw error;
  return data ?? [];
}

export async function fetchBookingsForSalon(
  client: SupabaseClient,
  salonId: string,
): Promise<any[]> {
  const { data, error } = await client
    .from('bookings')
    .select('*, booking_items(staff_id, service_id, service_name_snapshot, unit_price_paise, line_total_paise)')
    .eq('salon_id', salonId)
    .order('appointment_start', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Available Slots (RPC)
// ---------------------------------------------------------------------------

export async function getAvailableSlots(
  client: SupabaseClient,
  businessId: string,
  staffId: string,
  serviceId: string,
  date: string,
): Promise<{ slot_start: string; slot_end: string }[]> {
  const { data, error } = await client.rpc('get_staff_available_slots', {
    p_business_id: businessId,
    p_staff_id: staffId,
    p_service_id: serviceId,
    p_date: date,
  });
  if (error) throw error;
  return (data ?? []) as { slot_start: string; slot_end: string }[];
}

// ---------------------------------------------------------------------------
// Reviews / Ratings (existing table)
// ---------------------------------------------------------------------------

export async function fetchReviewsForStaff(
  client: SupabaseClient,
  salonId: string,
): Promise<any[]> {
  const { data, error } = await client
    .from('reviews')
    .select('*')
    .eq('salon_id', salonId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) {
    // reviews table might not exist
    return [];
  }
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

export async function fetchCurrentStaffProfile(
  client: SupabaseClient,
): Promise<StaffRow | null> {
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  const { data, error } = await client
    .from('staff')
    .select('*')
    .eq('user_id', user.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) return null;
  return data as StaffRow | null;
}

export async function checkPermission(
  client: SupabaseClient,
  module: string,
  action: string,
): Promise<boolean> {
  const { data, error } = await client.rpc('check_staff_permission', {
    p_module: module,
    p_action: action,
  });
  if (error) return false;
  return data === true;
}

export { money, moneyFromRupees };
