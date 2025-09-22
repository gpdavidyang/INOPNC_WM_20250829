# Work Records Migration Documentation

## Overview
This document describes the complete migration from the dual-table system (`attendance_records` and `worker_assignments`) to a unified `work_records` table.

## Migration Date
- **Completed**: 2025-09-11
- **Version**: 1.0.0

## Background
The system previously used two separate tables to track worker attendance and assignments:
- `attendance_records`: For regular employees with fixed salaries
- `worker_assignments`: For daily workers with labor-hours based payment

This caused data inconsistency and made salary calculations complex and error-prone.

## Migration Goals
1. ✅ Unify all worker data into a single table
2. ✅ Standardize salary calculation based on labor hours (공수)
3. ✅ Remove dependency on `daily_reports` table
4. ✅ Maintain data integrity during migration
5. ✅ Update all source code to use the new structure

## Migration Steps Completed

### 1. Database Schema Changes
```sql
-- Renamed worker_assignments to work_records
ALTER TABLE worker_assignments RENAME TO work_records;

-- Made daily_report_id nullable
ALTER TABLE work_records 
ALTER COLUMN daily_report_id DROP NOT NULL;

-- Removed foreign key constraint
ALTER TABLE work_records 
DROP CONSTRAINT work_records_daily_report_id_fkey;

-- Added performance indexes
CREATE INDEX idx_work_records_work_date ON work_records(work_date);
CREATE INDEX idx_work_records_site_id ON work_records(site_id);
CREATE INDEX idx_work_records_profile_id ON work_records(profile_id);
CREATE INDEX idx_work_records_user_id ON work_records(user_id);
```

### 2. Data Migration
- **Total Records Migrated**: 76 valid records from `attendance_records`
- **Invalid Records Skipped**: 262 test records with invalid user IDs
- **Final Record Count**: 90 records in `work_records`

### 3. Backup Strategy
```sql
-- Created backup table
CREATE TABLE attendance_records_backup AS 
SELECT * FROM attendance_records;

-- Archived original table
ALTER TABLE attendance_records 
RENAME TO attendance_records_archived;
```

### 4. Source Code Updates
Updated all TypeScript/React components to use `work_records`:

#### Components Updated:
- `/components/admin/salary/IndividualMonthlySalary.tsx`
- `/components/admin/salary/SalaryStatementManager.tsx`
- `/components/admin/salary/DailySalaryCalculation.tsx`
- `/components/admin/salary/SalaryStatsDashboard.tsx`
- `/components/dashboard/tabs/attendance-tab.tsx`
- `/components/admin/SiteManagementList.tsx`

#### API Routes Updated:
- `/app/api/partner/labor/by-site/route.ts`
- `/app/api/partner/labor/summary/route.ts`
- `/app/payslip/[userId]/[year]/[month]/page.tsx`
- `/app/actions/daily-reports.ts`
- `/app/actions/admin/daily-reports.ts`

#### Services Updated:
- `/lib/services/salary-calculation.service.ts`

## New Table Structure: `work_records`

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| daily_report_id | uuid | Legacy field (nullable, no FK) |
| profile_id | uuid | Worker profile reference |
| user_id | uuid | User account reference |
| work_date | date | Date of work |
| site_id | uuid | Work site reference |
| labor_hours | numeric | Work units (1 unit = 8 hours) |
| work_hours | numeric | Actual work hours |
| overtime_hours | numeric | Overtime hours |
| check_in_time | time | Check-in time |
| check_out_time | time | Check-out time |
| status | text | Attendance status |
| notes | text | Additional notes |
| created_at | timestamp | Record creation time |
| updated_at | timestamp | Last update time |

## Salary Calculation Logic

### Unified Formula
All workers now use labor-hours based calculation:
```typescript
// 1 labor unit (공수) = 8 hours of work
const actualWorkHours = laborHours * 8
const baseHours = Math.min(actualWorkHours, 8)
const overtimeHours = Math.max(actualWorkHours - 8, 0)

const dailyBasePay = baseHours * hourlyRate
const dailyOvertimePay = overtimeHours * overtimeRate
```

### Deductions (Monthly)
- Income Tax: 8%
- National Pension: 4.5%
- Health Insurance: 3.43%
- Employment Insurance: 0.9%

## Verification Tests

### Test Results (2025-09-11)
- ✅ work_records table exists: 90 records
- ✅ attendance_records archived successfully
- ✅ Backup table created
- ✅ Salary calculations working
- ✅ daily_report_id dependency removed
- ✅ Performance indexes created
- ✅ Individual salary calculations verified

## Rollback Plan

If rollback is needed:
```sql
-- 1. Restore attendance_records
ALTER TABLE attendance_records_archived 
RENAME TO attendance_records;

-- 2. Restore worker_assignments
ALTER TABLE work_records 
RENAME TO worker_assignments;

-- 3. Restore foreign key
ALTER TABLE worker_assignments 
ADD CONSTRAINT worker_assignments_daily_report_id_fkey 
FOREIGN KEY (daily_report_id) 
REFERENCES daily_reports(id);

-- 4. Make daily_report_id required again
ALTER TABLE worker_assignments 
ALTER COLUMN daily_report_id SET NOT NULL;
```

## Post-Migration Cleanup (Future)

After verification period (recommended 30 days):
```sql
-- Drop archived tables
DROP TABLE IF EXISTS attendance_records_archived;
DROP TABLE IF EXISTS attendance_records_backup;

-- Remove daily_report_id column
ALTER TABLE work_records 
DROP COLUMN daily_report_id;
```

## Known Issues
- None at this time

## Support
For questions or issues related to this migration, contact the development team.

---

## Appendix: Migration Scripts

### Main Migration Script
- `/scripts/complete-migration-to-work-records.ts`
- `/scripts/migrate-attendance-to-workers.ts`

### Test Scripts
- `/scripts/test-final-migration.ts`
- `/scripts/test-integrated-salary.ts`

## Change Log
- 2025-09-11: Initial migration completed
- 2025-09-11: Documentation created