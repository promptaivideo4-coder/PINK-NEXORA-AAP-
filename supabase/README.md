# Supabase Database Migrations

## Migration Order

**IMPORTANT: Apply migrations in this exact order to avoid dependency errors.**

### Base Schema (Must be applied FIRST)
1. **20260829_base_schema_core_tables.sql** - Creates foundational tables
   - `organizations`
   - `organization_members`
   - `salons`
   - `services`
   - `customers`
   - `bookings`
   - `booking_items`
   - `salon_hours`
   - `salon_public_websites`
   - `salon_setup_proposals`
   - All RLS policies for these tables

### Location & Onboarding
2. **20260810_location_fields.sql** - Adds location fields to salons
3. **20260810_onboarding_progress.sql** - Creates onboarding progress table
4. **20260825_user_live_locations.sql** - Creates live location tracking table

### Staff Management (Phases 1-5)
5. **20260809_staff_management_phase1.sql** - Staff foundation
   - Extends `staff` table
   - Extends `staff_services` table
   - Creates: `staff_emergency_contacts`, `skills`, `staff_skills`, `staff_service_commissions`, `staff_commission_settings`
   - RLS policies for all tables

6. **20260809_staff_management_phase2.sql** - Role & Permission System
   - Creates: `staff_roles`, `permissions`, `role_permissions`
   - Seeds default permissions and roles
   - RLS policies

7. **20260809_staff_management_phase3.sql** - Scheduling & Availability
   - Creates: `staff_shifts`, `staff_breaks`, `staff_blocked_times`, `staff_availability_overrides`
   - Adds availability calculation RPC
   - RLS policies

8. **20260809_staff_management_phase4.sql** - Attendance, Leave & Shift Swap
   - Creates: `staff_attendance`, `leave_types`, `staff_leave_balances`, `staff_leave_requests`, `staff_shift_swap_requests`
   - RPCs for leave and shift swap approvals
   - RLS policies

9. **20260809_staff_management_phase5.sql** - Payroll & Documents
   - Creates: `payroll_periods`, `staff_payroll_records`, `staff_payroll_commissions`, `staff_bonus_records`, `staff_payroll_deductions`, `staff_payment_accounts`, `staff_documents`, `staff_audit_logs`
   - Creates storage bucket for private documents
   - RPCs for payroll calculation and processing
   - RLS policies

## Application Steps

### For New Database
```bash
# Apply all migrations in order
psql -U postgres -d your_database -f supabase/20260829_base_schema_core_tables.sql
psql -U postgres -d your_database -f supabase/20260810_location_fields.sql
psql -U postgres -d your_database -f supabase/20260810_onboarding_progress.sql
psql -U postgres -d your_database -f supabase/20260825_user_live_locations.sql
psql -U postgres -d your_database -f supabase/20260809_staff_management_phase1.sql
psql -U postgres -d your_database -f supabase/20260809_staff_management_phase2.sql
psql -U postgres -d your_database -f supabase/20260809_staff_management_phase3.sql
psql -U postgres -d your_database -f supabase/20260809_staff_management_phase4.sql
psql -U postgres -d your_database -f supabase/20260809_staff_management_phase5.sql
```

### For Existing Database
1. Run `20260829_base_schema_core_tables.sql` first (creates missing tables)
2. Then run the remaining migrations in order

### Using Supabase Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Run each migration file in the order listed above

## Table Dependencies

```
organizations
  └─ organization_members
      └─ salons
          ├─ services
          │   └─ booking_items
          ├─ customers
          │   └─ bookings
          │       └─ booking_items
          ├─ staff
          │   ├─ staff_emergency_contacts
          │   ├─ staff_skills
          │   ├─ staff_services
          │   ├─ staff_service_commissions
          │   ├─ staff_commission_settings
          │   ├─ staff_shifts
          │   │   └─ staff_breaks
          │   ├─ staff_blocked_times
          │   ├─ staff_availability_overrides
          │   ├─ staff_attendance
          │   ├─ staff_leave_balances
          │   ├─ staff_leave_requests
          │   └─ staff_shift_swap_requests
          ├─ salon_hours
          ├─ salon_public_websites
          └─ salon_setup_proposals

staff_roles
  └─ role_permissions
      └─ permissions

payroll_periods
  └─ staff_payroll_records
      ├─ staff_payroll_commissions
      └─ staff_payroll_deductions

staff_payment_accounts
staff_documents
staff_audit_logs
```

## RLS Policies

All tables have Row Level Security enabled with proper tenant isolation:

- **Owners/Managers** have full access to their salon's data
- **Staff** have read access to their salon's data
- **Customers** can view their own bookings and profile
- **Public** can view verified salons and services

## Helper Functions

The base schema includes these helper functions for RLS:

- `user_is_org_member(p_organization_id, p_required_roles)` - Check if user is member of organization
- `user_manages_salon(p_salon_id)` - Check if user can manage a salon
- `user_is_salon_staff(p_salon_id)` - Check if user is staff of a salon
- `user_is_customer(p_salon_id)` - Check if user is a customer of a salon

## Notes

1. The `20260829_base_schema_core_tables.sql` migration includes backfill logic to migrate existing `salon_profiles` to the new schema
2. All tables have `created_at` and `updated_at` timestamps
3. All tables use soft delete pattern with `deleted_at` column
4. All foreign key relationships use `ON DELETE CASCADE` where appropriate
5. All migrations include proper indexes for performance
