# Admin Restoration Handoff

Purpose: Enable seamless continuation of the ongoing “System Admin UI restoration” work from another session/window with a clear checklist, impacted files, data dependencies, and next steps.

## How To Run

- Dev server: `npm run dev`
- Lint: `npm run lint`
- Full lint: `npm run lint:full`
- Type-check (repo has pre‑existing TS errors not introduced by this work): `npm run type-check`

No protected files were modified (`/lib/supabase/*`, `/middleware.ts`, `/app/auth/actions.ts`).

## Key Modules Restored (Read‑only first)

- System / Audit Logs
  - `app/dashboard/admin/system/page.tsx:1`
  - `app/dashboard/admin/audit-logs/page.tsx:1`
- Documents
  - Unified list (recent): `app/dashboard/admin/documents/page.tsx:1`
  - Photo Grid (filters/pagination/preview): `app/dashboard/admin/documents/photo-grid/page.tsx:1`
  - Markup (filters/pagination): `app/dashboard/admin/documents/markup/page.tsx:1`
  - Markup detail (read): `app/dashboard/admin/documents/markup/[id]/page.tsx:1`
  - Invoice (filters/pagination): `app/dashboard/admin/documents/invoice/page.tsx:1`
  - My Documents: `app/dashboard/admin/documents/my-documents/page.tsx:1`
  - Site Documents: `app/dashboard/admin/sites/[id]/documents/page.tsx:1`
  - Unified detail (history/access logs): `app/dashboard/admin/documents/[id]/page.tsx:1`
  - Upload (metadata or file): `app/dashboard/admin/documents/upload/page.tsx:1`, `components/admin/documents/MinimalDocumentUpload.tsx:1`
- Daily Reports
  - List (links to detail/edit): `app/dashboard/admin/daily-reports/page.tsx:1`
  - Detail: `app/dashboard/admin/daily-reports/[id]/page.tsx:1`
  - Edit (status/notes): `app/dashboard/admin/daily-reports/[id]/edit/page.tsx:1`
- Materials
  - Tabs Inventory/Requests/Shipments/NPC‑1000 (filters+pagination): `app/dashboard/admin/materials/page.tsx:1`
- Sites
  - Site detail (info/recent docs/recent reports + assignments/requests): `app/dashboard/admin/sites/[id]/page.tsx:1`
- Required Documents
  - List: `app/dashboard/admin/document-requirements/page.tsx:1`
  - Type detail: `app/dashboard/admin/document-requirements/[id]/page.tsx:1`
  - Admin required docs (submission list via API): `app/dashboard/admin/documents/required/page.tsx:1`
  - Admin required doc type submissions: `app/dashboard/admin/documents/required/[documentType]/page.tsx:1`
- Work Options
  - `app/dashboard/admin/work-options/page.tsx:1` (reads `/api/admin/work-options`)
- Communication / Notifications
  - Notifications (recent logs): `app/dashboard/admin/notifications/page.tsx:1`
  - Communication Center (announce list + create form): `app/dashboard/admin/communication/page.tsx:1`, `components/admin/communication/AnnouncementCreateForm.tsx:1`
- Organizations
  - Create form: `app/dashboard/admin/organizations/new/page.tsx:1`, `components/admin/organizations/OrganizationCreateForm.tsx:1`
- Integrated Dashboard
  - `app/dashboard/admin/integrated/page.tsx:1`

## Server Actions / APIs Leveraged

- System / Audit: `app/actions/admin/system.ts:1`
- Daily Reports: `app/actions/admin/daily-reports.ts:1`
- Materials: `app/actions/admin/materials.ts:1`
- Sites: `app/actions/admin/sites.ts:1`
- Dashboard Stats: `app/actions/admin/dashboard-stats.ts:1`
- Upload APIs: `/api/unified-documents/v2` (JSON), `/api/unified-documents/v2/upload` (FormData)
- Required Docs Admin: `/api/admin/documents/required`
- Work Options: `/api/admin/work-options`
- Announcements: `/api/announcements`

## Data Dependencies (Tables/Views read)

- Unified: `unified_document_system`, `unified_documents`, `document_history`, `document_access_logs` (if present)
- Photo Grid: `photo_grid_reports`
- Markup: `markup_documents`
- Materials: `material_inventory`, `material_requests`, `material_shipments`, `material_productions`, `shipment_items`
- Daily Reports: `daily_reports`, `daily_report_workers` (optional), `work_records`
- Users/Sites: `profiles`, `sites`, `site_assignments`
- Notifications: `notification_logs`, `announcement_*` tables, `announcements`

If a table is absent in a given environment, most screens fail quietly or show empty lists; upload/detail history try/catch as needed.

## Notable UX Patterns Used

- Filters & pagination via `searchParams` in server components
- Read‑only first, minimal writes (daily report edit, organization create, announcements create)
- Internal API fetch in server components using relative `/api/...` URLs; optional `NEXT_PUBLIC_BASE_URL` fallback considered but not required on server

## Known Repo State

- Lint: clean
- TypeScript: repo‑wide existing errors (tests/types) remain; not introduced by this work. Safe to proceed with UI.

## Quick Verify Checklist

- System: `/dashboard/admin/system`
- Audit Logs (filters): `/dashboard/admin/audit-logs`
- Documents
  - Unified recent: `/dashboard/admin/documents`
  - Photo Grid: `/dashboard/admin/documents/photo-grid`
  - Markup: `/dashboard/admin/documents/markup`
  - Invoice: `/dashboard/admin/documents/invoice`
  - My Docs: `/dashboard/admin/documents/my-documents`
  - Doc detail: `/dashboard/admin/documents/<id>`
  - Upload: `/dashboard/admin/documents/upload`
- Daily Reports
  - List: `/dashboard/admin/daily-reports`
  - Detail: `/dashboard/admin/daily-reports/<id>`
  - Edit: `/dashboard/admin/daily-reports/<id>/edit`
- Materials: `/dashboard/admin/materials?tab=inventory`
- Sites
  - Detail: `/dashboard/admin/sites/<id>`
  - Site docs: `/dashboard/admin/sites/<id>/documents`
- Required Docs: `/dashboard/admin/document-requirements`
- Work Options: `/dashboard/admin/work-options`
- Notifications: `/dashboard/admin/notifications`
- Communication (announcements + list): `/dashboard/admin/communication`
- Organizations new: `/dashboard/admin/organizations/new`

## Remaining Candidates With Placeholders (optional next)

- Some personal/advanced document flows (approval/sharing write flows)
- Deeper markup tooling/preview
- Advanced upload UX (progress bars, validations)
- Extended filters & server‑driven pagination for all lists

## How To Continue in a New Session

1. Start dev: `npm run dev`
2. Navigate using the “Quick Verify Checklist” above
3. To add a new admin page with filters:
   - Create `page.tsx` (server component)
   - Read `searchParams` for `page/limit/search/...`
   - Invoke server action or Supabase query with `{ count: 'exact' }`
   - Render table + prev/next links preserving query
4. If a list needs write actions, prefer existing server actions (in `app/actions/admin/*`).

---

Maintainer notes:

- No protected files touched. All new UI kept read‑only by default.
- For environments without some tables, UI should degrade gracefully.
