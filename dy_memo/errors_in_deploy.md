[09:28:36.183] Running build in Washington, D.C., USA (East) – iad1
[09:28:36.183] Build machine configuration: 4 cores, 8 GB
[09:28:36.207] Cloning github.com/gpdavidyang/INOPNC_WM_20250829 (Branch: main, Commit: 6618fb2)
[09:28:37.445] Cloning completed: 1.238s
[09:28:39.301] Restored build cache from previous deployment (BvPHsvN11eMRcxpLVm7MeyoSr6tD)
[09:28:40.589] Running "vercel build"
[09:28:41.011] Vercel CLI 47.1.1
[09:28:41.470] Installing dependencies...
[09:28:52.086] 
[09:28:52.086] > inopnc-wm@0.1.0 prepare
[09:28:52.086] > husky
[09:28:52.086] 
[09:28:52.373] 
[09:28:52.374] added 84 packages, removed 2 packages, and changed 21 packages in 11s
[09:28:52.374] 
[09:28:52.374] 259 packages are looking for funding
[09:28:52.374]   run `npm fund` for details
[09:28:52.705] Detected Next.js version: 14.2.3
[09:28:52.706] Running "next build"
[09:28:53.794]   ▲ Next.js 14.2.3
[09:28:53.795] 
[09:28:54.177]    Creating an optimized production build ...
[09:29:14.855]  ⚠ Compiled with warnings
[09:29:14.856] 
[09:29:14.856] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[09:29:14.856] Critical dependency: the request of a dependency is an expression
[09:29:14.856] 
[09:29:14.856] Import trace for requested module:
[09:29:14.856] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[09:29:14.856] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/platform/node/index.js
[09:29:14.856] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/platform/index.js
[09:29:14.856] ./node_modules/@prisma/instrumentation/node_modules/@opentelemetry/instrumentation/build/esm/index.js
[09:29:14.857] ./node_modules/@prisma/instrumentation/dist/index.js
[09:29:14.857] ./node_modules/@sentry/node/build/cjs/integrations/tracing/prisma.js
[09:29:14.857] ./node_modules/@sentry/node/build/cjs/index.js
[09:29:14.857] ./node_modules/@sentry/nextjs/build/cjs/index.server.js
[09:29:14.857] ./app/global-error.js
[09:29:14.857] 
[09:29:14.857] ./node_modules/require-in-the-middle/index.js
[09:29:14.857] Critical dependency: require function is used in a way in which dependencies cannot be statically extracted
[09:29:14.857] 
[09:29:14.857] Import trace for requested module:
[09:29:14.858] ./node_modules/require-in-the-middle/index.js
[09:29:14.858] ./node_modules/@opentelemetry/instrumentation/build/esm/platform/node/instrumentation.js
[09:29:14.858] ./node_modules/@opentelemetry/instrumentation/build/esm/platform/node/index.js
[09:29:14.858] ./node_modules/@opentelemetry/instrumentation/build/esm/platform/index.js
[09:29:14.858] ./node_modules/@opentelemetry/instrumentation/build/esm/index.js
[09:29:14.858] ./node_modules/@sentry/node/build/cjs/integrations/tracing/postgresjs.js
[09:29:14.858] ./node_modules/@sentry/node/build/cjs/index.js
[09:29:14.859] ./node_modules/@sentry/nextjs/build/cjs/index.server.js
[09:29:14.859] ./app/global-error.js
[09:29:14.859] 
[09:29:34.976]  ✓ Compiled successfully
[09:29:34.977]    Linting and checking validity of types ...
[09:30:07.901] 
[09:30:07.901] Failed to compile.
[09:30:07.902] 
[09:30:07.902] ./app/actions/admin/common.ts
[09:30:07.902] 5:40  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.902] 25:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.902] 26:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.902] 
[09:30:07.903] ./app/actions/admin/email-notifications.ts
[09:30:07.903] 78:30  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.903] 225:31  Warning: 'supabase' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.903] 399:9  Warning: Unexpected console statement.  no-console
[09:30:07.903] 
[09:30:07.903] ./app/actions/admin/markup.ts
[09:30:07.903] 38:7  Warning: Unexpected console statement.  no-console
[09:30:07.903] 
[09:30:07.903] ./app/actions/admin/materials.ts
[09:30:07.903] 306:40  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.903] 
[09:30:07.903] ./app/actions/admin/production.ts
[09:30:07.904] 36:19  Warning: 'profile' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.904] 257:46  Warning: 'period' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.904] 
[09:30:07.904] ./app/actions/admin/salary.ts
[09:30:07.904] 3:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.904] 3:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.904] 206:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.904] 476:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.904] 501:7  Warning: Unexpected console statement.  no-console
[09:30:07.904] 514:7  Warning: Unexpected console statement.  no-console
[09:30:07.905] 526:7  Warning: Unexpected console statement.  no-console
[09:30:07.905] 534:7  Warning: Unexpected console statement.  no-console
[09:30:07.905] 564:17  Warning: 'regularHours' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.905] 565:17  Warning: 'overtimeHours' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.905] 599:7  Warning: Unexpected console statement.  no-console
[09:30:07.905] 600:19  Warning: 'uniqueKey' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.905] 650:7  Warning: Unexpected console statement.  no-console
[09:30:07.905] 684:9  Warning: Unexpected console statement.  no-console
[09:30:07.905] 706:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.905] 1009:13  Warning: 'rules' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.905] 1061:17  Warning: 'regularHours' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.905] 
[09:30:07.905] ./app/actions/admin/shipments.ts
[09:30:07.905] 298:44  Warning: 'period' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.905] 
[09:30:07.905] ./app/actions/admin/sites.ts
[09:30:07.905] 240:21  Warning: 'verifiedSite' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.906] 358:85  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.906] 
[09:30:07.906] ./app/actions/admin/system.ts
[09:30:07.906] 103:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.906] 327:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.906] 335:13  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:07.906] 393:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.906] 
[09:30:07.906] ./app/actions/admin/users.ts
[09:30:07.906] 148:27  Warning: 'totalReports' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.906] 153:27  Warning: 'monthReports' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.906] 348:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.906] 
[09:30:07.906] ./app/actions/admin/worker-salary-settings.ts
[09:30:07.907] 49:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.907] 149:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.907] 274:41  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.907] 
[09:30:07.907] ./app/actions/attendance.ts
[09:30:07.907] 14:3  Warning: Unexpected console statement.  no-console
[09:30:07.907] 26:5  Warning: Unexpected console statement.  no-console
[09:30:07.907] 63:5  Warning: Unexpected console statement.  no-console
[09:30:07.907] 67:5  Warning: Unexpected console statement.  no-console
[09:30:07.907] 103:5  Warning: Unexpected console statement.  no-console
[09:30:07.907] 104:5  Warning: Unexpected console statement.  no-console
[09:30:07.907] 126:11  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.907] 319:11  Warning: 'regularHours' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.907] 676:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.907] 
[09:30:07.907] ./app/actions/backup.ts
[09:30:07.907] 3:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.907] 3:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.907] 9:3  Warning: 'BackupMonitoring' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.907] 
[09:30:07.908] ./app/actions/documents.ts
[09:30:07.908] 34:19  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.908] 
[09:30:07.908] ./app/actions/equipment.ts
[09:30:07.908] 3:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.908] 3:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.908] 403:9  Warning: 'calculatedData' is never reassigned. Use 'const' instead.  prefer-const
[09:30:07.908] 
[09:30:07.908] ./app/actions/force-site-refresh.ts
[09:30:07.908] 9:5  Warning: Unexpected console statement.  no-console
[09:30:07.908] 13:5  Warning: Unexpected console statement.  no-console
[09:30:07.908] 27:7  Warning: Unexpected console statement.  no-console
[09:30:07.908] 31:5  Warning: Unexpected console statement.  no-console
[09:30:07.908] 60:5  Warning: Unexpected console statement.  no-console
[09:30:07.908] 68:5  Warning: Unexpected console statement.  no-console
[09:30:07.908] 97:7  Warning: Unexpected console statement.  no-console
[09:30:07.908] 103:7  Warning: Unexpected console statement.  no-console
[09:30:07.908] 113:9  Warning: Unexpected console statement.  no-console
[09:30:07.908] 141:9  Warning: Unexpected console statement.  no-console
[09:30:07.909] 145:7  Warning: Unexpected console statement.  no-console
[09:30:07.909] 173:5  Warning: Unexpected console statement.  no-console
[09:30:07.909] 
[09:30:07.909] ./app/actions/materials.ts
[09:30:07.909] 3:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.909] 3:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.909] 245:33  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.909] 
[09:30:07.909] ./app/actions/npc-materials.ts
[09:30:07.909] 206:5  Warning: Unexpected console statement.  no-console
[09:30:07.909] 217:5  Warning: Unexpected console statement.  no-console
[09:30:07.909] 231:5  Warning: Unexpected console statement.  no-console
[09:30:07.909] 244:5  Warning: Unexpected console statement.  no-console
[09:30:07.909] 257:5  Warning: Unexpected console statement.  no-console
[09:30:07.909] 267:5  Warning: Unexpected console statement.  no-console
[09:30:07.909] 279:7  Warning: Unexpected console statement.  no-console
[09:30:07.910] 300:7  Warning: Unexpected console statement.  no-console
[09:30:07.910] 
[09:30:07.910] ./app/actions/salary.ts
[09:30:07.910] 16:11  Warning: 'MonthlySalaryCalculation' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.910] 127:11  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.910] 184:11  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.911] 
[09:30:07.911] ./app/actions/search.ts
[09:30:07.911] 7:3  Warning: 'SearchOperator' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.911] 9:28  Warning: 'Site' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.911] 
[09:30:07.911] ./app/actions/simple-upload.ts
[09:30:07.911] 27:19  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.911] 46:5  Warning: Unexpected console statement.  no-console
[09:30:07.911] 
[09:30:07.911] ./app/actions/site-documents.ts
[09:30:07.911] 196:5  Warning: Unexpected console statement.  no-console
[09:30:07.911] 
[09:30:07.911] ./app/actions/site-info-deployment.ts
[09:30:07.911] 5:3  Warning: Unexpected console statement.  no-console
[09:30:07.911] 155:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.911] 156:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.911] 
[09:30:07.911] ./app/actions/site-info-direct.ts
[09:30:07.911] 5:3  Warning: Unexpected console statement.  no-console
[09:30:07.915] 33:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.915] 34:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.915] 152:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.915] 153:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.916] 
[09:30:07.916] ./app/actions/site-info-fallback.ts
[09:30:07.916] 8:3  Warning: Unexpected console statement.  no-console
[09:30:07.916] 
[09:30:07.918] ./app/actions/site-info.ts
[09:30:07.918] 6:3  Warning: Unexpected console statement.  no-console
[09:30:07.918] 
[09:30:07.919] ./app/actions/workflows.ts
[09:30:07.919] 5:6  Warning: 'Tables' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.919] 7:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.919] 
[09:30:07.919] ./app/api/admin/assignment/dashboard/stats/route.ts
[09:30:07.919] 4:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.919] 
[09:30:07.919] ./app/api/admin/assignment/partner-site-mappings/route.ts
[09:30:07.919] 5:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.919] 
[09:30:07.919] ./app/api/admin/daily-reports/[id]/integrated/route.ts
[09:30:07.919] 154:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.919] 186:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.919] 
[09:30:07.919] ./app/api/admin/daily-reports/route.ts
[09:30:07.919] 5:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.919] 
[09:30:07.919] ./app/api/admin/daily-reports/workers/route.ts
[09:30:07.919] 31:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 51:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 62:3  Warning: Unexpected console statement.  no-console
[09:30:07.919] 63:3  Warning: Unexpected console statement.  no-console
[09:30:07.919] 64:3  Warning: Unexpected console statement.  no-console
[09:30:07.919] 65:3  Warning: Unexpected console statement.  no-console
[09:30:07.919] 69:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 73:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 88:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 89:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 90:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 91:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 92:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 103:5  Warning: Unexpected console statement.  no-console
[09:30:07.919] 112:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 113:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 121:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 122:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 123:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 124:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 150:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 151:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 152:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 166:7  Warning: Unexpected console statement.  no-console
[09:30:07.920] 
[09:30:07.920] ./app/api/admin/document-requirements/route.ts
[09:30:07.920] 5:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.920] 
[09:30:07.920] ./app/api/admin/documents/integrated/route.ts
[09:30:07.920] 150:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.920] 
[09:30:07.920] ./app/api/admin/documents/required/[documentType]/route.ts
[09:30:07.920] 39:11  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.920] 40:11  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.920] 44:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 77:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 86:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 87:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 112:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 
[09:30:07.920] ./app/api/admin/documents/required/route.ts
[09:30:07.920] 5:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.920] 11:5  Warning: Unexpected console statement.  no-console
[09:30:07.920] 14:7  Warning: Unexpected console statement.  no-console
[09:30:07.921] 31:7  Warning: Unexpected console statement.  no-console
[09:30:07.921] 35:5  Warning: Unexpected console statement.  no-console
[09:30:07.921] 41:11  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.921] 42:11  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.921] 79:5  Warning: Unexpected console statement.  no-console
[09:30:07.921] 80:5  Warning: Unexpected console statement.  no-console
[09:30:07.921] 81:5  Warning: Unexpected console statement.  no-console
[09:30:07.921] 102:5  Warning: Unexpected console statement.  no-console
[09:30:07.921] 103:5  Warning: Unexpected console statement.  no-console
[09:30:07.921] 
[09:30:07.921] ./app/api/admin/documents/upload/route.ts
[09:30:07.921] 30:19  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.921] 
[09:30:07.921] ./app/api/admin/organizations/partner-companies/route.ts
[09:30:07.921] 2:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.921] 
[09:30:07.921] ./app/api/admin/organizations/route.ts
[09:30:07.921] 6:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.921] 
[09:30:07.921] ./app/api/admin/quick-actions/route.ts
[09:30:07.921] 1:15  Warning: 'QuickAction' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.921] 
[09:30:07.921] ./app/api/admin/sites/[id]/integrated/route.ts
[09:30:07.921] 1:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.921] 1:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.921] 134:14  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.922] 154:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.922] 162:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.922] 188:30  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.922] 192:34  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.922] 
[09:30:07.922] ./app/api/admin/sites/[id]/partners/assign/route.ts
[09:30:07.922] 29:5  Warning: Unexpected console statement.  no-console
[09:30:07.922] 56:5  Warning: Unexpected console statement.  no-console
[09:30:07.922] 70:5  Warning: Unexpected console statement.  no-console
[09:30:07.922] 
[09:30:07.922] ./app/api/admin/sites/[id]/partners/route.ts
[09:30:07.922] 109:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.922] 
[09:30:07.922] ./app/api/admin/sites/[id]/workers/assign/route.ts
[09:30:07.922] 27:25  Warning: 'trade' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.922] 27:32  Warning: 'position' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.922] 34:5  Warning: Unexpected console statement.  no-console
[09:30:07.922] 40:5  Warning: Unexpected console statement.  no-console
[09:30:07.922] 82:5  Warning: Unexpected console statement.  no-console
[09:30:07.922] 88:5  Warning: Unexpected console statement.  no-console
[09:30:07.922] 
[09:30:07.922] ./app/api/admin/sites/[id]/workers/available/route.ts
[09:30:07.922] 26:5  Warning: Unexpected console statement.  no-console
[09:30:07.923] 57:5  Warning: Unexpected console statement.  no-console
[09:30:07.923] 58:5  Warning: Unexpected console statement.  no-console
[09:30:07.923] 70:5  Warning: Unexpected console statement.  no-console
[09:30:07.923] 71:5  Warning: Unexpected console statement.  no-console
[09:30:07.923] 
[09:30:07.923] ./app/api/admin/sites/[id]/workers/route.ts
[09:30:07.923] 33:35  Warning: 'profileError' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.923] 46:41  Warning: 'profileFetchError' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.923] 66:9  Warning: Unexpected console statement.  no-console
[09:30:07.923] 91:7  Warning: Unexpected console statement.  no-console
[09:30:07.923] 
[09:30:07.923] ./app/api/admin/users/[id]/documents/download/route.ts
[09:30:07.923] 36:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.923] 37:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.923] 
[09:30:07.923] ./app/api/admin/users/[id]/documents/route.ts
[09:30:07.923] 69:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.923] 125:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.923] 126:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.923] 134:19  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.923] 283:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.923] 284:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.923] 
[09:30:07.924] ./app/api/admin/users/route.ts
[09:30:07.924] 5:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.924] 
[09:30:07.924] ./app/api/analytics/aggregate/route.ts
[09:30:07.924] 57:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.924] 
[09:30:07.924] ./app/api/analytics/api-performance/route.ts
[09:30:07.924] 83:30  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.924] 
[09:30:07.924] ./app/api/analytics/business-metrics/route.ts
[09:30:07.924] 51:9  Warning: 'siteCondition' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.924] 54:13  Warning: 'orgCondition' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.924] 
[09:30:07.924] ./app/api/analytics/dashboard/route.ts
[09:30:07.924] 1:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.924] 1:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.924] 
[09:30:07.925] ./app/api/analytics/metrics/route.ts
[09:30:07.925] 199:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.925] 306:11  Warning: Unexpected console statement.  no-console
[09:30:07.925] 
[09:30:07.925] ./app/api/analytics/realtime/route.ts
[09:30:07.926] 288:13  Warning: 'insertedEvent' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.926] 318:9  Warning: Unexpected console statement.  no-console
[09:30:07.926] 
[09:30:07.926] ./app/api/analytics/session-data/route.ts
[09:30:07.926] 110:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.926] 110:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.926] 116:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.926] 116:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.926] 
[09:30:07.926] ./app/api/analytics/sites/route.ts
[09:30:07.926] 3:10  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.926] 
[09:30:07.926] ./app/api/analytics/trends/route.ts
[09:30:07.926] 1:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.926] 1:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.926] 52:9  Warning: 'siteCondition' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.926] 55:11  Warning: 'trendData' is never reassigned. Use 'const' instead.  prefer-const
[09:30:07.926] 73:19  Warning: 'day' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.926] 
[09:30:07.926] ./app/api/auth/bridge-session/route.ts
[09:30:07.926] 4:5  Warning: Unexpected console statement.  no-console
[09:30:07.927] 7:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.927] 8:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.927] 14:18  Warning: 'cookiesToSet' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.927] 25:7  Warning: Unexpected console statement.  no-console
[09:30:07.927] 30:7  Warning: Unexpected console statement.  no-console
[09:30:07.927] 34:5  Warning: Unexpected console statement.  no-console
[09:30:07.927] 
[09:30:07.927] ./app/api/auth/sync-session/route.ts
[09:30:07.927] 13:5  Warning: Unexpected console statement.  no-console
[09:30:07.927] 20:7  Warning: Unexpected console statement.  no-console
[09:30:07.927] 27:5  Warning: Unexpected console statement.  no-console
[09:30:07.927] 47:7  Warning: Unexpected console statement.  no-console
[09:30:07.927] 54:5  Warning: Unexpected console statement.  no-console
[09:30:07.927] 67:5  Warning: Unexpected console statement.  no-console
[09:30:07.927] 
[09:30:07.927] ./app/api/auth/user/route.ts
[09:30:07.927] 5:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.927] 
[09:30:07.927] ./app/api/backup/route.ts
[09:30:07.927] 33:60  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.927] 
[09:30:07.927] ./app/api/daily-reports/reminder/schedule/route.ts
[09:30:07.927] 115:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.928] 
[09:30:07.928] ./app/api/debug/storage/route.ts
[09:30:07.928] 5:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.928] 6:3  Warning: Unexpected console statement.  no-console
[09:30:07.928] 
[09:30:07.928] ./app/api/debug-login/route.ts
[09:30:07.928] 4:5  Warning: Unexpected console statement.  no-console
[09:30:07.928] 13:5  Warning: Unexpected console statement.  no-console
[09:30:07.928] 17:5  Warning: Unexpected console statement.  no-console
[09:30:07.928] 
[09:30:07.928] ./app/api/debug-session/route.ts
[09:30:07.928] 2:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.928] 
[09:30:07.928] ./app/api/documents/permissions/route.ts
[09:30:07.928] 14:11  Warning: 'categoryType' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.928] 97:31  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.928] 
[09:30:07.928] ./app/api/documents/route.ts
[09:30:07.928] 152:3  Warning: Unexpected console statement.  no-console
[09:30:07.928] 153:3  Warning: Unexpected console statement.  no-console
[09:30:07.928] 154:3  Warning: Unexpected console statement.  no-console
[09:30:07.929] 155:3  Warning: Unexpected console statement.  no-console
[09:30:07.929] 173:9  Warning: Unexpected console statement.  no-console
[09:30:07.929] 182:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 191:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 201:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 240:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 244:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 249:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 250:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 251:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 252:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 253:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 254:5  Warning: Unexpected console statement.  no-console
[09:30:07.929] 280:9  Warning: Unexpected console statement.  no-console
[09:30:07.929] 281:9  Warning: Unexpected console statement.  no-console
[09:30:07.929] 369:7  Warning: Unexpected console statement.  no-console
[09:30:07.929] 408:11  Warning: Unexpected console statement.  no-console
[09:30:07.929] 
[09:30:07.929] ./app/api/files/documents/[filename]/route.ts
[09:30:07.929] 32:11  Warning: 'foundBucket' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.929] 
[09:30:07.929] ./app/api/health/env/route.ts
[09:30:07.929] 28:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.929] 211:15  Warning: 'url' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.929] 215:23  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.929] 
[09:30:07.929] ./app/api/markup-documents/usage-stats/route.ts
[09:30:07.929] 7:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.929] 
[09:30:07.929] ./app/api/monitoring/metrics/route.ts
[09:30:07.929] 108:13  Warning: Unexpected console statement.  no-console
[09:30:07.929] 116:13  Warning: Unexpected console statement.  no-console
[09:30:07.929] 124:13  Warning: Unexpected console statement.  no-console
[09:30:07.929] 
[09:30:07.930] ./app/api/notifications/process-scheduled/route.ts
[09:30:07.930] 5:14  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.930] 6:15  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.930] 176:21  Warning: 'result' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.930] 
[09:30:07.930] ./app/api/notifications/push/route.ts
[09:30:07.930] 5:14  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.930] 6:15  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.930] 180:9  Warning: Unexpected console statement.  no-console
[09:30:07.930] 252:15  Warning: 'result' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.930] 
[09:30:07.930] ./app/api/notifications/route.ts
[09:30:07.930] 136:7  Warning: 'priority' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.930] 
[09:30:07.930] ./app/api/notifications/subscribe/route.ts
[09:30:07.930] 68:30  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.930] 
[09:30:07.930] ./app/api/organizations/route.ts
[09:30:07.930] 4:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.930] 
[09:30:07.930] ./app/api/partner/sites/[id]/documents/route.ts
[09:30:07.930] 160:48  Warning: 'subType' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.930] 
[09:30:07.930] ./app/api/partner/sites/route.ts
[09:30:07.930] 11:5  Warning: Unexpected console statement.  no-console
[09:30:07.930] 238:64  Warning: 'siteName' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.930] 
[09:30:07.930] ./app/api/performance/budgets/route.ts
[09:30:07.930] 3:10  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.930] 
[09:30:07.930] ./app/api/photo-grid-reports/bulk/route.ts
[09:30:07.930] 1:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.930] 1:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.931] 
[09:30:07.931] ./app/api/photo-grid-reports/route.ts
[09:30:07.931] 1:15  Warning: 'PhotoGridReport' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.931] 128:19  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.931] 
[09:30:07.931] ./app/api/photo-grid-reports/stats/route.ts
[09:30:07.931] 1:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.931] 1:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.931] 36:9  Warning: 'statusFilter' is never reassigned. Use 'const' instead.  prefer-const
[09:30:07.931] 
[09:30:07.931] ./app/api/photo-grids/[id]/route.ts
[09:30:07.931] 105:18  Error: Unexpected control character(s) in regular expression: \x00.  no-control-regex
[09:30:07.931] 129:21  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.931] 158:21  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.931] 256:19  Warning: 'photoGrid' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.931] 
[09:30:07.931] ./app/api/photo-grids/route.ts
[09:30:07.931] 9:3  Warning: Unexpected console statement.  no-console
[09:30:07.933] 10:3  Warning: Unexpected console statement.  no-console
[09:30:07.933] 11:3  Warning: Unexpected console statement.  no-console
[09:30:07.933] 15:3  Warning: Unexpected console statement.  no-console
[09:30:07.933] 16:3  Warning: Unexpected console statement.  no-console
[09:30:07.933] 20:5  Warning: Unexpected console statement.  no-console
[09:30:07.934] 24:7  Warning: Unexpected console statement.  no-console
[09:30:07.934] 35:7  Warning: Unexpected console statement.  no-console
[09:30:07.934] 40:7  Warning: Unexpected console statement.  no-console
[09:30:07.934] 51:7  Warning: Unexpected console statement.  no-console
[09:30:07.934] 52:7  Warning: Unexpected console statement.  no-console
[09:30:07.934] 69:5  Warning: Unexpected console statement.  no-console
[09:30:07.934] 92:18  Error: Unexpected control character(s) in regular expression: \x00.  no-control-regex
[09:30:07.934] 117:7  Warning: Unexpected console statement.  no-console
[09:30:07.934] 119:21  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.934] 149:7  Warning: Unexpected console statement.  no-console
[09:30:07.934] 151:21  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.934] 212:5  Warning: Unexpected console statement.  no-console
[09:30:07.934] 226:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.934] 
[09:30:07.934] ./app/api/production-login-test/route.ts
[09:30:07.935] 2:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.935] 4:5  Warning: Unexpected console statement.  no-console
[09:30:07.935] 10:5  Warning: Unexpected console statement.  no-console
[09:30:07.935] 31:7  Warning: Unexpected console statement.  no-console
[09:30:07.935] 43:7  Warning: Unexpected console statement.  no-console
[09:30:07.936] 69:7  Warning: Unexpected console statement.  no-console
[09:30:07.936] 98:7  Warning: Unexpected console statement.  no-console
[09:30:07.936] 107:9  Warning: Unexpected console statement.  no-console
[09:30:07.936] 155:5  Warning: Unexpected console statement.  no-console
[09:30:07.936] 174:5  Warning: Unexpected console statement.  no-console
[09:30:07.936] 203:9  Warning: Unexpected console statement.  no-console
[09:30:07.936] 
[09:30:07.936] ./app/api/required-document-types/route.ts
[09:30:07.936] 4:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.936] 23:5  Warning: Unexpected console statement.  no-console
[09:30:07.936] 37:5  Warning: Unexpected console statement.  no-console
[09:30:07.936] 54:5  Warning: Unexpected console statement.  no-console
[09:30:07.936] 
[09:30:07.936] ./app/api/required-documents/route.ts
[09:30:07.936] 4:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.936] 
[09:30:07.936] ./app/api/seed-data/route.ts
[09:30:07.936] 1:15  Warning: 'AsyncState' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.936] 1:27  Warning: 'ApiResponse' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.936] 24:28  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.936] 31:9  Error: Require statement not part of import statement.  @typescript-eslint/no-var-requires
[09:30:07.937] 32:11  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.937] 33:11  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.937] 43:5  Warning: Unexpected console statement.  no-console
[09:30:07.937] 55:5  Warning: Unexpected console statement.  no-console
[09:30:07.937] 75:5  Warning: Unexpected console statement.  no-console
[09:30:07.937] 82:5  Warning: Unexpected console statement.  no-console
[09:30:07.937] 91:7  Warning: Unexpected console statement.  no-console
[09:30:07.937] 97:7  Warning: Unexpected console statement.  no-console
[09:30:07.937] 
[09:30:07.937] ./app/api/seed-realistic/route.ts
[09:30:07.937] 12:28  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.937] 15:29  Error: Require statement not part of import statement.  @typescript-eslint/no-var-requires
[09:30:07.937] 16:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.937] 17:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.937] 34:5  Warning: Unexpected console statement.  no-console
[09:30:07.937] 50:5  Warning: Unexpected console statement.  no-console
[09:30:07.937] 76:11  Warning: Unexpected console statement.  no-console
[09:30:07.937] 100:11  Warning: Unexpected console statement.  no-console
[09:30:07.937] 117:5  Warning: Unexpected console statement.  no-console
[09:30:07.937] 154:11  Warning: Unexpected console statement.  no-console
[09:30:07.938] 160:5  Warning: Unexpected console statement.  no-console
[09:30:07.938] 234:5  Warning: Unexpected console statement.  no-console
[09:30:07.938] 313:5  Warning: Unexpected console statement.  no-console
[09:30:07.938] 
[09:30:07.938] ./app/api/shared-documents/route.ts
[09:30:07.938] 145:19  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.938] 168:11  Warning: 'documentData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.938] 
[09:30:07.938] ./app/api/sites/[id]/workers/route.ts
[09:30:07.938] 19:35  Warning: 'profileError' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.938] 69:37  Warning: 'countError' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.938] 
[09:30:07.938] ./app/api/sites/current/route.ts
[09:30:07.938] 10:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.938] 
[09:30:07.938] ./app/api/sites/route.ts
[09:30:07.938] 4:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.938] 
[09:30:07.938] ./app/api/sites/search/route.ts
[09:30:07.938] 33:11  Warning: 'workerName' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.938] 
[09:30:07.939] ./app/api/test/workers/route.ts
[09:30:07.939] 3:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.939] 4:3  Warning: Unexpected console statement.  no-console
[09:30:07.939] 11:5  Warning: Unexpected console statement.  no-console
[09:30:07.939] 20:5  Warning: Unexpected console statement.  no-console
[09:30:07.939] 21:5  Warning: Unexpected console statement.  no-console
[09:30:07.939] 39:28  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.939] 40:3  Warning: Unexpected console statement.  no-console
[09:30:07.939] 51:5  Warning: Unexpected console statement.  no-console
[09:30:07.939] 65:5  Warning: Unexpected console statement.  no-console
[09:30:07.939] 74:5  Warning: Unexpected console statement.  no-console
[09:30:07.939] 82:5  Warning: Unexpected console statement.  no-console
[09:30:07.939] 
[09:30:07.939] ./app/api/test-auth/route.ts
[09:30:07.939] 7:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.939] 
[09:30:07.939] ./app/api/test-browser-session/route.ts
[09:30:07.939] 33:34  Warning: 'error' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.939] 
[09:30:07.939] ./app/api/test-post/route.ts
[09:30:07.939] 6:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.939] 14:3  Warning: Unexpected console statement.  no-console
[09:30:07.939] 46:31  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.939] 
[09:30:07.939] ./app/api/test-production-login/route.ts
[09:30:07.939] 2:28  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.939] 4:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 7:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 15:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 27:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 
[09:30:07.940] ./app/api/test-required-docs/route.ts
[09:30:07.940] 2:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.940] 4:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 8:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.940] 9:7  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.940] 12:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 35:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 36:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 37:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 38:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 68:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 69:5  Warning: Unexpected console statement.  no-console
[09:30:07.940] 
[09:30:07.940] ./app/api/unified-documents/route.ts
[09:30:07.940] 25:11  Warning: 'isRegularUser' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.940] 166:72  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.940] 171:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.940] 255:21  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.940] 
[09:30:07.940] ./app/api/unified-documents/v2/[id]/route.ts
[09:30:07.940] 28:9  Warning: 'query' is never reassigned. Use 'const' instead.  prefer-const
[09:30:07.940] 
[09:30:07.940] ./app/api/unified-documents/v2/route.ts
[09:30:07.941] 1:15  Warning: 'UnifiedDocument' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.941] 
[09:30:07.941] ./app/api/unified-documents/v2/upload/route.ts
[09:30:07.941] 61:11  Warning: 'fileExtension' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.941] 71:19  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.941] 
[09:30:07.941] ./app/api/upload-handler/route.ts
[09:30:07.941] 50:31  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.941] 
[09:30:07.941] ./app/api/user-document-submissions/route.ts
[09:30:07.941] 4:27  Warning: 'request' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.941] 15:5  Warning: Unexpected console statement.  no-console
[09:30:07.941] 28:5  Warning: Unexpected console statement.  no-console
[09:30:07.941] 29:5  Warning: Unexpected console statement.  no-console
[09:30:07.941] 
[09:30:07.941] ./app/api-test/page.tsx
[09:30:07.941] 5:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.941] 101:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.941] 102:10  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:07.941] 103:12  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:07.941] 105:10  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:07.941] 106:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.941] 126:48  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:07.941] 126:62  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:07.941] 
[09:30:07.941] ./app/auth/actions.ts
[09:30:07.941] 10:5  Warning: Unexpected console statement.  no-console
[09:30:07.942] 17:5  Warning: Unexpected console statement.  no-console
[09:30:07.942] 24:5  Warning: Unexpected console statement.  no-console
[09:30:07.942] 50:9  Warning: Unexpected console statement.  no-console
[09:30:07.942] 63:11  Warning: Unexpected console statement.  no-console
[09:30:07.942] 88:13  Warning: Unexpected console statement.  no-console
[09:30:07.942] 97:13  Warning: Unexpected console statement.  no-console
[09:30:07.942] 118:5  Warning: Unexpected console statement.  no-console
[09:30:07.942] 282:12  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.942] 302:66  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.942] 535:34  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.942] 540:24  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.942] 
[09:30:07.942] ./app/auth/login/page-new.tsx
[09:30:07.942] 45:14  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:07.942] 59:14  Error: 'InputNew' is not defined.  react/jsx-no-undef
[09:30:07.942] 75:14  Error: 'InputNew' is not defined.  react/jsx-no-undef
[09:30:07.942] 98:14  Error: 'ButtonNew' is not defined.  react/jsx-no-undef
[09:30:07.942] 120:16  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.942] 121:18  Error: 'ButtonNew' is not defined.  react/jsx-no-undef
[09:30:07.942] 130:16  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.942] 131:18  Error: 'ButtonNew' is not defined.  react/jsx-no-undef
[09:30:07.943] 
[09:30:07.943] ./app/auth/login/page.tsx
[09:30:07.943] 43:14  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:07.943] 107:14  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.943] 113:14  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.943] 122:14  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.944] 129:14  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.944] 
[09:30:07.944] ./app/auth/reset-password/page.tsx
[09:30:07.944] 18:14  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:07.944] 30:12  Error: 'ResetPasswordForm' is not defined.  react/jsx-no-undef
[09:30:07.944] 
[09:30:07.944] ./app/auth/reset-password/reset-password-form.tsx
[09:30:07.944] 35:12  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:07.944] 47:16  Error: 'Mail' is not defined.  react/jsx-no-undef
[09:30:07.944] 59:12  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.944] 84:10  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.944] 88:12  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:07.944] 159:12  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.944] 
[09:30:07.944] ./app/auth/signup/page.tsx
[09:30:07.944] 174:18  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.944] 187:18  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.944] 
[09:30:07.944] ./app/auth/signup-request/page.tsx
[09:30:07.944] 5:9  Warning: 'router' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.944] 72:14  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.944] 207:14  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.944] 
[09:30:07.945] ./app/auth/update-password/page.tsx
[09:30:07.945] 18:14  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:07.945] 30:12  Error: 'UpdatePasswordForm' is not defined.  react/jsx-no-undef
[09:30:07.945] 
[09:30:07.945] ./app/auth/update-password/update-password-form.tsx
[09:30:07.945] 99:12  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:07.945] 110:12  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.945] 137:16  Error: 'Lock' is not defined.  react/jsx-no-undef
[09:30:07.945] 155:18  Error: 'EyeOff' is not defined.  react/jsx-no-undef
[09:30:07.945] 157:18  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:07.945] 190:16  Error: 'Lock' is not defined.  react/jsx-no-undef
[09:30:07.945] 208:18  Error: 'EyeOff' is not defined.  react/jsx-no-undef
[09:30:07.945] 210:18  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:07.945] 259:10  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.945] 
[09:30:07.945] ./app/clear-cache/page.tsx
[09:30:07.945] 13:11  Warning: 'messages' is never reassigned. Use 'const' instead.  prefer-const
[09:30:07.945] 76:12  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:07.945] 90:16  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:07.945] 95:16  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:07.945] 
[09:30:07.945] ./app/components/page-header-demo/page.tsx
[09:30:07.945] 6:5  Warning: Unexpected console statement.  no-console
[09:30:07.945] 17:14  Error: 'PageHeader' is not defined.  react/jsx-no-undef
[09:30:07.946] 26:14  Error: 'PageHeader' is not defined.  react/jsx-no-undef
[09:30:07.946] 40:14  Error: 'PageHeader' is not defined.  react/jsx-no-undef
[09:30:07.946] 52:26  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:07.946] 58:26  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:07.946] 64:26  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:07.946] 73:14  Error: 'PageHeader' is not defined.  react/jsx-no-undef
[09:30:07.946] 87:26  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:07.946] 96:14  Error: 'DashboardPageHeader' is not defined.  react/jsx-no-undef
[09:30:07.946] 104:26  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:07.946] 110:26  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:07.946] 119:14  Error: 'AdminPageHeader' is not defined.  react/jsx-no-undef
[09:30:07.946] 127:26  Error: 'Settings' is not defined.  react/jsx-no-undef
[09:30:07.946] 136:14  Error: 'ReportsPageHeader' is not defined.  react/jsx-no-undef
[09:30:07.946] 144:26  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:07.946] 153:14  Error: 'DocumentsPageHeader' is not defined.  react/jsx-no-undef
[09:30:07.946] 161:26  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:07.946] 170:14  Error: 'PageHeader' is not defined.  react/jsx-no-undef
[09:30:07.946] 
[09:30:07.946] ./app/components/page.tsx
[09:30:07.946] 23:49  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:07.947] 24:48  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:07.947] 25:45  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:07.947] 26:46  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:07.947] 27:46  Error: 'BarChart' is not defined.  react/jsx-no-undef
[09:30:07.947] 35:14  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:07.947] 40:14  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:07.947] 45:14  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:07.947] 51:14  Error: 'FileImage' is not defined.  react/jsx-no-undef
[09:30:07.947] 57:14  Error: 'FolderOpen' is not defined.  react/jsx-no-undef
[09:30:07.947] 105:6  Error: 'NavigationController' is not defined.  react/jsx-no-undef
[09:30:07.947] 110:12  Error: 'Container' is not defined.  react/jsx-no-undef
[09:30:07.947] 111:14  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.947] 112:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.947] 118:12  Error: 'NavBar' is not defined.  react/jsx-no-undef
[09:30:07.947] 120:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.947] 125:10  Error: 'Container' is not defined.  react/jsx-no-undef
[09:30:07.947] 128:16  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.947] 138:20  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.947] 139:20  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.947] 142:16  Error: 'BottomNavigation' is not defined.  react/jsx-no-undef
[09:30:07.947] 149:8  Error: 'Container' is not defined.  react/jsx-no-undef
[09:30:07.947] 154:14  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.948] 155:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 162:8  Error: 'Separator' is not defined.  react/jsx-no-undef
[09:30:07.948] 166:10  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.948] 168:12  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.948] 169:12  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.948] 170:12  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.948] 171:12  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.948] 174:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 175:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 176:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 177:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 178:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 179:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 180:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 184:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 185:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 186:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 187:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 188:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 193:8  Error: 'Separator' is not defined.  react/jsx-no-undef
[09:30:07.948] 197:10  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.948] 201:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.948] 203:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.948] 204:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.948] 205:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.948] 206:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.949] 207:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.949] 212:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.949] 214:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.949] 215:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.949] 216:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.949] 221:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.949] 223:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.951] 224:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.951] 229:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.951] 231:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.951] 232:18  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:07.951] 235:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.951] 236:18  Error: 'Settings' is not defined.  react/jsx-no-undef
[09:30:07.951] 239:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.951] 240:18  Error: 'Menu' is not defined.  react/jsx-no-undef
[09:30:07.951] 247:8  Error: 'Separator' is not defined.  react/jsx-no-undef
[09:30:07.951] 251:10  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.951] 255:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.951] 256:14  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:07.951] 257:16  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:07.951] 258:16  Error: 'CardDescription' is not defined.  react/jsx-no-undef
[09:30:07.951] 260:14  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:07.951] 261:16  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.951] 263:14  Error: 'CardFooter' is not defined.  react/jsx-no-undef
[09:30:07.953] 264:16  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.953] 265:16  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.953] 269:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.953] 270:14  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:07.953] 271:16  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:07.954] 272:16  Error: 'CardDescription' is not defined.  react/jsx-no-undef
[09:30:07.954] 274:14  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:07.954] 275:16  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.954] 279:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.954] 280:14  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:07.954] 281:16  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:07.955] 282:16  Error: 'CardDescription' is not defined.  react/jsx-no-undef
[09:30:07.955] 284:14  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:07.955] 287:20  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:07.955] 288:20  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.955] 291:20  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:07.955] 292:20  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.955] 295:20  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:07.956] 296:20  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.957] 305:8  Error: 'Separator' is not defined.  react/jsx-no-undef
[09:30:07.957] 309:10  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.957] 313:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.957] 314:14  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:07.957] 321:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.957] 325:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.957] 326:14  Error: 'Textarea' is not defined.  react/jsx-no-undef
[09:30:07.957] 333:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.957] 339:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.957] 340:14  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:07.957] 348:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.957] 349:14  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:07.957] 359:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.957] 360:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:07.957] 364:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:07.957] 365:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:07.957] 367:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:07.957] 368:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.957] 369:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.958] 370:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.958] 371:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.958] 372:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.958] 373:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.958] 376:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.958] 380:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.958] 381:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:07.958] 384:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:07.958] 385:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:07.958] 387:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:07.958] 388:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.958] 389:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.958] 390:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.958] 391:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.958] 397:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.958] 398:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:07.958] 401:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:07.958] 402:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:07.958] 404:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:07.959] 405:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.959] 406:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.959] 407:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:07.959] 410:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.959] 415:8  Error: 'Separator' is not defined.  react/jsx-no-undef
[09:30:07.959] 419:10  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.959] 420:10  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.959] 424:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.959] 425:14  Error: 'Dropdown' is not defined.  react/jsx-no-undef
[09:30:07.959] 431:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.959] 435:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.959] 436:14  Error: 'Dropdown' is not defined.  react/jsx-no-undef
[09:30:07.959] 449:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.959] 450:14  Error: 'Dropdown' is not defined.  react/jsx-no-undef
[09:30:07.959] 463:8  Error: 'Separator' is not defined.  react/jsx-no-undef
[09:30:07.959] 467:10  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.959] 470:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.959] 471:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.959] 472:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.959] 473:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.959] 474:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.959] 475:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.960] 479:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.960] 480:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:07.960] 483:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.960] 484:14  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:07.960] 487:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.960] 488:14  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:07.960] 494:8  Error: 'Separator' is not defined.  react/jsx-no-undef
[09:30:07.960] 498:10  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.960] 501:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.960] 502:14  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:07.960] 503:16  Error: 'Skeleton' is not defined.  react/jsx-no-undef
[09:30:07.960] 504:16  Error: 'Skeleton' is not defined.  react/jsx-no-undef
[09:30:07.960] 506:14  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:07.960] 507:16  Error: 'Skeleton' is not defined.  react/jsx-no-undef
[09:30:07.960] 508:16  Error: 'Skeleton' is not defined.  react/jsx-no-undef
[09:30:07.960] 510:14  Error: 'CardFooter' is not defined.  react/jsx-no-undef
[09:30:07.960] 511:16  Error: 'Skeleton' is not defined.  react/jsx-no-undef
[09:30:07.960] 512:16  Error: 'Skeleton' is not defined.  react/jsx-no-undef
[09:30:07.960] 517:14  Error: 'Skeleton' is not defined.  react/jsx-no-undef
[09:30:07.960] 518:14  Error: 'Skeleton' is not defined.  react/jsx-no-undef
[09:30:07.961] 523:8  Error: 'Separator' is not defined.  react/jsx-no-undef
[09:30:07.961] 527:10  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.961] 531:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 534:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 537:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 540:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 543:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 546:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 552:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 555:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 558:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 561:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 564:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 570:14  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 573:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 576:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 579:18  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.961] 590:8  Error: 'Container' is not defined.  react/jsx-no-undef
[09:30:07.961] 591:10  Error: 'Separator' is not defined.  react/jsx-no-undef
[09:30:07.961] 592:10  Error: 'Heading' is not defined.  react/jsx-no-undef
[09:30:07.961] 593:10  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.962] 598:10  Error: 'Footer' is not defined.  react/jsx-no-undef
[09:30:07.962] 606:8  Error: 'Container' is not defined.  react/jsx-no-undef
[09:30:07.962] 607:10  Error: 'Text' is not defined.  react/jsx-no-undef
[09:30:07.962] 610:10  Error: 'SimpleFooter' is not defined.  react/jsx-no-undef
[09:30:07.962] 
[09:30:07.962] ./app/dashboard/admin/account/admin-account-settings.tsx
[09:30:07.962] 11:49  Warning: 'user' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.962] 94:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.962] 99:14  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:07.962] 102:12  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.962] 103:14  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:07.962] 110:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.962] 119:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.962] 123:16  Error: 'Mail' is not defined.  react/jsx-no-undef
[09:30:07.962] 129:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.962] 133:16  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:07.962] 139:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.962] 143:16  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:07.962] 149:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.962] 153:16  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:07.962] 159:14  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.963] 170:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.963] 175:14  Error: 'Lock' is not defined.  react/jsx-no-undef
[09:30:07.963] 182:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:07.963] 200:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.963] 207:18  Error: 'Key' is not defined.  react/jsx-no-undef
[09:30:07.963] 219:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.963] 226:18  Error: 'UserCheck' is not defined.  react/jsx-no-undef
[09:30:07.963] 235:18  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:07.963] 243:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.963] 247:18  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:07.963] 262:43  Error: 'EyeOff' is not defined.  react/jsx-no-undef
[09:30:07.963] 262:76  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:07.963] 268:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.963] 272:18  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:07.963] 287:39  Error: 'EyeOff' is not defined.  react/jsx-no-undef
[09:30:07.963] 287:72  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:07.963] 293:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:07.963] 297:18  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:07.963] 312:43  Error: 'EyeOff' is not defined.  react/jsx-no-undef
[09:30:07.963] 312:76  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:07.963] 318:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.963] 332:22  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:07.964] 337:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.964] 345:18  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:07.964] 354:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.964] 359:14  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:07.964] 374:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:07.964] 386:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:07.964] 398:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:07.964] 411:16  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:07.964] 
[09:30:07.964] ./app/dashboard/admin/admin-dashboard-content.tsx
[09:30:07.964] 3:10  Warning: 'Suspense' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.964] 6:8  Warning: 'BackupDashboard' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.964] 111:7  Error: Do not assign to the variable `module`. See: https://nextjs.org/docs/messages/no-assign-module-variable  @next/next/no-assign-module-variable
[09:30:07.964] 227:12  Error: 'QuickActionsSettings' is not defined.  react/jsx-no-undef
[09:30:07.964] 247:18  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.964] 248:20  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.964] 269:14  Error: 'QuickActionsSettings' is not defined.  react/jsx-no-undef
[09:30:07.964] 
[09:30:07.964] ./app/dashboard/admin/analytics/page.tsx
[09:30:07.964] 5:10  Error: 'AnalyticsDashboard' is not defined.  react/jsx-no-undef
[09:30:07.964] 
[09:30:07.964] ./app/dashboard/admin/assignment/page.tsx
[09:30:07.965] 10:8  Error: 'AssignmentDashboard' is not defined.  react/jsx-no-undef
[09:30:07.965] 
[09:30:07.965] ./app/dashboard/admin/audit-logs/page.tsx
[09:30:07.965] 5:10  Error: 'AuditLogSystem' is not defined.  react/jsx-no-undef
[09:30:07.965] 
[09:30:07.966] ./app/dashboard/admin/backup/page.tsx
[09:30:07.966] 26:10  Error: 'Suspense' is not defined.  react/jsx-no-undef
[09:30:07.966] 27:12  Error: 'BackupDashboard' is not defined.  react/jsx-no-undef
[09:30:07.966] 49:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.966] 63:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.966] 72:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.966] 83:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.966] 
[09:30:07.966] ./app/dashboard/admin/daily-reports/[id]/edit/page.tsx
[09:30:07.966] 83:16  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.966] 87:18  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:07.967] 97:10  Error: 'DailyReportForm' is not defined.  react/jsx-no-undef
[09:30:07.967] 106:35  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.967] 
[09:30:07.967] ./app/dashboard/admin/daily-reports/[id]/page.tsx
[09:30:07.967] 59:6  Warning: React Hook useEffect has a missing dependency: 'fetchReport'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:07.967] 172:9  Warning: 'isInEditMode' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.967] 187:18  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:07.967] 206:18  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:07.967] 217:20  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:07.967] 228:22  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:07.967] 274:18  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:07.967] 308:18  Error: 'Layers' is not defined.  react/jsx-no-undef
[09:30:07.967] 400:18  Error: 'Package' is not defined.  react/jsx-no-undef
[09:30:07.967] 452:18  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:07.967] 477:18  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:07.967] 549:20  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:07.967] 560:16  Error: 'WorkerManagementTab' is not defined.  react/jsx-no-undef
[09:30:07.967] 568:16  Error: 'PhotosTab' is not defined.  react/jsx-no-undef
[09:30:07.967] 576:16  Error: 'AttachmentsTab' is not defined.  react/jsx-no-undef
[09:30:07.967] 584:16  Error: 'MarkupTab' is not defined.  react/jsx-no-undef
[09:30:07.967] 
[09:30:07.967] ./app/dashboard/admin/daily-reports/new/page.tsx
[09:30:07.967] 48:16  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.968] 52:18  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:07.968] 62:10  Error: 'DailyReportForm' is not defined.  react/jsx-no-undef
[09:30:07.968] 65:35  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.968] 
[09:30:07.968] ./app/dashboard/admin/daily-reports/page.tsx
[09:30:07.968] 10:8  Error: 'DailyReportsManagement' is not defined.  react/jsx-no-undef
[09:30:07.968] 
[09:30:07.968] ./app/dashboard/admin/document-requirements/page.tsx
[09:30:07.968] 36:10  Error: 'RequiredDocumentTypesAdmin' is not defined.  react/jsx-no-undef
[09:30:07.968] 
[09:30:07.968] ./app/dashboard/admin/documents/invoice/page.tsx
[09:30:07.968] 34:10  Error: 'InvoiceDocumentsManagement' is not defined.  react/jsx-no-undef
[09:30:07.968] 
[09:30:07.968] ./app/dashboard/admin/documents/markup/[id]/page.tsx
[09:30:07.968] 10:8  Error: 'MarkupDocumentDetail' is not defined.  react/jsx-no-undef
[09:30:07.968] 
[09:30:07.968] ./app/dashboard/admin/documents/markup/page.tsx
[09:30:07.968] 34:10  Error: 'MarkupDocumentsManagement' is not defined.  react/jsx-no-undef
[09:30:07.968] 
[09:30:07.968] ./app/dashboard/admin/documents/my-documents/page.tsx
[09:30:07.968] 33:10  Error: 'MyDocumentsManagement' is not defined.  react/jsx-no-undef
[09:30:07.968] 
[09:30:07.968] ./app/dashboard/admin/documents/page.tsx
[09:30:07.969] 34:14  Error: 'DocumentNavigation' is not defined.  react/jsx-no-undef
[09:30:07.969] 39:14  Error: 'UnifiedDocumentManagement' is not defined.  react/jsx-no-undef
[09:30:07.969] 
[09:30:07.969] ./app/dashboard/admin/documents/photo-grid/page.tsx
[09:30:07.969] 39:10  Error: 'PhotoGridDocumentsManagement' is not defined.  react/jsx-no-undef
[09:30:07.969] 
[09:30:07.969] ./app/dashboard/admin/documents/required/[documentType]/page.tsx
[09:30:07.969] 35:10  Error: 'RequiredDocumentTypeDetailPage' is not defined.  react/jsx-no-undef
[09:30:07.969] 
[09:30:07.969] ./app/dashboard/admin/documents/required/page.tsx
[09:30:07.969] 34:10  Error: 'RealRequiredDocumentsManagement' is not defined.  react/jsx-no-undef
[09:30:07.969] 
[09:30:07.969] ./app/dashboard/admin/documents/shared/page.tsx
[09:30:07.969] 3:11  Error: 'SharedDocumentsList' is not defined.  react/jsx-no-undef
[09:30:07.969] 
[09:30:07.969] ./app/dashboard/admin/documents/unified-document-management.tsx
[09:30:07.969] 99:45  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.969] 102:9  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.969] 147:13  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.969] 241:6  Warning: React Hook useCallback has a missing dependency: 'transformDocument'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:07.969] 269:5  Warning: Unexpected console statement.  no-console
[09:30:07.969] 276:5  Warning: Unexpected console statement.  no-console
[09:30:07.969] 281:5  Warning: Unexpected console statement.  no-console
[09:30:07.970] 288:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.970] 300:14  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:07.970] 304:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.970] 316:14  Error: 'HardDrive' is not defined.  react/jsx-no-undef
[09:30:07.970] 320:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.970] 332:14  Error: 'TrendingUp' is not defined.  react/jsx-no-undef
[09:30:07.970] 336:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.970] 348:14  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:07.970] 354:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.970] 357:10  Error: 'Tabs' is not defined.  react/jsx-no-undef
[09:30:07.970] 359:14  Error: 'TabsList' is not defined.  react/jsx-no-undef
[09:30:07.970] 367:20  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:07.970] 378:22  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.970] 387:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.970] 395:41  Error: 'List' is not defined.  react/jsx-no-undef
[09:30:07.971] 395:72  Error: 'Grid' is not defined.  react/jsx-no-undef
[09:30:07.971] 398:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.971] 406:18  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:07.971] 410:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.971] 418:18  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:07.971] 426:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:07.971] 497:18  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.971] 523:18  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.971] 531:20  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:07.971] 534:18  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.971] 542:20  Error: 'FolderPlus' is not defined.  react/jsx-no-undef
[09:30:07.971] 545:18  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.971] 553:20  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:07.971] 556:18  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.971] 572:14  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:07.971] 575:20  Error: 'UnifiedSharedDocumentsList' is not defined.  react/jsx-no-undef
[09:30:07.971] 583:20  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:07.971] 627:32  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.971] 628:34  Error: 'Share2' is not defined.  react/jsx-no-undef
[09:30:07.972] 633:32  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.972] 658:30  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:07.972] 664:30  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:07.972] 669:28  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.972] 676:30  Error: 'MoreVertical' is not defined.  react/jsx-no-undef
[09:30:07.972] 690:24  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.972] 759:30  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:07.972] 763:30  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:07.972] 768:28  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.972] 773:30  Error: 'MoreVertical' is not defined.  react/jsx-no-undef
[09:30:07.972] 787:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:07.972] 792:14  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:07.972] 798:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.972] 804:14  Error: 'Archive' is not defined.  react/jsx-no-undef
[09:30:07.972] 810:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.972] 816:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:07.972] 822:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.972] 828:14  Error: 'FileSpreadsheet' is not defined.  react/jsx-no-undef
[09:30:07.972] 834:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.972] 840:14  Error: 'Settings' is not defined.  react/jsx-no-undef
[09:30:07.972] 
[09:30:07.972] ./app/dashboard/admin/documents/upload/page.tsx
[09:30:07.972] 5:8  Error: 'DocumentUploadPage' is not defined.  react/jsx-no-undef
[09:30:07.972] 
[09:30:07.972] ./app/dashboard/admin/integrated/page.tsx
[09:30:07.972] 12:8  Error: 'Suspense' is not defined.  react/jsx-no-undef
[09:30:07.973] 19:10  Error: 'IntegratedDashboard' is not defined.  react/jsx-no-undef
[09:30:07.973] 
[09:30:07.973] ./app/dashboard/admin/markup-tool/page.tsx
[09:30:07.973] 14:6  Warning: React Hook useEffect has a missing dependency: 'loadProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:07.974] 
[09:30:07.974] ./app/dashboard/admin/monitoring/page.tsx
[09:30:07.974] 21:8  Error: 'MonitoringDashboard' is not defined.  react/jsx-no-undef
[09:30:07.974] 
[09:30:07.974] ./app/dashboard/admin/organizations/new/page.tsx
[09:30:07.974] 14:12  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:07.974] 24:10  Error: 'OrganizationForm' is not defined.  react/jsx-no-undef
[09:30:07.974] 
[09:30:07.974] ./app/dashboard/admin/organizations/page.tsx
[09:30:07.974] 11:10  Error: 'OrganizationList' is not defined.  react/jsx-no-undef
[09:30:07.974] 
[09:30:07.974] ./app/dashboard/admin/page.tsx
[09:30:07.974] 3:11  Error: 'AdminDashboardContent' is not defined.  react/jsx-no-undef
[09:30:07.974] 
[09:30:07.974] ./app/dashboard/admin/partners/page.tsx
[09:30:07.974] 3:11  Error: 'PartnerListWrapper' is not defined.  react/jsx-no-undef
[09:30:07.974] 
[09:30:07.974] ./app/dashboard/admin/salary/calendar/[workerId]/page.tsx
[09:30:07.974] 21:6  Error: 'Suspense' is not defined.  react/jsx-no-undef
[09:30:07.974] 
[09:30:07.974] ./app/dashboard/admin/salary/calendar/[workerId]/worker-calendar-client.tsx
[09:30:07.974] 34:7  Warning: Unexpected console statement.  no-console
[09:30:07.974] 60:8  Error: 'PageHeader' is not defined.  react/jsx-no-undef
[09:30:07.974] 71:14  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:07.975] 
[09:30:07.975] ./app/dashboard/admin/shared-documents/page.tsx
[09:30:07.975] 28:47  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.975] 
[09:30:07.975] ./app/dashboard/admin/signup-requests/signup-requests-client.tsx
[09:30:07.975] 126:17  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.975] 127:12  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:07.975] 131:17  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.975] 132:12  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:07.975] 136:17  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:07.975] 137:12  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:07.975] 200:12  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:07.975] 218:46  Error: 'ChevronUp' is not defined.  react/jsx-no-undef
[09:30:07.975] 218:87  Error: 'ChevronDown' is not defined.  react/jsx-no-undef
[09:30:07.975] 229:46  Error: 'ChevronUp' is not defined.  react/jsx-no-undef
[09:30:07.975] 229:87  Error: 'ChevronDown' is not defined.  react/jsx-no-undef
[09:30:07.975] 240:46  Error: 'ChevronUp' is not defined.  react/jsx-no-undef
[09:30:07.975] 240:87  Error: 'ChevronDown' is not defined.  react/jsx-no-undef
[09:30:07.975] 317:32  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.975] 329:32  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.975] 344:28  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.975] 362:106  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.975] 370:40  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.975] 373:72  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.975] 386:106  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:07.976] 424:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.976] 431:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:07.976] 447:8  Error: 'ApprovalModal' is not defined.  react/jsx-no-undef
[09:30:07.976] 
[09:30:07.976] ./app/dashboard/admin/sites/[id]/documents/page.tsx
[09:30:07.976] 92:10  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.976] 99:10  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.976] 106:10  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.976] 118:10  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.976] 122:12  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:07.976] 131:14  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:07.976] 147:16  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:07.976] 151:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:07.976] 
[09:30:07.976] ./app/dashboard/admin/sites/[id]/page.tsx
[09:30:07.976] 31:41  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.976] 64:6  Warning: React Hook useEffect has a missing dependency: 'fetchSiteData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:07.976] 228:12  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:07.976] 254:18  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.976] 261:18  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.976] 269:16  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.976] 292:18  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:07.976] 297:20  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:07.976] 318:18  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:07.976] 370:22  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:07.976] 380:22  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:07.976] 408:24  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:07.976] 425:24  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:07.976] 435:30  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:07.976] 448:24  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:07.976] 458:30  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:07.976] 475:22  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:07.976] 484:22  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:07.976] 493:22  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:07.977] 510:22  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:07.977] 524:22  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:07.977] 538:22  Error: 'Package' is not defined.  react/jsx-no-undef
[09:30:07.977] 552:22  Error: 'Briefcase' is not defined.  react/jsx-no-undef
[09:30:07.977] 571:12  Error: 'SiteDailyReportsTab' is not defined.  react/jsx-no-undef
[09:30:07.977] 576:12  Error: 'SiteDocumentsTab' is not defined.  react/jsx-no-undef
[09:30:07.977] 581:12  Error: 'SitePartnersTab' is not defined.  react/jsx-no-undef
[09:30:07.977] 586:12  Error: 'SiteWorkersTab' is not defined.  react/jsx-no-undef
[09:30:07.977] 622:6  Warning: React Hook useEffect has a missing dependency: 'fetchDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:07.977] 655:7  Warning: Unexpected console statement.  no-console
[09:30:07.977] 677:21  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.977] 735:7  Warning: Unexpected console statement.  no-console
[09:30:07.977] 776:5  Warning: Unexpected console statement.  no-console
[09:30:07.978] 789:15  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
[09:30:07.978] 789:16  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:07.978] 798:20  Error: 'File' is not defined.  react/jsx-no-undef
[09:30:07.978] 814:22  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:07.978] 821:22  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:07.978] 839:18  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:07.978] 865:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:07.978] 874:20  Error: 'File' is not defined.  react/jsx-no-undef
[09:30:07.978] 890:22  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:07.978] 897:22  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:07.979] 915:18  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:07.979] 1151:22  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:07.979] 1175:22  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:07.979] 1213:22  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:07.979] 
[09:30:07.990] ./app/dashboard/admin/sites/page.tsx
[09:30:07.991] 9:8  Error: 'SiteManagementList' is not defined.  react/jsx-no-undef
[09:30:07.991] 
[09:30:07.991] ./app/dashboard/admin/system/page.tsx
[09:30:07.991] 28:45  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.991] 
[09:30:07.991] ./app/dashboard/admin/test-permissions/page.tsx
[09:30:07.991] 28:53  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:07.991] 
[09:30:07.991] ./app/dashboard/admin/tools/markup/page.tsx
[09:30:07.992] 17:6  Warning: React Hook useEffect has a missing dependency: 'loadProfile'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:07.992] 
[09:30:07.992] ./app/dashboard/admin/tools/photo-grid/page.tsx
[09:30:07.992] 20:11  Error: 'PhotoGridToolMain' is not defined.  react/jsx-no-undef
[09:30:07.992] 
[09:30:07.992] ./app/dashboard/admin/users/[id]/page.tsx
[09:30:07.992] 25:6  Warning: React Hook useEffect has missing dependencies: 'loadStatistics' and 'loadUser'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:07.992] 106:9  Warning: 'handlePasswordReset' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.992] 125:9  Warning: 'handleStatusToggle' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:07.992] 179:10  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:07.993] 197:12  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:07.993] 220:14  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:07.993] 236:18  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:07.993] 241:20  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:07.993] 263:18  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:07.993] 307:12  Error: 'UserBasicInfoTab' is not defined.  react/jsx-no-undef
[09:30:07.993] 315:12  Error: 'UserSitesPrintsTab' is not defined.  react/jsx-no-undef
[09:30:07.993] 319:12  Error: 'UserWorkLogsTab' is not defined.  react/jsx-no-undef
[09:30:07.993] 323:12  Error: 'UserDocumentsTab' is not defined.  react/jsx-no-undef
[09:30:07.993] 
[09:30:07.999] ./app/dashboard/admin/users/page.tsx
[09:30:07.999] 9:8  Error: 'UserManagement' is not defined.  react/jsx-no-undef
[09:30:07.999] 
[09:30:07.999] ./app/dashboard/admin/work-options/page.tsx
[09:30:07.999] 19:8  Error: 'WorkOptionsManagement' is not defined.  react/jsx-no-undef
[09:30:07.999] 
[09:30:07.999] ./app/dashboard/analytics/page.tsx
[09:30:08.000] 47:8  Error: 'Suspense' is not defined.  react/jsx-no-undef
[09:30:08.000] 63:10  Error: 'BusinessAnalyticsDashboard' is not defined.  react/jsx-no-undef
[09:30:08.000] 
[09:30:08.000] ./app/dashboard/attendance/page.tsx
[09:30:08.000] 14:33  Warning: 'profileError' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.000] 37:27  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.000] 
[09:30:08.000] ./app/dashboard/daily-reports/[id]/edit/page.tsx
[09:30:08.000] 60:31  Error: Require statement not part of import statement.  @typescript-eslint/no-var-requires
[09:30:08.000] 61:9  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.000] 62:9  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.000] 83:5  Warning: 'sitesError' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.000] 100:14  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:08.000] 105:14  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.000] 110:14  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.000] 116:14  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.000] 121:14  Error: 'FolderOpen' is not defined.  react/jsx-no-undef
[09:30:08.000] 126:6  Error: 'NavigationController' is not defined.  react/jsx-no-undef
[09:30:08.001] 130:10  Error: 'Header' is not defined.  react/jsx-no-undef
[09:30:08.001] 132:12  Error: 'DailyReportForm' is not defined.  react/jsx-no-undef
[09:30:08.001] 134:35  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.001] 135:37  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.001] 141:10  Error: 'BottomNavigation' is not defined.  react/jsx-no-undef
[09:30:08.001] 146:10  Error: 'Header' is not defined.  react/jsx-no-undef
[09:30:08.001] 149:14  Error: 'DailyReportForm' is not defined.  react/jsx-no-undef
[09:30:08.001] 151:37  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.001] 152:39  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.001] 
[09:30:08.001] ./app/dashboard/daily-reports/[id]/page.tsx
[09:30:08.001] 28:3  Warning: Unexpected console statement.  no-console
[09:30:08.001] 54:14  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:08.001] 59:14  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.001] 64:14  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.001] 70:14  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.001] 75:14  Error: 'FolderOpen' is not defined.  react/jsx-no-undef
[09:30:08.001] 80:6  Error: 'NavigationController' is not defined.  react/jsx-no-undef
[09:30:08.001] 85:10  Error: 'Header' is not defined.  react/jsx-no-undef
[09:30:08.002] 86:10  Error: 'DailyReportDetailMobile' is not defined.  react/jsx-no-undef
[09:30:08.002] 87:29  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.002] 88:35  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.002] 90:10  Error: 'BottomNavigation' is not defined.  react/jsx-no-undef
[09:30:08.002] 126:12  Error: 'Header' is not defined.  react/jsx-no-undef
[09:30:08.002] 132:35  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.002] 133:41  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.002] 
[09:30:08.002] ./app/dashboard/daily-reports/new/dev-page.tsx
[09:30:08.002] 15:5  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.002] 16:5  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.002] 49:3  Warning: Unexpected console statement.  no-console
[09:30:08.002] 62:6  Error: 'DashboardLayout' is not defined.  react/jsx-no-undef
[09:30:08.002] 62:54  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.002] 66:8  Error: 'DailyReportForm' is not defined.  react/jsx-no-undef
[09:30:08.002] 69:33  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.002] 
[09:30:08.002] ./app/dashboard/daily-reports/new/page.tsx
[09:30:08.002] 42:7  Warning: Unexpected console statement.  no-console
[09:30:08.002] 45:31  Error: Require statement not part of import statement.  @typescript-eslint/no-var-requires
[09:30:08.003] 46:9  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.003] 47:9  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.003] 64:7  Warning: Unexpected console statement.  no-console
[09:30:08.003] 69:5  Warning: 'sitesError' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.003] 93:6  Error: 'DashboardLayout' is not defined.  react/jsx-no-undef
[09:30:08.003] 93:54  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.003] 106:8  Error: 'DailyReportForm' is not defined.  react/jsx-no-undef
[09:30:08.004] 109:33  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.004] 
[09:30:08.004] ./app/dashboard/daily-reports/page.tsx
[09:30:08.005] 24:31  Warning: 'sitesError' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.005] 33:9  Warning: 'canCreateReport' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.005] 37:27  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.006] 
[09:30:08.006] ./app/dashboard/debug-user/debug-client.tsx
[09:30:08.006] 32:10  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.006] 
[09:30:08.006] ./app/dashboard/debug-user/page.tsx
[09:30:08.006] 8:27  Warning: 'error' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.006] 34:10  Error: 'DebugUserClient' is not defined.  react/jsx-no-undef
[09:30:08.006] 
[09:30:08.006] ./app/dashboard/documents/page.tsx
[09:30:08.006] 10:9  Warning: 'tab' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.007] 11:9  Warning: 'search' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.007] 58:8  Error: 'DocumentsTabNew' is not defined.  react/jsx-no-undef
[09:30:08.007] 
[09:30:08.007] ./app/dashboard/markup/page.tsx
[09:30:08.007] 63:6  Warning: React Hook useEffect has missing dependencies: 'router' and 'supabase'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.007] 73:11  Warning: Unexpected console statement.  no-console
[09:30:08.007] 80:13  Warning: Unexpected console statement.  no-console
[09:30:08.007] 134:8  Error: 'MarkupEditor' is not defined.  react/jsx-no-undef
[09:30:08.007] 
[09:30:08.007] ./app/dashboard/materials/npc1000/page.tsx
[09:30:08.007] 13:6  Error: 'PageLayout' is not defined.  react/jsx-no-undef
[09:30:08.007] 19:25  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.007] 
[09:30:08.007] ./app/dashboard/materials/page.tsx
[09:30:08.007] 27:6  Error: 'PageLayout' is not defined.  react/jsx-no-undef
[09:30:08.007] 31:28  Error: 'LoadingSpinner' is not defined.  react/jsx-no-undef
[09:30:08.007] 
[09:30:08.007] ./app/dashboard/notifications/analytics/page.tsx
[09:30:08.007] 37:8  Error: 'NotificationAnalyticsDashboard' is not defined.  react/jsx-no-undef
[09:30:08.007] 
[09:30:08.008] ./app/dashboard/notifications/page.tsx
[09:30:08.008] 32:5  Warning: Unexpected console statement.  no-console
[09:30:08.008] 
[09:30:08.008] ./app/dashboard/page.tsx
[09:30:08.008] 8:5  Warning: Unexpected console statement.  no-console
[09:30:08.008] 13:5  Warning: Unexpected console statement.  no-console
[09:30:08.008] 22:5  Warning: Unexpected console statement.  no-console
[09:30:08.008] 25:5  Warning: Unexpected console statement.  no-console
[09:30:08.008] 37:7  Warning: Unexpected console statement.  no-console
[09:30:08.008] 42:7  Warning: Unexpected console statement.  no-console
[09:30:08.008] 94:11  Warning: Unexpected console statement.  no-console
[09:30:08.008] 106:13  Warning: Unexpected console statement.  no-console
[09:30:08.008] 114:15  Warning: Unexpected console statement.  no-console
[09:30:08.008] 116:15  Warning: Unexpected console statement.  no-console
[09:30:08.008] 121:15  Warning: Unexpected console statement.  no-console
[09:30:08.008] 123:15  Warning: Unexpected console statement.  no-console
[09:30:08.008] 130:11  Warning: Unexpected console statement.  no-console
[09:30:08.008] 131:19  Error: 'DashboardWithNotifications' is not defined.  react/jsx-no-undef
[09:30:08.008] 133:36  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.008] 161:7  Warning: Unexpected console statement.  no-console
[09:30:08.009] 172:9  Warning: Unexpected console statement.  no-console
[09:30:08.009] 174:9  Warning: Unexpected console statement.  no-console
[09:30:08.009] 176:9  Warning: Unexpected console statement.  no-console
[09:30:08.009] 182:9  Warning: Unexpected console statement.  no-console
[09:30:08.009] 184:9  Warning: Unexpected console statement.  no-console
[09:30:08.009] 186:9  Warning: Unexpected console statement.  no-console
[09:30:08.009] 193:5  Warning: Unexpected console statement.  no-console
[09:30:08.009] 194:13  Error: 'DashboardWithNotifications' is not defined.  react/jsx-no-undef
[09:30:08.009] 196:27  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.009] 
[09:30:08.009] ./app/dashboard/performance/page.tsx
[09:30:08.009] 29:8  Error: 'PerformanceDashboard' is not defined.  react/jsx-no-undef
[09:30:08.009] 
[09:30:08.009] ./app/dashboard/profile/page.tsx
[09:30:08.009] 36:6  Error: 'DashboardLayout' is not defined.  react/jsx-no-undef
[09:30:08.009] 38:27  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.010] 54:33  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.010] 
[09:30:08.010] ./app/dashboard/salary/page.tsx
[09:30:08.010] 13:33  Warning: 'profileError' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.010] 33:6  Error: 'DashboardLayout' is not defined.  react/jsx-no-undef
[09:30:08.010] 35:27  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.010] 
[09:30:08.010] ./app/dashboard/settings/notifications/page.tsx
[09:30:08.010] 8:11  Error: 'NotificationSettingsPage' is not defined.  react/jsx-no-undef
[09:30:08.010] 
[09:30:08.010] ./app/dashboard/settings/page.tsx
[09:30:08.010] 22:63  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.010] 
[09:30:08.010] ./app/dashboard/settings/settings-form.tsx
[09:30:08.010] 29:25  Warning: 'touchModeIndex' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.010] 75:16  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.010] 
[09:30:08.010] ./app/dashboard/site-info/npc1000-request/page.tsx
[09:30:08.011] 3:11  Error: 'MaterialRequestPage' is not defined.  react/jsx-no-undef
[09:30:08.011] 
[09:30:08.011] ./app/dashboard/site-info/npc1000-usage/page.tsx
[09:30:08.011] 3:11  Error: 'InventoryRecordPage' is not defined.  react/jsx-no-undef
[09:30:08.011] 
[09:30:08.011] ./app/dashboard/site-info/page.tsx
[09:30:08.012] 32:3  Warning: Unexpected console statement.  no-console
[09:30:08.012] 38:9  Warning: 'currentSite' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.012] 39:9  Warning: 'siteHistory' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.012] 42:9  Warning: 'errors' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.012] 52:8  Error: 'SiteInfoTabNew' is not defined.  react/jsx-no-undef
[09:30:08.013] 
[09:30:08.013] ./app/dashboard/site-info/site-info-content.tsx
[09:30:08.013] 94:7  Warning: Unexpected console statement.  no-console
[09:30:08.013] 101:7  Warning: Unexpected console statement.  no-console
[09:30:08.013] 102:7  Warning: Unexpected console statement.  no-console
[09:30:08.014] 194:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.014] 207:14  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.014] 225:10  Error: 'TodaySiteInfo' is not defined.  react/jsx-no-undef
[09:30:08.014] 321:20  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.014] 335:20  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.014] 
[09:30:08.014] ./app/dashboard/test-notifications/page.tsx
[09:30:08.014] 26:11  Error: 'TestNotificationsPage' is not defined.  react/jsx-no-undef
[09:30:08.014] 
[09:30:08.014] ./app/dashboard/test-site-info/page.tsx
[09:30:08.014] 3:3  Warning: Unexpected console statement.  no-console
[09:30:08.014] 11:3  Warning: Unexpected console statement.  no-console
[09:30:08.014] 12:3  Warning: Unexpected console statement.  no-console
[09:30:08.014] 18:8  Error: 'TestSiteInfoClient' is not defined.  react/jsx-no-undef
[09:30:08.014] 
[09:30:08.014] ./app/dashboard/test-site-info/test-client.tsx
[09:30:08.014] 19:7  Warning: Unexpected console statement.  no-console
[09:30:08.014] 26:9  Warning: Unexpected console statement.  no-console
[09:30:08.014] 50:7  Warning: Unexpected console statement.  no-console
[09:30:08.014] 
[09:30:08.015] ./app/dashboard/tools/photo-grid/page.tsx
[09:30:08.015] 14:11  Error: 'PhotoGridToolMain' is not defined.  react/jsx-no-undef
[09:30:08.015] 
[09:30:08.015] ./app/debug/auth-test/page.tsx
[09:30:08.015] 99:9  Warning: Unexpected console statement.  no-console
[09:30:08.015] 239:7  Warning: Unexpected console statement.  no-console
[09:30:08.015] 331:23  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.015] 331:37  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.015] 
[09:30:08.015] ./app/debug/session-test/page.tsx
[09:30:08.015] 9:5  Warning: Unexpected console statement.  no-console
[09:30:08.015] 138:71  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.015] 138:91  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.015] 
[09:30:08.019] ./app/debug-session/page.tsx
[09:30:08.019] 11:5  Warning: Unexpected console statement.  no-console
[09:30:08.019] 26:41  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.019] 185:6  Warning: React Hook useEffect has missing dependencies: 'checkClientSession', 'checkCookies', and 'checkServerSession'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.019] 
[09:30:08.019] ./app/layout.tsx
[09:30:08.019] 127:9  Warning: Custom fonts not added in `pages/_document.js` will only load for a single page. This is discouraged. See: https://nextjs.org/docs/messages/no-page-custom-font  @next/next/no-page-custom-font
[09:30:08.019] 131:9  Warning: Custom fonts not added in `pages/_document.js` will only load for a single page. This is discouraged. See: https://nextjs.org/docs/messages/no-page-custom-font  @next/next/no-page-custom-font
[09:30:08.019] 157:10  Error: 'ErrorBoundary' is not defined.  react/jsx-no-undef
[09:30:08.019] 158:12  Error: 'ThemeProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 159:14  Error: 'FontSizeProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 160:16  Error: 'TouchModeProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 161:18  Error: 'ContrastModeProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 162:20  Error: 'SunlightModeProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 163:22  Error: 'EnvironmentalProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 164:24  Error: 'ThemeInitializer' is not defined.  react/jsx-no-undef
[09:30:08.019] 165:24  Error: 'ProductionQualityOptimizer' is not defined.  react/jsx-no-undef
[09:30:08.019] 166:24  Error: 'SkipNavigation' is not defined.  react/jsx-no-undef
[09:30:08.019] 167:24  Error: 'QueryProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 168:26  Error: 'AuthProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 169:28  Error: 'PerformanceMonitoringProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 170:30  Error: 'ViewportController' is not defined.  react/jsx-no-undef
[09:30:08.019] 171:32  Error: 'AdminViewportMeta' is not defined.  react/jsx-no-undef
[09:30:08.019] 172:32  Error: 'DeepLinkProvider' is not defined.  react/jsx-no-undef
[09:30:08.019] 173:32  Error: 'UIDebugIndicator' is not defined.  react/jsx-no-undef
[09:30:08.019] 175:32  Error: 'OfflineIndicator' is not defined.  react/jsx-no-undef
[09:30:08.019] 176:32  Error: 'InstallPrompt' is not defined.  react/jsx-no-undef
[09:30:08.020] 177:32  Error: 'ServiceWorkerRegistration' is not defined.  react/jsx-no-undef
[09:30:08.020] 178:32  Error: 'NotificationPermission' is not defined.  react/jsx-no-undef
[09:30:08.020] 183:24  Error: 'EnvironmentStatus' is not defined.  react/jsx-no-undef
[09:30:08.020] 184:24  Error: 'Toaster' is not defined.  react/jsx-no-undef
[09:30:08.020] 
[09:30:08.020] ./app/offline/page.tsx
[09:30:08.020] 50:16  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.020] 54:16  Error: 'WifiOff' is not defined.  react/jsx-no-undef
[09:30:08.020] 80:18  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.020] 84:18  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.020] 88:18  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:08.020] 102:14  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.020] 111:16  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:08.020] 
[09:30:08.020] ./app/partner/dashboard/partner-dashboard-client.tsx
[09:30:08.020] 59:14  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.020] 61:12  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.020] 79:14  Error: 'TrendingUp' is not defined.  react/jsx-no-undef
[09:30:08.020] 96:14  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.020] 98:12  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.020] 116:14  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.020] 118:12  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.020] 140:22  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.020] 142:24  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.020] 187:22  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.020] 189:24  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.020] 239:20  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.020] 
[09:30:08.020] ./app/partner/sites/partner-sites-client.tsx
[09:30:08.020] 72:14  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.020] 86:14  Error: 'TrendingUp' is not defined.  react/jsx-no-undef
[09:30:08.020] 100:14  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.020] 111:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.020] 126:14  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:08.027] 152:18  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.027] 157:28  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.027] 164:32  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.027] 182:34  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.028] 199:34  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.028] 206:34  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.028] 228:24  Error: 'ChevronRight' is not defined.  react/jsx-no-undef
[09:30:08.028] 237:14  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.029] 
[09:30:08.029] ./app/partner/work-logs/[id]/page.tsx
[09:30:08.029] 34:5  Warning: Unexpected console statement.  no-console
[09:30:08.029] 
[09:30:08.030] ./app/partner/workers/partner-workers-client.tsx
[09:30:08.030] 76:12  Error: 'Briefcase' is not defined.  react/jsx-no-undef
[09:30:08.030] 83:10  Error: 'HardHat' is not defined.  react/jsx-no-undef
[09:30:08.030] 133:14  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.030] 147:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.031] 161:14  Error: 'Briefcase' is not defined.  react/jsx-no-undef
[09:30:08.031] 175:14  Error: 'HardHat' is not defined.  react/jsx-no-undef
[09:30:08.031] 186:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.031] 242:26  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.032] 263:32  Error: 'Mail' is not defined.  react/jsx-no-undef
[09:30:08.032] 272:32  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:08.032] 290:32  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.032] 312:51  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.032] 320:22  Error: 'ChevronRight' is not defined.  react/jsx-no-undef
[09:30:08.033] 328:14  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.033] 
[09:30:08.033] ./app/payslip/[userId]/[year]/[month]/page.tsx
[09:30:08.033] 4:11  Warning: 'Profile' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.034] 
[09:30:08.034] ./app/pdf-viewer/page.tsx
[09:30:08.034] 58:6  Warning: React Hook useEffect has missing dependencies: 'handleGoBack' and 'handleScreenTouch'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.034] 163:14  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:08.035] 188:18  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:08.035] 202:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.035] 254:16  Error: 'Share2' is not defined.  react/jsx-no-undef
[09:30:08.035] 264:16  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.035] 274:16  Error: 'ZoomIn' is not defined.  react/jsx-no-undef
[09:30:08.035] 284:16  Error: 'Menu' is not defined.  react/jsx-no-undef
[09:30:08.035] 
[09:30:08.035] ./app/projects/project-list.tsx
[09:30:08.035] 11:9  Warning: 'router' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.036] 12:9  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.036] 53:37  Warning: 'projectId' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.036] 53:56  Warning: 'newStatus' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.036] 88:8  Error: 'Navbar' is not defined.  react/jsx-no-undef
[09:30:08.036] 
[09:30:08.036] ./app/shared/[id]/page.tsx
[09:30:08.036] 34:8  Error: 'SharedDocumentViewer' is not defined.  react/jsx-no-undef
[09:30:08.036] 
[09:30:08.036] ./app/tasks/[id]/page.tsx
[09:30:08.036] 3:48  Warning: 'params' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.036] 
[09:30:08.036] ./app/tasks/[id]/task-detail.tsx
[09:30:08.036] 21:9  Warning: 'router' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.036] 22:9  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.036] 141:8  Error: 'Navbar' is not defined.  react/jsx-no-undef
[09:30:08.036] 153:16  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.036] 
[09:30:08.036] ./app/tasks/new/task-form.tsx
[09:30:08.036] 13:9  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.036] 55:8  Error: 'Navbar' is not defined.  react/jsx-no-undef
[09:30:08.036] 
[09:30:08.036] ./app/tasks/task-list.tsx
[09:30:08.036] 13:9  Warning: 'router' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.036] 14:9  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.037] 21:37  Warning: 'taskId' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.037] 21:53  Warning: 'newStatus' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.038] 37:31  Warning: 'taskId' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.038] 62:9  Warning: 'getStatusLabel' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.038] 102:8  Error: 'Navbar' is not defined.  react/jsx-no-undef
[09:30:08.038] 114:16  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.038] 186:28  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.038] 
[09:30:08.038] ./app/team/team-list.tsx
[09:30:08.038] 69:8  Error: 'Navbar' is not defined.  react/jsx-no-undef
[09:30:08.038] 
[09:30:08.038] ./app/test/daily-reports-new/page.tsx
[09:30:08.038] 9:10  Error: 'DailyReportsTabNew' is not defined.  react/jsx-no-undef
[09:30:08.038] 
[09:30:08.038] ./app/test/design-system/page.tsx
[09:30:08.038] 3:11  Error: 'DesignSystemTest' is not defined.  react/jsx-no-undef
[09:30:08.038] 
[09:30:08.038] ./app/test/documents-new/page.tsx
[09:30:08.038] 9:10  Error: 'DocumentsTabNew' is not defined.  react/jsx-no-undef
[09:30:08.038] 
[09:30:08.038] ./app/test/full-mobile-app/page.tsx
[09:30:08.038] 6:9  Warning: 'router' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.039] 11:17  Error: 'HomeTabNew' is not defined.  react/jsx-no-undef
[09:30:08.039] 13:17  Error: 'DailyReportsTabNew' is not defined.  react/jsx-no-undef
[09:30:08.039] 15:17  Error: 'DocumentsTabNew' is not defined.  react/jsx-no-undef
[09:30:08.039] 17:17  Error: 'SiteInfoTabNew' is not defined.  react/jsx-no-undef
[09:30:08.039] 47:17  Error: 'HomeTabNew' is not defined.  react/jsx-no-undef
[09:30:08.039] 54:8  Error: 'MobileHeader' is not defined.  react/jsx-no-undef
[09:30:08.039] 
[09:30:08.039] ./app/test/home-new/page.tsx
[09:30:08.039] 9:10  Error: 'HomeTabNew' is not defined.  react/jsx-no-undef
[09:30:08.039] 
[09:30:08.039] ./app/test/mobile-auth-test/page.tsx
[09:30:08.039] 15:9  Warning: Unexpected console statement.  no-console
[09:30:08.039] 19:9  Warning: Unexpected console statement.  no-console
[09:30:08.039] 42:9  Warning: Unexpected console statement.  no-console
[09:30:08.039] 
[09:30:08.039] ./app/test/site-info-new/page.tsx
[09:30:08.039] 9:10  Error: 'SiteInfoTabNew' is not defined.  react/jsx-no-undef
[09:30:08.039] 
[09:30:08.039] ./app/test-attendance/page.tsx
[09:30:08.039] 26:9  Warning: Unexpected console statement.  no-console
[09:30:08.039] 
[09:30:08.039] ./app/test-auth-fix/page.tsx
[09:30:08.039] 10:11  Warning: 'refreshSalary' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.039] 27:31  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.039] 
[09:30:08.040] ./app/test-modal/page.tsx
[09:30:08.040] 22:14  Error: 'QuickActionsSettings' is not defined.  react/jsx-no-undef
[09:30:08.040] 
[09:30:08.040] ./app/test-photo-grid/page.tsx
[09:30:08.040] 90:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.040] 91:10  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.040] 92:12  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.040] 94:10  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.040] 99:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.040] 102:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.042] 105:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.043] 108:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.043] 
[09:30:08.043] ./app/test-session/page.tsx
[09:30:08.043] 5:50  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.043] 132:10  Error: 'SessionDiagnosticsPanel' is not defined.  react/jsx-no-undef
[09:30:08.043] 
[09:30:08.043] ./app/test-workers/page.tsx
[09:30:08.043] 10:5  Warning: Unexpected console statement.  no-console
[09:30:08.043] 17:7  Warning: Unexpected console statement.  no-console
[09:30:08.043] 35:5  Warning: Unexpected console statement.  no-console
[09:30:08.043] 43:7  Warning: Unexpected console statement.  no-console
[09:30:08.043] 61:5  Warning: Unexpected console statement.  no-console
[09:30:08.043] 68:7  Warning: Unexpected console statement.  no-console
[09:30:08.043] 
[09:30:08.043] ./components/admin/AdminDashboardLayout.tsx
[09:30:08.043] 197:9  Warning: 'router' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.044] 242:12  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:08.044] 256:24  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.044] 288:14  Error: 'LogOut' is not defined.  react/jsx-no-undef
[09:30:08.044] 303:12  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:08.044] 349:24  Error: 'ChevronRight' is not defined.  react/jsx-no-undef
[09:30:08.044] 366:26  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.044] 406:12  Error: 'LogOut' is not defined.  react/jsx-no-undef
[09:30:08.044] 415:9  Warning: 'router' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.044] 432:10  Warning: 'isDarkMode' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.044] 433:10  Warning: 'showUserMenu' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.048] 436:11  Warning: 'isLargeFont' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.048] 437:11  Warning: 'touchMode' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.048] 479:9  Warning: 'handleLogout' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.048] 503:8  Error: 'AdminHeader' is not defined.  react/jsx-no-undef
[09:30:08.048] 
[09:30:08.048] ./components/admin/AdminDataTable.tsx
[09:30:08.048] 46:65  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.048] 205:54  Error: 'ChevronUp' is not defined.  react/jsx-no-undef
[09:30:08.048] 205:90  Error: 'ChevronDown' is not defined.  react/jsx-no-undef
[09:30:08.048] 207:28  Error: 'ChevronDown' is not defined.  react/jsx-no-undef
[09:30:08.049] 322:30  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.049] 336:30  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.049] 353:32  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.049] 373:30  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.049] 
[09:30:08.049] ./components/admin/AdminHeader.tsx
[09:30:08.049] 13:48  Warning: 'onMenuClick' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.049] 13:81  Warning: 'isSidebarOpen' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.049] 15:11  Warning: 'touchMode' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.049] 63:16  Error: 'Menu' is not defined.  react/jsx-no-undef
[09:30:08.049] 87:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.049] 105:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.049] 113:16  Error: 'Bell' is not defined.  react/jsx-no-undef
[09:30:08.049] 125:20  Error: 'Sun' is not defined.  react/jsx-no-undef
[09:30:08.049] 127:20  Error: 'Moon' is not defined.  react/jsx-no-undef
[09:30:08.049] 150:20  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.049] 155:18  Error: 'ChevronDown' is not defined.  react/jsx-no-undef
[09:30:08.049] 174:22  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.049] 179:24  Error: 'Settings' is not defined.  react/jsx-no-undef
[09:30:08.049] 186:24  Error: 'LogOut' is not defined.  react/jsx-no-undef
[09:30:08.049] 
[09:30:08.049] ./components/admin/AdminPageLayout.tsx
[09:30:08.049] 48:20  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:08.049] 52:18  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:08.054] 
[09:30:08.054] ./components/admin/AdminPermissionValidator.tsx
[09:30:08.054] 241:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 268:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 294:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 320:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 346:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 372:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 398:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 416:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 450:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 468:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.054] 567:17  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.054] 569:17  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.054] 571:17  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.054] 573:17  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.055] 641:14  Error: 'Play' is not defined.  react/jsx-no-undef
[09:30:08.055] 
[09:30:08.055] ./components/admin/ApprovalModal.tsx
[09:30:08.055] 62:6  Warning: React Hook useEffect has missing dependencies: 'fetchOrganizations' and 'fetchSites'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.055] 69:21  Warning: 'session' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.055] 252:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.055] 263:18  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.055] 270:18  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:08.055] 282:20  Error: 'Briefcase' is not defined.  react/jsx-no-undef
[09:30:08.055] 296:22  Error: 'Building' is not defined.  react/jsx-no-undef
[09:30:08.055] 302:24  Error: 'Check' is not defined.  react/jsx-no-undef
[09:30:08.055] 338:22  Error: 'Building' is not defined.  react/jsx-no-undef
[09:30:08.055] 344:24  Error: 'Check' is not defined.  react/jsx-no-undef
[09:30:08.055] 380:22  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.055] 393:20  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.055] 
[09:30:08.055] ./components/admin/AuditLogs.tsx
[09:30:08.055] 67:6  Warning: React Hook useEffect has a missing dependency: 'fetchLogs'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.058] 158:30  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.059] 159:30  Error: 'Activity' is not defined.  react/jsx-no-undef
[09:30:08.059] 160:30  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.059] 161:29  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.059] 162:24  Error: 'Activity' is not defined.  react/jsx-no-undef
[09:30:08.059] 224:16  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.059] 230:16  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.059] 312:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.059] 357:20  Error: 'React' is not defined.  react/jsx-no-undef
[09:30:08.059] 364:28  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.059] 405:28  Error: 'ChevronUp' is not defined.  react/jsx-no-undef
[09:30:08.059] 407:28  Error: 'ChevronDown' is not defined.  react/jsx-no-undef
[09:30:08.059] 417:34  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.059] 
[09:30:08.059] ./components/admin/BulkActionBar.tsx
[09:30:08.059] 69:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.059] 107:14  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.059] 
[09:30:08.059] ./components/admin/DocumentManagement.tsx
[09:30:08.059] 9:46  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.059] 27:26  Warning: 'setCategoryFilter' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.059] 52:9  Warning: Unexpected console statement.  no-console
[09:30:08.059] 53:9  Warning: Unexpected console statement.  no-console
[09:30:08.059] 54:9  Warning: Unexpected console statement.  no-console
[09:30:08.059] 126:6  Warning: React Hook useEffect has a missing dependency: 'loadDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.059] 211:12  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.059] 253:51  Warning: 'document' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.060] 355:14  Error: 'FolderOpen' is not defined.  react/jsx-no-undef
[09:30:08.060] 366:14  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.061] 380:20  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.061] 394:19  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
[09:30:08.061] 394:20  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:08.061] 408:20  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:08.061] 422:20  Error: 'Package' is not defined.  react/jsx-no-undef
[09:30:08.061] 436:19  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
[09:30:08.061] 436:20  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:08.061] 449:147  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.061] 490:32  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.061] 548:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.061] 560:16  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.061] 572:16  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.061] 584:16  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.061] 598:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.061] 649:8  Error: 'AdminDataTable' is not defined.  react/jsx-no-undef
[09:30:08.061] 
[09:30:08.062] ./components/admin/DocumentUploadZone.tsx
[09:30:08.062] 120:13  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.062] 190:6  Warning: React Hook React.useEffect has a missing dependency: 'filePreviews'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.062] 255:10  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.062] 275:16  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.062] 355:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.062] 374:16  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.062] 377:16  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.062] 390:20  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.062] 401:20  Error: 'Info' is not defined.  react/jsx-no-undef
[09:30:08.062] 434:14  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.062] 
[09:30:08.062] ./components/admin/EmailNotifications.tsx
[09:30:08.062] 6:46  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.062] 7:42  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.062] 9:10  Warning: 'totalHistory' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.062] 10:23  Warning: 'setHistoryPage' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.062] 38:6  Warning: React Hook useEffect has a missing dependency: 'loadHistory'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.062] 336:18  Error: 'Send' is not defined.  react/jsx-no-undef
[09:30:08.063] 434:18  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.063] 452:38  Error: React Hook "useTemplate" cannot be called inside a callback. React Hooks must be called in a React function component or a custom React Hook function.  react-hooks/rules-of-hooks
[09:30:08.063] 472:18  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:08.063] 
[09:30:08.063] ./components/admin/GlobalSearch.tsx
[09:30:08.063] 208:17  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.063] 210:17  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.063] 212:17  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.063] 214:17  Error: 'Activity' is not defined.  react/jsx-no-undef
[09:30:08.063] 216:17  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.063] 262:8  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.063] 273:10  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.063] 296:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.063] 300:20  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.063] 301:20  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.063] 321:24  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.063] 390:22  Error: 'Loader2' is not defined.  react/jsx-no-undef
[09:30:08.063] 433:24  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.063] 442:28  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.063] 452:32  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.063] 464:26  Error: 'TrendingUp' is not defined.  react/jsx-no-undef
[09:30:08.064] 
[09:30:08.064] ./components/admin/GlobalSearchModal.tsx
[09:30:08.064] 352:6  Warning: React Hook useEffect has a missing dependency: 'handleResultClick'. Either include it or remove the dependency array. Outer scope values like 'quickActions' aren't valid dependencies because mutating them doesn't re-render the component.  react-hooks/exhaustive-deps
[09:30:08.064] 369:28  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.064] 370:28  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.064] 371:32  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.064] 372:30  Error: 'Activity' is not defined.  react/jsx-no-undef
[09:30:08.064] 373:32  Error: 'Package' is not defined.  react/jsx-no-undef
[09:30:08.064] 374:28  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:08.064] 375:24  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.064] 407:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.064] 427:20  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.064] 443:18  Error: 'Loader2' is not defined.  react/jsx-no-undef
[09:30:08.064] 449:20  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.064] 494:22  Error: 'ArrowRight' is not defined.  react/jsx-no-undef
[09:30:08.064] 527:28  Error: 'ArrowRight' is not defined.  react/jsx-no-undef
[09:30:08.064] 538:24  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.064] 548:28  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.065] 564:22  Error: 'TrendingUp' is not defined.  react/jsx-no-undef
[09:30:08.065] 
[09:30:08.065] ./components/admin/MarkupManagement.tsx
[09:30:08.065] 9:44  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.065] 71:7  Warning: Unexpected console statement.  no-console
[09:30:08.065] 140:6  Warning: React Hook useEffect has a missing dependency: 'loadDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.065] 276:14  Error: 'FileImage' is not defined.  react/jsx-no-undef
[09:30:08.065] 277:14  Error: 'Palette' is not defined.  react/jsx-no-undef
[09:30:08.065] 302:12  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.065] 388:16  Error: 'FileImage' is not defined.  react/jsx-no-undef
[09:30:08.065] 400:16  Error: 'Lock' is not defined.  react/jsx-no-undef
[09:30:08.065] 412:16  Error: 'Share2' is not defined.  react/jsx-no-undef
[09:30:08.065] 424:16  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.065] 436:16  Error: 'UserPlus' is not defined.  react/jsx-no-undef
[09:30:08.065] 448:16  Error: 'FileImage' is not defined.  react/jsx-no-undef
[09:30:08.065] 462:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.065] 488:8  Error: 'AdminDataTable' is not defined.  react/jsx-no-undef
[09:30:08.065] 
[09:30:08.065] ./components/admin/MaterialsManagement.tsx
[09:30:08.066] 3:25  Warning: 'commonBulkActions' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.066] 9:47  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.066] 152:6  Warning: React Hook useEffect has missing dependencies: 'loadMaterials', 'loadNPC1000Data', and 'loadRequests'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.066] 163:6  Warning: React Hook useEffect has missing dependencies: 'activeTab', 'loadMaterials', 'loadNPC1000Data', and 'loadRequests'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.066] 239:12  Error: 'Package' is not defined.  react/jsx-no-undef
[09:30:08.066] 586:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.066] 633:8  Error: 'AdminDataTable' is not defined.  react/jsx-no-undef
[09:30:08.066] 634:35  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.066] 635:41  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.066] 
[09:30:08.066] ./components/admin/PhotoGridReportsManagement.tsx
[09:30:08.066] 26:6  Warning: React Hook useEffect has a missing dependency: 'filterReports'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.066] 184:8  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.066] 192:8  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.066] 218:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.066] 223:14  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.066] 227:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.066] 232:14  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:08.066] 243:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.066] 253:16  Error: 'ArrowDownTrayIcon' is not defined.  react/jsx-no-undef
[09:30:08.066] 263:16  Error: 'BarChart3' is not defined.  react/jsx-no-undef
[09:30:08.066] 275:16  Error: 'Building' is not defined.  react/jsx-no-undef
[09:30:08.066] 292:16  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.066] 298:24  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.067] 338:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.067] 344:18  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.067] 373:14  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.067] 391:26  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.067] 398:32  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.067] 402:32  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.067] 406:32  Error: 'Building' is not defined.  react/jsx-no-undef
[09:30:08.067] 410:32  Error: 'ArrowDownTrayIcon' is not defined.  react/jsx-no-undef
[09:30:08.067] 422:28  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.067] 432:26  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.067] 437:26  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.067] 442:26  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.067] 451:22  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.067] 456:24  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.067] 461:24  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.067] 467:26  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.067] 473:24  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.067] 479:26  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.067] 
[09:30:08.067] ./components/admin/SalaryManagement.tsx
[09:30:08.067] 8:44  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.067] 71:10  Error: 'DailySalaryCalculation' is not defined.  react/jsx-no-undef
[09:30:08.067] 76:10  Error: 'IndividualMonthlySalary' is not defined.  react/jsx-no-undef
[09:30:08.067] 81:10  Error: 'SalaryStatementManager' is not defined.  react/jsx-no-undef
[09:30:08.068] 86:10  Error: 'IndividualSalarySettings' is not defined.  react/jsx-no-undef
[09:30:08.068] 91:10  Error: 'SalaryStatsDashboard' is not defined.  react/jsx-no-undef
[09:30:08.068] 
[09:30:08.068] ./components/admin/SiteDocumentManagement.tsx
[09:30:08.068] 96:11  Warning: 'Site' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.068] 137:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.068] 154:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.068] 171:11  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.068] 296:9  Warning: 'getDocumentFileUrl' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.068] 305:9  Warning: 'getDocumentMimeType' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.068] 319:9  Warning: 'getDocumentNotes' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.068] 510:14  Error: 'Share2' is not defined.  react/jsx-no-undef
[09:30:08.068] 511:14  Error: 'FileImage' is not defined.  react/jsx-no-undef
[09:30:08.068] 512:15  Error: 'Receipt' is not defined.  react/jsx-no-undef
[09:30:08.068] 532:12  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.068] 562:12  Error: 'DocumentUploadZone' is not defined.  react/jsx-no-undef
[09:30:08.068] 575:12  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.068] 591:16  Error: 'CheckSquare' is not defined.  react/jsx-no-undef
[09:30:08.068] 686:18  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.069] 713:26  Error: 'CheckSquare' is not defined.  react/jsx-no-undef
[09:30:08.069] 715:26  Error: 'Square' is not defined.  react/jsx-no-undef
[09:30:08.069] 733:34  Error: 'CheckSquare' is not defined.  react/jsx-no-undef
[09:30:08.069] 735:34  Error: 'Square' is not defined.  react/jsx-no-undef
[09:30:08.069] 738:30  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.069] 762:52  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.069] 779:30  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.069] 787:30  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.069] 799:30  Error: 'Settings' is not defined.  react/jsx-no-undef
[09:30:08.069] 807:30  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.069] 827:18  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.069] 843:20  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.069] 850:20  Error: 'ExternalLink' is not defined.  react/jsx-no-undef
[09:30:08.069] 857:20  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.069] 866:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.069] 889:22  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.069] 
[09:30:08.069] ./components/admin/SiteManagement.tsx
[09:30:08.070] 9:42  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.070] 75:6  Warning: React Hook useEffect has a missing dependency: 'loadSites'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.070] 182:12  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.070] 220:12  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.070] 235:20  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:08.070] 299:12  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.070] 306:14  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.070] 333:22  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.070] 349:22  Error: 'MoreVertical' is not defined.  react/jsx-no-undef
[09:30:08.070] 393:20  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.070] 399:22  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.070] 417:22  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.070] 424:22  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.070] 435:22  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.070] 442:22  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.070] 449:22  Error: 'Activity' is not defined.  react/jsx-no-undef
[09:30:08.070] 468:18  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.071] 502:20  Error: 'Grid' is not defined.  react/jsx-no-undef
[09:30:08.071] 513:20  Error: 'List' is not defined.  react/jsx-no-undef
[09:30:08.071] 521:18  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.071] 531:14  Error: 'AdminDataTable' is not defined.  react/jsx-no-undef
[09:30:08.071] 694:14  Error: 'SiteDetail' is not defined.  react/jsx-no-undef
[09:30:08.071] 711:14  Error: 'SiteWorkersModal' is not defined.  react/jsx-no-undef
[09:30:08.071] 723:14  Error: 'UnifiedSiteView' is not defined.  react/jsx-no-undef
[09:30:08.071] 766:10  Warning: 'errors' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.071] 
[09:30:08.071] ./components/admin/SiteUnifiedManagement.tsx
[09:30:08.071] 75:6  Warning: React Hook useEffect has a missing dependency: 'loadSiteAssignments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.071] 82:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.071] 88:14  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:08.071] 111:10  Error: 'Tabs' is not defined.  react/jsx-no-undef
[09:30:08.071] 116:12  Error: 'TabsList' is not defined.  react/jsx-no-undef
[09:30:08.071] 117:14  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.072] 118:16  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.072] 121:14  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.072] 122:16  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.072] 125:14  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.072] 126:16  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.072] 132:14  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.072] 139:14  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.072] 147:14  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.072] 164:30  Warning: 'onRefresh' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.072] 176:22  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.072] 210:22  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.072] 230:22  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.072] 252:22  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:08.072] 268:22  Error: 'Wrench' is not defined.  react/jsx-no-undef
[09:30:08.072] 459:22  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.072] 520:22  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.072] 553:22  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.072] 607:22  Error: 'Home' is not defined.  react/jsx-no-undef
[09:30:08.073] 639:22  Error: 'Wrench' is not defined.  react/jsx-no-undef
[09:30:08.073] 648:22  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.073] 660:24  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.073] 661:26  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.073] 663:24  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.073] 664:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 665:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 666:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 667:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 668:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 685:22  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.073] 697:24  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.073] 698:26  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.073] 700:24  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.073] 701:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 702:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 703:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 704:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 705:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.073] 738:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.073] 745:14  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.073] 748:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.074] 753:14  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.074] 766:3  Warning: 'availableUsers' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.074] 819:10  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.074] 820:12  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.074] 844:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.074] 
[09:30:08.074] ./components/admin/SiteWorkersModal.tsx
[09:30:08.074] 12:3  Warning: 'Table' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.074] 13:3  Warning: 'TableBody' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.074] 14:3  Warning: 'TableCell' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.074] 15:3  Warning: 'TableHead' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.074] 16:3  Warning: 'TableHeader' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.074] 17:3  Warning: 'TableRow' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.074] 57:9  Warning: 'router' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.074] 74:6  Warning: React Hook useEffect has missing dependencies: 'loadAvailableUsers' and 'loadSiteAssignments'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.074] 203:14  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.074] 213:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.074] 214:14  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.074] 218:22  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.074] 227:26  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:08.074] 233:18  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.075] 247:14  Error: 'Tabs' is not defined.  react/jsx-no-undef
[09:30:08.075] 248:16  Error: 'TabsList' is not defined.  react/jsx-no-undef
[09:30:08.075] 249:18  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.075] 250:20  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.075] 253:18  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.075] 254:20  Error: 'UserPlus' is not defined.  react/jsx-no-undef
[09:30:08.075] 259:16  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.075] 266:18  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.075] 273:20  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.075] 276:26  Error: 'Avatar' is not defined.  react/jsx-no-undef
[09:30:08.075] 277:28  Error: 'AvatarFallback' is not defined.  react/jsx-no-undef
[09:30:08.075] 284:30  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.075] 290:32  Error: 'Mail' is not defined.  react/jsx-no-undef
[09:30:08.075] 295:34  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:08.075] 301:30  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.075] 306:24  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.076] 312:26  Error: 'UserMinus' is not defined.  react/jsx-no-undef
[09:30:08.076] 322:16  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.076] 324:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.076] 327:20  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.076] 346:20  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.076] 347:82  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.076] 359:18  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.076] 368:24  Error: 'UserPlus' is not defined.  react/jsx-no-undef
[09:30:08.076] 378:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.076] 379:16  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.076] 391:20  Error: 'UserPlus' is not defined.  react/jsx-no-undef
[09:30:08.076] 397:20  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.076] 400:26  Error: 'Avatar' is not defined.  react/jsx-no-undef
[09:30:08.076] 401:28  Error: 'AvatarFallback' is not defined.  react/jsx-no-undef
[09:30:08.076] 408:30  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.076] 418:32  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.076] 424:24  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.076] 446:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.077] 
[09:30:08.077] ./components/admin/SystemManagement.tsx
[09:30:08.077] 8:44  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.077] 142:6  Warning: React Hook useEffect has missing dependencies: 'loadAuditLogs' and 'loadConfigurations'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.077] 151:6  Warning: React Hook useEffect has missing dependencies: 'activeTab', 'loadAuditLogs', and 'loadConfigurations'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.078] 165:9  Warning: 'handleConfigurationUpdate' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.078] 231:12  Error: 'Settings' is not defined.  react/jsx-no-undef
[09:30:08.078] 327:20  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.078] 342:20  Error: 'Monitor' is not defined.  react/jsx-no-undef
[09:30:08.078] 357:20  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.079] 372:20  Error: 'HardDrive' is not defined.  react/jsx-no-undef
[09:30:08.079] 399:60  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.079] 400:60  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.079] 401:58  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.079] 431:22  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.079] 433:22  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.079] 444:22  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.079] 446:22  Error: 'Play' is not defined.  react/jsx-no-undef
[09:30:08.079] 457:22  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.079] 459:22  Error: 'Server' is not defined.  react/jsx-no-undef
[09:30:08.079] 529:20  Error: 'Database' is not defined.  react/jsx-no-undef
[09:30:08.079] 541:20  Error: 'HardDrive' is not defined.  react/jsx-no-undef
[09:30:08.079] 558:20  Error: 'BarChart3' is not defined.  react/jsx-no-undef
[09:30:08.079] 570:20  Error: 'Activity' is not defined.  react/jsx-no-undef
[09:30:08.079] 594:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.079] 670:10  Error: 'AdminDataTable' is not defined.  react/jsx-no-undef
[09:30:08.079] 685:10  Error: 'AdminDataTable' is not defined.  react/jsx-no-undef
[09:30:08.079] 
[09:30:08.079] ./components/admin/UserDetailModal.tsx
[09:30:08.079] 17:3  Warning: 'onUserDeleted' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.079] 22:54  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.079] 43:6  Warning: React Hook useEffect has a missing dependency: 'fetchUserDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.079] 177:9  Warning: 'handlePasswordReset' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.079] 243:14  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.079] 254:16  Error: 'Edit3' is not defined.  react/jsx-no-undef
[09:30:08.079] 264:18  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.079] 285:20  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.079] 306:26  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.079] 310:28  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.080] 311:30  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.080] 313:28  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.080] 314:30  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 315:30  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 316:30  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 317:30  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 336:26  Error: 'Mail' is not defined.  react/jsx-no-undef
[09:30:08.081] 353:28  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:08.081] 361:26  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.081] 365:28  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.081] 366:30  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.081] 368:28  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.081] 369:30  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 370:30  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 371:30  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 385:20  Error: 'Building' is not defined.  react/jsx-no-undef
[09:30:08.081] 390:22  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.081] 394:24  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.081] 395:26  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.081] 397:24  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.081] 398:26  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 400:28  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 405:30  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 410:28  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.081] 430:18  Error: 'CreditCard' is not defined.  react/jsx-no-undef
[09:30:08.081] 466:20  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.081] 500:18  Error: 'FileCheck' is not defined.  react/jsx-no-undef
[09:30:08.081] 510:84  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.082] 532:34  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.082] 540:36  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.082] 573:40  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.082] 591:18  Error: 'BarChart3' is not defined.  react/jsx-no-undef
[09:30:08.082] 
[09:30:08.082] ./components/admin/UserManagement.tsx
[09:30:08.082] 84:6  Warning: React Hook useEffect has a missing dependency: 'loadUsers'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.082] 158:9  Warning: 'handleEditUser' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.082] 195:12  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.082] 204:16  Error: 'Mail' is not defined.  react/jsx-no-undef
[09:30:08.082] 209:18  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:08.082] 228:16  Error: 'Building' is not defined.  react/jsx-no-undef
[09:30:08.082] 250:14  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:08.082] 343:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.082] 367:16  Error: 'ClipboardCheck' is not defined.  react/jsx-no-undef
[09:30:08.082] 375:18  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.082] 462:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.082] 502:14  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.082] 510:14  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.082] 517:8  Error: 'AdminDataTable' is not defined.  react/jsx-no-undef
[09:30:08.082] 547:8  Error: 'UserDetailModal' is not defined.  react/jsx-no-undef
[09:30:08.082] 
[09:30:08.082] ./components/admin/UserSiteAssignmentModal.tsx
[09:30:08.082] 12:3  Warning: 'Table' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.082] 13:3  Warning: 'TableBody' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.082] 14:3  Warning: 'TableCell' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.082] 15:3  Warning: 'TableHead' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.082] 16:3  Warning: 'TableHeader' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.082] 17:3  Warning: 'TableRow' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.082] 71:6  Warning: React Hook useEffect has missing dependencies: 'loadAvailableSites' and 'loadUserSites'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.082] 229:9  Warning: 'getStatusBadgeColor' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.082] 250:14  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.082] 259:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.083] 260:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.083] 265:20  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.083] 271:22  Error: 'Mail' is not defined.  react/jsx-no-undef
[09:30:08.083] 276:24  Error: 'Phone' is not defined.  react/jsx-no-undef
[09:30:08.083] 283:22  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.083] 288:16  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.083] 301:10  Error: 'Tabs' is not defined.  react/jsx-no-undef
[09:30:08.083] 302:12  Error: 'TabsList' is not defined.  react/jsx-no-undef
[09:30:08.083] 303:14  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.083] 304:16  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.083] 307:14  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.083] 308:16  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.083] 313:12  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.083] 320:18  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.083] 327:20  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.083] 332:28  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.083] 335:28  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.083] 341:30  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.083] 346:32  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.083] 355:32  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.083] 361:24  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.083] 367:26  Error: 'UserMinus' is not defined.  react/jsx-no-undef
[09:30:08.083] 377:12  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.083] 379:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.083] 383:22  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.083] 402:22  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.083] 403:84  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.083] 418:22  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.083] 419:88  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.083] 432:22  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.083] 433:22  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.083] 441:18  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.083] 450:24  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.083] 460:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.084] 461:16  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.084] 473:20  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.084] 479:20  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.084] 484:28  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.084] 490:30  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.084] 495:32  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.084] 501:24  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.084] 521:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.084] 
[09:30:08.084] ./components/admin/WorkerAssignmentManager.tsx
[09:30:08.084] 31:6  Warning: React Hook useEffect has a missing dependency: 'fetchData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.084] 193:12  Error: 'BuildingOfficeIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 201:14  Error: 'UsersIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 215:8  Error: 'Tabs' is not defined.  react/jsx-no-undef
[09:30:08.084] 216:10  Error: 'TabsList' is not defined.  react/jsx-no-undef
[09:30:08.084] 217:12  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.084] 218:14  Error: 'UsersIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 221:12  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.084] 222:14  Error: 'UserPlusIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 228:10  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.084] 232:18  Error: 'UsersIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 237:19  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[09:30:08.084] 237:25  Error: `'` can be escaped with `&apos;`, `&lsquo;`, `&#39;`, `&rsquo;`.  react/no-unescaped-entities
[09:30:08.084] 260:32  Error: 'EnvelopeIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 266:32  Error: 'PhoneIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 280:26  Error: 'UserMinusIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 291:10  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.084] 296:18  Error: 'MagnifyingGlassIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 314:18  Error: 'UserPlusIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 322:18  Error: 'UsersIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 355:32  Error: 'EnvelopeIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 361:32  Error: 'PhoneIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 373:28  Error: 'CheckIcon' is not defined.  react/jsx-no-undef
[09:30:08.084] 
[09:30:08.084] ./components/admin/WorkerCalendar.tsx
[09:30:08.084] 117:14  Error: 'ChevronLeft' is not defined.  react/jsx-no-undef
[09:30:08.084] 128:14  Error: 'ChevronRight' is not defined.  react/jsx-no-undef
[09:30:08.084] 
[09:30:08.085] ./components/admin/WorkerSalarySettings.tsx
[09:30:08.085] 18:48  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.085] 58:6  Warning: React Hook useEffect has a missing dependency: 'filterWorkers'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.085] 202:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.085] 213:10  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.085] 214:12  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.085] 215:14  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.085] 217:12  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.085] 218:14  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.085] 219:14  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.085] 220:14  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.085] 221:14  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.085] 229:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.085] 238:18  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.085] 245:18  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.085] 247:18  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.085] 254:18  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.085] 261:22  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.085] 262:47  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.085] 284:12  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.085] 303:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.085] 309:18  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.085] 312:16  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.085] 317:18  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.085] 322:14  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.085] 326:16  Error: 'Edit2' is not defined.  react/jsx-no-undef
[09:30:08.085] 342:14  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.085] 351:16  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.085] 352:18  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.085] 354:16  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.085] 355:18  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.086] 356:18  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.086] 357:18  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.086] 523:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.086] 528:18  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.086] 556:32  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.086] 566:32  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.086] 579:32  Error: 'Edit2' is not defined.  react/jsx-no-undef
[09:30:08.086] 599:12  Error: 'Settings' is not defined.  react/jsx-no-undef
[09:30:08.086] 611:14  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.086] 620:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.086] 637:14  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.086] 648:14  Error: 'Percent' is not defined.  react/jsx-no-undef
[09:30:08.086] 665:18  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.086] 
[09:30:08.086] ./components/admin/analytics/AnalyticsDashboard.tsx
[09:30:08.086] 11:46  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.086] 14:24  Warning: 'setSelectedSite' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.086] 16:9  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.086] 41:6  Warning: React Hook useEffect has a missing dependency: 'fetchAnalyticsData'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.086] 165:18  Error: 'ArrowUp' is not defined.  react/jsx-no-undef
[09:30:08.086] 167:18  Error: 'ArrowDown' is not defined.  react/jsx-no-undef
[09:30:08.086] 169:18  Error: 'Minus' is not defined.  react/jsx-no-undef
[09:30:08.086] 226:16  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.086] 229:16  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.086] 274:12  Error: 'ResponsiveContainer' is not defined.  react/jsx-no-undef
[09:30:08.087] 275:14  Error: 'AreaChart' is not defined.  react/jsx-no-undef
[09:30:08.087] 276:16  Error: 'CartesianGrid' is not defined.  react/jsx-no-undef
[09:30:08.087] 277:16  Error: 'XAxis' is not defined.  react/jsx-no-undef
[09:30:08.087] 278:16  Error: 'YAxis' is not defined.  react/jsx-no-undef
[09:30:08.087] 279:16  Error: 'Tooltip' is not defined.  react/jsx-no-undef
[09:30:08.087] 280:16  Error: 'Legend' is not defined.  react/jsx-no-undef
[09:30:08.087] 281:16  Error: 'Area' is not defined.  react/jsx-no-undef
[09:30:08.087] 282:16  Error: 'Area' is not defined.  react/jsx-no-undef
[09:30:08.087] 283:16  Error: 'Area' is not defined.  react/jsx-no-undef
[09:30:08.087] 293:12  Error: 'ResponsiveContainer' is not defined.  react/jsx-no-undef
[09:30:08.087] 294:14  Error: 'BarChart' is not defined.  react/jsx-no-undef
[09:30:08.087] 295:16  Error: 'CartesianGrid' is not defined.  react/jsx-no-undef
[09:30:08.087] 296:16  Error: 'XAxis' is not defined.  react/jsx-no-undef
[09:30:08.087] 297:16  Error: 'YAxis' is not defined.  react/jsx-no-undef
[09:30:08.087] 298:16  Error: 'Tooltip' is not defined.  react/jsx-no-undef
[09:30:08.087] 299:16  Error: 'Legend' is not defined.  react/jsx-no-undef
[09:30:08.087] 300:16  Error: 'Bar' is not defined.  react/jsx-no-undef
[09:30:08.087] 301:16  Error: 'Bar' is not defined.  react/jsx-no-undef
[09:30:08.087] 311:12  Error: 'ResponsiveContainer' is not defined.  react/jsx-no-undef
[09:30:08.087] 312:14  Error: 'PieChart' is not defined.  react/jsx-no-undef
[09:30:08.087] 313:16  Error: 'Pie' is not defined.  react/jsx-no-undef
[09:30:08.087] 324:20  Error: 'Cell' is not defined.  react/jsx-no-undef
[09:30:08.087] 327:16  Error: 'Tooltip' is not defined.  react/jsx-no-undef
[09:30:08.087] 337:12  Error: 'ResponsiveContainer' is not defined.  react/jsx-no-undef
[09:30:08.087] 338:14  Error: 'LineChart' is not defined.  react/jsx-no-undef
[09:30:08.087] 339:16  Error: 'CartesianGrid' is not defined.  react/jsx-no-undef
[09:30:08.087] 340:16  Error: 'XAxis' is not defined.  react/jsx-no-undef
[09:30:08.087] 341:16  Error: 'YAxis' is not defined.  react/jsx-no-undef
[09:30:08.087] 342:16  Error: 'Tooltip' is not defined.  react/jsx-no-undef
[09:30:08.087] 343:16  Error: 'Legend' is not defined.  react/jsx-no-undef
[09:30:08.088] 344:16  Error: 'Line' is not defined.  react/jsx-no-undef
[09:30:08.088] 345:16  Error: 'Line' is not defined.  react/jsx-no-undef
[09:30:08.088] 358:12  Error: 'ResponsiveContainer' is not defined.  react/jsx-no-undef
[09:30:08.088] 359:14  Error: 'BarChart' is not defined.  react/jsx-no-undef
[09:30:08.088] 360:16  Error: 'CartesianGrid' is not defined.  react/jsx-no-undef
[09:30:08.088] 361:16  Error: 'XAxis' is not defined.  react/jsx-no-undef
[09:30:08.088] 362:16  Error: 'YAxis' is not defined.  react/jsx-no-undef
[09:30:08.088] 363:16  Error: 'Tooltip' is not defined.  react/jsx-no-undef
[09:30:08.088] 364:16  Error: 'Bar' is not defined.  react/jsx-no-undef
[09:30:08.088] 374:12  Error: 'ResponsiveContainer' is not defined.  react/jsx-no-undef
[09:30:08.088] 375:14  Error: 'LineChart' is not defined.  react/jsx-no-undef
[09:30:08.088] 376:16  Error: 'CartesianGrid' is not defined.  react/jsx-no-undef
[09:30:08.088] 377:16  Error: 'XAxis' is not defined.  react/jsx-no-undef
[09:30:08.088] 378:16  Error: 'YAxis' is not defined.  react/jsx-no-undef
[09:30:08.088] 379:16  Error: 'Tooltip' is not defined.  react/jsx-no-undef
[09:30:08.088] 380:16  Error: 'Legend' is not defined.  react/jsx-no-undef
[09:30:08.088] 381:16  Error: 'Line' is not defined.  react/jsx-no-undef
[09:30:08.088] 382:16  Error: 'Line' is not defined.  react/jsx-no-undef
[09:30:08.088] 429:12  Error: 'Activity' is not defined.  react/jsx-no-undef
[09:30:08.088] 
[09:30:08.088] ./components/admin/assignment/AssignmentDashboard.tsx
[09:30:08.088] 82:34  Error: 'UserPlus' is not defined.  react/jsx-no-undef
[09:30:08.088] 83:31  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.088] 84:36  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.088] 85:24  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.088] 94:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.088] 95:16  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.088] 113:14  Error: 'WorkflowTooltip' is not defined.  react/jsx-no-undef
[09:30:08.088] 120:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.088] 125:14  Error: 'History' is not defined.  react/jsx-no-undef
[09:30:08.088] 128:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.088] 132:14  Error: 'Wand2' is not defined.  react/jsx-no-undef
[09:30:08.088] 140:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.088] 141:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.088] 147:20  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.089] 150:20  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.089] 155:16  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.089] 160:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.089] 161:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.089] 167:20  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.089] 172:16  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.089] 177:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.089] 178:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.089] 183:20  Error: 'MappingTooltip' is not defined.  react/jsx-no-undef
[09:30:08.089] 187:20  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.089] 192:16  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.089] 197:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.089] 198:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.089] 204:20  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.089] 209:16  Error: 'TrendingUp' is not defined.  react/jsx-no-undef
[09:30:08.089] 216:8  Error: 'Tabs' is not defined.  react/jsx-no-undef
[09:30:08.089] 217:10  Error: 'TabsList' is not defined.  react/jsx-no-undef
[09:30:08.089] 218:12  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.089] 219:12  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.089] 221:14  Error: 'MappingTooltip' is not defined.  react/jsx-no-undef
[09:30:08.089] 223:12  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.089] 225:14  Error: 'AssignmentExplanationTooltip' is not defined.  react/jsx-no-undef
[09:30:08.089] 227:12  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.089] 228:14  Error: 'MoveRight' is not defined.  react/jsx-no-undef
[09:30:08.089] 231:12  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.089] 234:10  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.089] 237:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.089] 238:16  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.089] 239:18  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.089] 240:20  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.090] 243:18  Error: 'CardDescription' is not defined.  react/jsx-no-undef
[09:30:08.090] 247:16  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.090] 251:24  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.090] 262:24  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.090] 274:22  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.090] 287:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.090] 288:16  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.090] 289:18  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.090] 290:20  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.090] 293:18  Error: 'CardDescription' is not defined.  react/jsx-no-undef
[09:30:08.090] 297:16  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.090] 299:62  Warning: 'index' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.090] 315:24  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.090] 323:22  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.090] 337:10  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.090] 338:12  Error: 'PartnerSiteMapping' is not defined.  react/jsx-no-undef
[09:30:08.090] 341:10  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.090] 342:12  Error: 'UserAssignmentMatrix' is not defined.  react/jsx-no-undef
[09:30:08.090] 345:10  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.090] 346:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.090] 347:14  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.090] 348:16  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.090] 349:16  Error: 'CardDescription' is not defined.  react/jsx-no-undef
[09:30:08.090] 353:14  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.090] 355:48  Warning: 'index' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.090] 367:28  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.090] 372:28  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.090] 377:28  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.090] 388:22  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.090] 397:10  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.090] 398:12  Error: 'UserAssignmentMatrixDnD' is not defined.  react/jsx-no-undef
[09:30:08.090] 408:8  Error: 'Dialog' is not defined.  react/jsx-no-undef
[09:30:08.090] 409:10  Error: 'DialogContent' is not defined.  react/jsx-no-undef
[09:30:08.091] 410:12  Error: 'DialogHeader' is not defined.  react/jsx-no-undef
[09:30:08.091] 411:14  Error: 'DialogTitle' is not defined.  react/jsx-no-undef
[09:30:08.091] 412:16  Error: 'Wand2' is not defined.  react/jsx-no-undef
[09:30:08.091] 417:14  Error: 'AssignmentWizard' is not defined.  react/jsx-no-undef
[09:30:08.091] 430:8  Error: 'Dialog' is not defined.  react/jsx-no-undef
[09:30:08.091] 431:10  Error: 'DialogContent' is not defined.  react/jsx-no-undef
[09:30:08.091] 432:12  Error: 'DialogHeader' is not defined.  react/jsx-no-undef
[09:30:08.091] 433:14  Error: 'DialogTitle' is not defined.  react/jsx-no-undef
[09:30:08.091] 434:16  Error: 'History' is not defined.  react/jsx-no-undef
[09:30:08.091] 439:14  Error: 'AssignmentHistory' is not defined.  react/jsx-no-undef
[09:30:08.091] 
[09:30:08.091] ./components/admin/assignment/AssignmentHistory.tsx
[09:30:08.091] 62:6  Warning: React Hook useEffect has a missing dependency: 'applyFilters'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.092] 206:13  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.092] 216:13  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.092] 240:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.092] 241:14  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.092] 244:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.092] 245:14  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.093] 252:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.093] 253:10  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.093] 254:12  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.093] 255:14  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:08.093] 259:10  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.093] 262:16  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.093] 270:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.093] 276:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.093] 277:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.093] 279:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.093] 280:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 281:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 282:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 286:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.093] 290:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.093] 291:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.093] 293:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.093] 294:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 295:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 296:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 297:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 301:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.093] 305:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.093] 306:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.093] 308:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.093] 309:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 310:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 311:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 312:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.093] 316:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.093] 320:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.093] 321:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.093] 323:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.093] 324:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 325:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 326:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 327:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 331:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.094] 342:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.094] 343:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.094] 345:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.094] 346:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 347:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 348:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 349:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 350:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 351:18  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.094] 360:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.094] 361:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.094] 367:16  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.094] 372:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.094] 373:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.094] 381:16  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.094] 386:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.094] 387:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.094] 395:16  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.094] 400:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.094] 401:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.094] 409:16  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.094] 416:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.094] 417:10  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.094] 418:12  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.094] 420:10  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.094] 423:16  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.094] 478:26  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.094] 483:26  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.094] 488:28  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.094] 503:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.095] 504:14  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.095] 505:16  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.095] 507:14  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.095] 558:18  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.095] 
[09:30:08.095] ./components/admin/assignment/AssignmentTooltip.tsx
[09:30:08.095] 46:14  Error: 'HelpCircle' is not defined.  react/jsx-no-undef
[09:30:08.095] 52:16  Error: 'Info' is not defined.  react/jsx-no-undef
[09:30:08.095] 
[09:30:08.095] ./components/admin/assignment/AssignmentWizard.tsx
[09:30:08.095] 37:12  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.095] 43:12  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.095] 49:12  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.095] 55:12  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.095] 61:12  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.095] 198:16  Error: 'AssignmentTooltip' is not defined.  react/jsx-no-undef
[09:30:08.095] 203:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.095] 204:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.095] 205:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.095] 207:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.095] 209:20  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.095] 218:20  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.095] 233:16  Error: 'AssignmentTooltip' is not defined.  react/jsx-no-undef
[09:30:08.095] 238:14  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.095] 239:16  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.095] 240:18  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.095] 242:16  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.095] 246:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.095] 258:20  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.095] 269:9  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.095] 277:16  Error: 'AssignmentTooltip' is not defined.  react/jsx-no-undef
[09:30:08.095] 304:24  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.096] 309:24  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.096] 319:20  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.096] 339:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.096] 340:18  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.096] 341:20  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.096] 342:22  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.096] 344:20  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.096] 345:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.096] 346:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.096] 347:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.096] 353:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.096] 354:18  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.096] 355:20  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.096] 356:22  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.096] 358:20  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.096] 359:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.096] 360:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.096] 361:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.096] 368:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.096] 369:16  Error: 'Textarea' is not defined.  react/jsx-no-undef
[09:30:08.096] 381:9  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.096] 382:9  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.096] 383:9  Error: Unexpected lexical declaration in case block.  no-case-declarations
[09:30:08.096] 395:16  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.096] 396:18  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.096] 397:20  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.096] 399:18  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.096] 414:22  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.096] 421:22  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.096] 429:16  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.096] 430:18  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.097] 431:20  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.097] 433:18  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.097] 437:26  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.097] 446:18  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.097] 447:20  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.097] 448:22  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.097] 450:20  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.097] 478:18  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.097] 503:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.097] 504:10  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.097] 511:10  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.097] 516:12  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:08.097] 521:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.097] 527:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.097] 530:12  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.097] 535:14  Error: 'ArrowRight' is not defined.  react/jsx-no-undef
[09:30:08.097] 
[09:30:08.097] ./components/admin/assignment/PartnerSiteMapping.tsx
[09:30:08.097] 249:14  Error: 'MappingTooltip' is not defined.  react/jsx-no-undef
[09:30:08.097] 255:10  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.097] 256:12  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.097] 263:10  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.097] 264:10  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.097] 276:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.097] 277:16  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.097] 286:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.097] 287:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.097] 288:14  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.097] 295:14  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.097] 303:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.097] 304:16  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.097] 305:18  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.097] 306:20  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.098] 308:20  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.098] 312:18  Error: 'CardDescription' is not defined.  react/jsx-no-undef
[09:30:08.098] 317:16  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.098] 331:30  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.098] 335:30  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.098] 344:32  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.098] 350:34  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.098] 362:28  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.098] 368:51  Error: 'Unlink' is not defined.  react/jsx-no-undef
[09:30:08.098] 368:84  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.098] 370:28  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.098] 376:30  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.098] 378:28  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.098] 385:30  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.098] 399:8  Error: 'Dialog' is not defined.  react/jsx-no-undef
[09:30:08.098] 406:10  Error: 'DialogContent' is not defined.  react/jsx-no-undef
[09:30:08.098] 407:12  Error: 'DialogHeader' is not defined.  react/jsx-no-undef
[09:30:08.098] 408:14  Error: 'DialogTitle' is not defined.  react/jsx-no-undef
[09:30:08.098] 411:14  Error: 'DialogDescription' is not defined.  react/jsx-no-undef
[09:30:08.098] 418:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.098] 419:16  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.098] 423:18  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.098] 424:20  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.098] 426:18  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.098] 428:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.098] 437:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.098] 438:16  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.098] 442:18  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.098] 443:20  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.098] 445:18  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.098] 447:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.099] 457:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.099] 458:18  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.099] 466:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.099] 467:18  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.099] 476:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.099] 477:16  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.099] 485:12  Error: 'DialogFooter' is not defined.  react/jsx-no-undef
[09:30:08.099] 486:14  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.099] 493:14  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.099] 
[09:30:08.099] ./components/admin/assignment/UserAssignmentMatrix.tsx
[09:30:08.099] 92:6  Warning: React Hook useEffect has a missing dependency: 'loadAssignments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.099] 278:17  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.099] 281:12  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.099] 281:12  Error: Optional chain expressions can return undefined by design - using a non-null assertion is unsafe and wrong.  @typescript-eslint/no-non-null-asserted-optional-chain
[09:30:08.099] 291:14  Error: 'AssignmentExplanationTooltip' is not defined.  react/jsx-no-undef
[09:30:08.099] 299:14  Error: 'UserPlus' is not defined.  react/jsx-no-undef
[09:30:08.099] 303:14  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.099] 312:12  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.099] 313:12  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.099] 344:8  Error: 'Tabs' is not defined.  react/jsx-no-undef
[09:30:08.099] 345:10  Error: 'TabsList' is not defined.  react/jsx-no-undef
[09:30:08.099] 346:12  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.099] 347:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.099] 350:12  Error: 'TabsTrigger' is not defined.  react/jsx-no-undef
[09:30:08.099] 351:14  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.099] 356:10  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.099] 360:18  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.099] 361:20  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.099] 370:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.099] 371:16  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.099] 372:18  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.100] 387:18  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.100] 392:20  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.100] 400:28  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.100] 414:24  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.100] 421:26  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.100] 431:28  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.100] 434:26  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.100] 453:26  Error: 'UserMinus' is not defined.  react/jsx-no-undef
[09:30:08.100] 464:10  Error: 'TabsContent' is not defined.  react/jsx-no-undef
[09:30:08.100] 467:16  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.100] 468:18  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.100] 476:26  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.100] 496:22  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.100] 507:24  Error: 'UserPlus' is not defined.  react/jsx-no-undef
[09:30:08.100] 517:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.100] 518:16  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.100] 519:18  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.100] 544:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 563:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 583:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 600:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 618:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 619:16  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.100] 654:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 673:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 695:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 712:18  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 730:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 766:20  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.100] 774:16  Error: 'Label' is not defined.  react/jsx-no-undef
[09:30:08.100] 775:16  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.100] 
[09:30:08.100] ./components/admin/assignment/UserAssignmentMatrixDnD.tsx
[09:30:08.101] 47:10  Warning: 'loading' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.101] 50:24  Warning: 'setStatusFilter' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.101] 51:10  Warning: 'showAssignModal' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.101] 51:27  Warning: 'setShowAssignModal' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.101] 58:10  Warning: 'assignmentData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.101] 58:26  Warning: 'setAssignmentData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.101] 70:6  Warning: React Hook useEffect has a missing dependency: 'loadAssignments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.101] 298:14  Error: 'MoveRight' is not defined.  react/jsx-no-undef
[09:30:08.101] 300:14  Error: 'AssignmentExplanationTooltip' is not defined.  react/jsx-no-undef
[09:30:08.101] 306:10  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.101] 307:12  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.101] 315:12  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.101] 316:12  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.101] 323:10  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.101] 324:12  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.101] 325:14  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.101] 327:12  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.101] 328:14  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.101] 329:14  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.101] 330:14  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.101] 331:14  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.101] 339:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.101] 340:12  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.101] 341:14  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.101] 342:16  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.101] 345:14  Error: 'CardDescription' is not defined.  react/jsx-no-undef
[09:30:08.101] 349:12  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.101] 352:18  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.101] 367:20  Error: 'GripVertical' is not defined.  react/jsx-no-undef
[09:30:08.101] 377:20  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.101] 394:16  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.102] 405:18  Error: 'CardHeader' is not defined.  react/jsx-no-undef
[09:30:08.102] 406:20  Error: 'CardTitle' is not defined.  react/jsx-no-undef
[09:30:08.102] 407:22  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.102] 410:20  Error: 'CardDescription' is not defined.  react/jsx-no-undef
[09:30:08.102] 412:22  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.102] 417:18  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.102] 423:24  Error: 'UserPlus' is not defined.  react/jsx-no-undef
[09:30:08.102] 447:28  Error: 'GripVertical' is not defined.  react/jsx-no-undef
[09:30:08.102] 456:28  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.102] 465:30  Error: 'UserMinus' is not defined.  react/jsx-no-undef
[09:30:08.102] 486:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.102] 487:10  Error: 'CardContent' is not defined.  react/jsx-no-undef
[09:30:08.102] 
[09:30:08.102] ./components/admin/audit/AuditLogSystem.tsx
[09:30:08.102] 46:42  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.102] 87:6  Warning: React Hook useEffect has a missing dependency: 'supabase'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.102] 91:6  Warning: React Hook useEffect has a missing dependency: 'filterLogs'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.102] 278:12  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.102] 283:12  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.102] 288:12  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.102] 316:16  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.102] 322:16  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.102] 337:16  Error: 'Activity' is not defined.  react/jsx-no-undef
[09:30:08.102] 349:16  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.102] 361:16  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.102] 373:16  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.102] 385:16  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.102] 396:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.102] 445:16  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:08.102] 447:39  Error: 'ChevronUp' is not defined.  react/jsx-no-undef
[09:30:08.102] 447:75  Error: 'ChevronDown' is not defined.  react/jsx-no-undef
[09:30:08.102] 550:28  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.103] 596:28  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.103] 621:20  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.103] 
[09:30:08.103] ./components/admin/communication/CommunicationManagement.tsx
[09:30:08.103] 11:10  Warning: 'loading' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.103] 11:19  Warning: 'setLoading' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.103] 12:9  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.103] 85:44  Error: 'AnnouncementsTab' is not defined.  react/jsx-no-undef
[09:30:08.103] 
[09:30:08.103] ./components/admin/communication/tabs/AnnouncementsTab.tsx
[09:30:08.103] 27:26  Warning: 'setFilterAudience' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.103] 43:6  Warning: React Hook useEffect has a missing dependency: 'loadAnnouncements'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.103] 48:11  Warning: 'query' is never reassigned. Use 'const' instead.  prefer-const
[09:30:08.103] 162:13  Error: 'Bell' is not defined.  react/jsx-no-undef
[09:30:08.103] 209:14  Error: 'Bell' is not defined.  react/jsx-no-undef
[09:30:08.103] 230:14  Error: 'PlusCircle' is not defined.  react/jsx-no-undef
[09:30:08.103] 324:14  Error: 'Bell' is not defined.  react/jsx-no-undef
[09:30:08.103] 350:24  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.103] 366:48  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.103] 366:78  Error: 'EyeOff' is not defined.  react/jsx-no-undef
[09:30:08.103] 372:22  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.103] 378:22  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.103] 
[09:30:08.103] ./components/admin/communication/tabs/RequestsTab.tsx
[09:30:08.103] 51:6  Warning: React Hook useEffect has a missing dependency: 'loadRequests'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.107] 247:35  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.107] 255:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.108] 344:24  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.108] 351:26  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.108] 385:24  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.108] 411:20  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.108] 542:20  Error: 'Reply' is not defined.  react/jsx-no-undef
[09:30:08.108] 
[09:30:08.108] ./components/admin/daily-reports/AttachmentsTab.tsx
[09:30:08.108] 29:10  Warning: 'error' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.108] 35:6  Warning: React Hook useEffect has a missing dependency: 'fetchFiles'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.109] 109:23  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.109] 268:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.109] 270:14  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.109] 279:12  Error: 'File' is not defined.  react/jsx-no-undef
[09:30:08.109] 313:18  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.109] 330:12  Error: 'File' is not defined.  react/jsx-no-undef
[09:30:08.109] 333:53  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.109] 333:59  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.109] 369:29  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.109] 375:33  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.109] 406:30  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.109] 414:28  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.109] 422:30  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.109] 446:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.109] 448:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.109] 
[09:30:08.109] ./components/admin/daily-reports/DailyReportCreateModal.tsx
[09:30:08.109] 54:10  Warning: 'selectedSite' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.109] 195:14  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.109] 222:20  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.109] 226:22  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.109] 227:24  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.109] 229:22  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.109] 231:26  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.109] 236:28  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.109] 324:34  Warning: 'e' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.109] 334:34  Warning: 'e' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.109] 345:20  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.109] 349:22  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.109] 350:24  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.109] 352:22  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.109] 354:26  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.109] 359:28  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.109] 405:24  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.109] 420:28  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.109] 434:28  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.109] 522:16  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.109] 530:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.109] 
[09:30:08.110] ./components/admin/daily-reports/DailyReportDetailModal.tsx
[09:30:08.110] 64:10  Warning: 'loadingPhotos' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.110] 80:50  Warning: 'optionsLoading' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.110] 101:6  Warning: React Hook useEffect has a missing dependency: 'fetchPhotos'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.110] 105:6  Warning: React Hook useEffect has a missing dependency: 'fetchActualWorkers'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.110] 168:9  Warning: 'handleFileUpload' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.110] 180:21  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.110] 195:21  Warning: 'fileData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.110] 220:9  Warning: 'handleDeletePhoto' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.110] 313:9  Warning: 'getFileTypeLabel' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.110] 328:9  Warning: 'getFileTypeColor' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.110] 343:9  Warning: 'formatFileSize' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.110] 368:14  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.110] 393:16  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.110] 551:30  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.110] 561:32  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.110] 562:34  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.110] 564:32  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.110] 566:36  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.110] 590:30  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.110] 600:32  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.110] 601:34  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.110] 603:32  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.110] 605:36  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.110] 764:14  Error: 'WorkerManagementTab' is not defined.  react/jsx-no-undef
[09:30:08.110] 774:14  Error: 'AttachmentsTab' is not defined.  react/jsx-no-undef
[09:30:08.110] 782:14  Error: 'PhotosTab' is not defined.  react/jsx-no-undef
[09:30:08.110] 790:14  Error: 'ReceiptsTab' is not defined.  react/jsx-no-undef
[09:30:08.110] 798:14  Error: 'MarkupTab' is not defined.  react/jsx-no-undef
[09:30:08.110] 821:20  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.110] 834:20  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.110] 847:20  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.110] 860:20  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.110] 873:20  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.110] 886:20  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.110] 908:20  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.110] 
[09:30:08.110] ./components/admin/daily-reports/DailyReportDetailModalWrapper.tsx
[09:30:08.110] 26:6  Warning: React Hook useEffect has a missing dependency: 'fetchReport'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.110] 
[09:30:08.110] ./components/admin/daily-reports/DailyReportsManagement.tsx
[09:30:08.111] 80:10  Warning: 'debounce' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.111] 132:6  Warning: React Hook useEffect has a missing dependency: 'fetchReports'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.111] 149:6  Warning: React Hook useEffect has a missing dependency: 'fetchReports'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.111] 224:9  Warning: 'openDetailModal' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.111] 229:9  Warning: 'handleViewIntegrated' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.111] 283:13  Warning: 'originalText' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.111] 355:15  Error: 'ChevronsUpDown' is not defined.  react/jsx-no-undef
[09:30:08.111] 358:10  Error: 'ChevronUp' is not defined.  react/jsx-no-undef
[09:30:08.111] 359:10  Error: 'ChevronDown' is not defined.  react/jsx-no-undef
[09:30:08.111] 371:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.111] 389:22  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.111] 400:16  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:08.111] 407:16  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.111] 419:18  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.111] 423:20  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.111] 424:22  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.111] 426:20  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.111] 427:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.111] 429:24  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.111] 436:18  Error: 'Select' is not defined.  react/jsx-no-undef
[09:30:08.111] 440:20  Error: 'SelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.111] 441:22  Error: 'SelectValue' is not defined.  react/jsx-no-undef
[09:30:08.111] 443:20  Error: 'SelectContent' is not defined.  react/jsx-no-undef
[09:30:08.111] 444:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.111] 445:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.111] 446:22  Error: 'SelectItem' is not defined.  react/jsx-no-undef
[09:30:08.111] 520:23  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.111] 520:40  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.111] 535:12  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.111] 549:14  Error: 'FileImage' is not defined.  react/jsx-no-undef
[09:30:08.111] 660:26  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.111] 827:16  Error: 'ChevronLeft' is not defined.  react/jsx-no-undef
[09:30:08.111] 857:16  Error: 'ChevronRight' is not defined.  react/jsx-no-undef
[09:30:08.111] 
[09:30:08.111] ./components/admin/daily-reports/MarkupTab.tsx
[09:30:08.111] 33:10  Warning: 'uploading' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.111] 34:10  Warning: 'error' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.111] 40:6  Warning: React Hook useEffect has a missing dependency: 'fetchMarkups'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.111] 110:9  Warning: 'handleMarkupUpload' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.112] 145:23  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.112] 334:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.112] 336:14  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.112] 345:12  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.112] 363:14  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.112] 376:22  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.112] 389:12  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.112] 392:53  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.112] 392:59  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.112] 426:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.112] 430:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.112] 493:3  Warning: 'onDelete' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.112] 496:3  Warning: 'isEditing' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.112] 506:11  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.112] 513:14  Error: 'FileImage' is not defined.  react/jsx-no-undef
[09:30:08.112] 517:12  Error: 'ZoomIn' is not defined.  react/jsx-no-undef
[09:30:08.112] 551:14  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.112] 561:14  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.112] 571:14  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.112] 
[09:30:08.112] ./components/admin/daily-reports/PhotosTab.tsx
[09:30:08.112] 30:10  Warning: 'error' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.112] 37:6  Warning: React Hook useEffect has a missing dependency: 'fetchPhotos'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.112] 118:23  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.112] 260:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.112] 262:14  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.112] 271:12  Error: 'Camera' is not defined.  react/jsx-no-undef
[09:30:08.112] 335:20  Error: 'Camera' is not defined.  react/jsx-no-undef
[09:30:08.112] 355:22  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.112] 385:16  Error: 'Camera' is not defined.  react/jsx-no-undef
[09:30:08.112] 414:16  Error: 'Camera' is not defined.  react/jsx-no-undef
[09:30:08.112] 445:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.113] 447:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.113] 481:9  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.113] 487:12  Error: 'ZoomIn' is not defined.  react/jsx-no-undef
[09:30:08.113] 506:10  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.113] 
[09:30:08.113] ./components/admin/daily-reports/ReceiptsTab.tsx
[09:30:08.113] 33:10  Warning: 'error' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.113] 47:6  Warning: React Hook useEffect has a missing dependency: 'fetchReceipts'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.113] 122:11  Warning: 'newPreviews' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.113] 169:5  Warning: Unexpected console statement.  no-console
[09:30:08.113] 170:5  Warning: Unexpected console statement.  no-console
[09:30:08.113] 177:5  Warning: Unexpected console statement.  no-console
[09:30:08.113] 226:11  Warning: Unexpected console statement.  no-console
[09:30:08.113] 229:25  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.113] 272:11  Warning: Unexpected console statement.  no-console
[09:30:08.113] 311:9  Warning: 'handleReceiptUpload' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.113] 351:23  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.113] 533:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.113] 535:14  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.113] 544:12  Error: 'Receipt' is not defined.  react/jsx-no-undef
[09:30:08.113] 569:24  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.113] 646:26  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.113] 655:29  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.113] 664:32  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.113] 680:16  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.113] 704:22  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.113] 729:14  Error: 'Receipt' is not defined.  react/jsx-no-undef
[09:30:08.113] 762:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.113] 771:15  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.113] 823:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.113] 826:13  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.113] 833:14  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.114] 872:18  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.114] 882:18  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.114] 893:20  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.114] 
[09:30:08.114] ./components/admin/daily-reports/WorkerDebugPanel.tsx
[09:30:08.114] 111:14  Error: 'Loader' is not defined.  react/jsx-no-undef
[09:30:08.114] 119:16  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.114] 130:16  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.114] 
[09:30:08.114] ./components/admin/daily-reports/WorkerManagementTab-backup.tsx
[09:30:08.114] 11:11  Warning: 'Site' is defined but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.114] 71:11  Warning: Unexpected console statement.  no-console
[09:30:08.114] 88:6  Warning: React Hook useEffect has missing dependencies: 'fetchAvailableWorkers' and 'fetchWorkers'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.114] 100:7  Warning: Unexpected console statement.  no-console
[09:30:08.114] 113:7  Warning: Unexpected console statement.  no-console
[09:30:08.114] 217:5  Warning: Unexpected console statement.  no-console
[09:30:08.114] 241:7  Warning: Unexpected console statement.  no-console
[09:30:08.114] 270:7  Warning: Unexpected console statement.  no-console
[09:30:08.114] 297:6  Warning: React Hook useCallback has a missing dependency: 'fetchWorkers'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.115] 340:9  Warning: 'updateTotalWorkers' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.115] 402:12  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.115] 421:14  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.115] 439:14  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.115] 452:14  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.115] 505:22  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.115] 508:25  Warning: Unexpected console statement.  no-console
[09:30:08.115] 516:24  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.115] 517:26  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.115] 519:24  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.115] 523:32  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.115] 527:30  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.115] 532:30  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.115] 542:27  Warning: Unexpected console statement.  no-console
[09:30:08.115] 552:20  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.115] 555:23  Warning: Unexpected console statement.  no-console
[09:30:08.115] 559:22  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.115] 560:24  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.115] 562:22  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.115] 564:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.115] 577:25  Warning: Unexpected console statement.  no-console
[09:30:08.115] 584:24  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.115] 588:25  Warning: Unexpected console statement.  no-console
[09:30:08.115] 595:24  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.115] 606:22  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.115] 622:12  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.115] 629:18  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.115] 641:18  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.115] 653:18  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.115] 665:18  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.115] 701:10  Error: 'WorkerDebugPanel' is not defined.  react/jsx-no-undef
[09:30:08.115] 755:14  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.115] 765:16  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.115] 766:18  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.115] 768:16  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.115] 770:20  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.115] 774:18  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.115] 793:12  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.115] 797:14  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.115] 798:16  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.115] 800:14  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.115] 802:18  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.115] 830:20  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.115] 838:20  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.115] 849:20  Error: 'Edit2' is not defined.  react/jsx-no-undef
[09:30:08.115] 857:20  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.115] 
[09:30:08.116] ./components/admin/daily-reports/WorkerManagementTab.tsx
[09:30:08.116] 63:6  Warning: React Hook useEffect has missing dependencies: 'fetchAvailableWorkers' and 'fetchWorkers'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.116] 273:12  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.116] 296:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.116] 298:14  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.116] 308:14  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.116] 321:14  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.116] 377:22  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.116] 382:24  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.116] 383:26  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.116] 385:24  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.116] 387:28  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.116] 405:20  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.116] 410:22  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.116] 411:24  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.116] 413:22  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.116] 415:26  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.116] 433:26  Error: 'Check' is not defined.  react/jsx-no-undef
[09:30:08.116] 442:24  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.116] 453:22  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.116] 456:63  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.116] 456:70  Error: `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`.  react/no-unescaped-entities
[09:30:08.116] 470:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.116] 477:20  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.116] 489:20  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.116] 501:20  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.116] 513:20  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.116] 573:14  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.116] 578:16  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.116] 579:18  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.116] 581:16  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.116] 583:20  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.116] 605:12  Error: 'CustomSelect' is not defined.  react/jsx-no-undef
[09:30:08.116] 610:14  Error: 'CustomSelectTrigger' is not defined.  react/jsx-no-undef
[09:30:08.116] 611:16  Error: 'CustomSelectValue' is not defined.  react/jsx-no-undef
[09:30:08.116] 613:14  Error: 'CustomSelectContent' is not defined.  react/jsx-no-undef
[09:30:08.116] 615:18  Error: 'CustomSelectItem' is not defined.  react/jsx-no-undef
[09:30:08.116] 639:22  Error: 'Check' is not defined.  react/jsx-no-undef
[09:30:08.116] 648:20  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.116] 659:20  Error: 'Edit2' is not defined.  react/jsx-no-undef
[09:30:08.116] 667:20  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.116] 
[09:30:08.116] ./components/admin/documents/CreateFolderModal.tsx
[09:30:08.116] 15:3  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.116] 28:9  Warning: 'supabase' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.116] 93:14  Error: 'Folder' is not defined.  react/jsx-no-undef
[09:30:08.116] 102:14  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.116] 111:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.116] 153:16  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.117] 
[09:30:08.117] ./components/admin/documents/DocumentList.tsx
[09:30:08.117] 19:3  Warning: 'profile' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.117] 94:10  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.117] 147:62  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.117] 148:72  Error: 'Lock' is not defined.  react/jsx-no-undef
[09:30:08.117] 149:64  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.117] 156:22  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.117] 161:22  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.117] 167:24  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.117] 174:24  Error: 'FolderOpen' is not defined.  react/jsx-no-undef
[09:30:08.117] 180:22  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.117] 205:20  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.117] 214:20  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.117] 223:22  Error: 'Share2' is not defined.  react/jsx-no-undef
[09:30:08.117] 232:22  Error: 'Edit' is not defined.  react/jsx-no-undef
[09:30:08.117] 242:22  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.117] 
[09:30:08.117] ./components/admin/documents/DocumentNavigation.tsx
[09:30:08.117] 30:12  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:08.117] 61:16  Error: 'Link' is not defined.  react/jsx-no-undef
[09:30:08.117] 
[09:30:08.117] ./components/admin/documents/DocumentOverviewManagement.tsx
[09:30:08.117] 45:11  Warning: 'touchMode' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.117] 130:14  Error: 'BarChart3' is not defined.  react/jsx-no-undef
[09:30:08.117] 142:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.117] 145:18  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.117] 154:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.117] 157:18  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.117] 166:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.123] 169:17  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
[09:30:08.123] 169:18  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:08.123] 178:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.123] 181:18  Error: 'Shield' is not defined.  react/jsx-no-undef
[09:30:08.123] 190:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.123] 193:18  Error: 'Package' is not defined.  react/jsx-no-undef
[09:30:08.123] 205:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.123] 208:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.123] 209:14  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.123] 224:18  Error: 'Grid' is not defined.  react/jsx-no-undef
[09:30:08.123] 230:18  Error: 'List' is not defined.  react/jsx-no-undef
[09:30:08.123] 244:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.123] 245:14  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.123] 258:18  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.123] 277:28  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.123] 286:28  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.123] 287:30  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.124] 289:28  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.124] 290:30  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.124] 301:12  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.124] 364:30  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.124] 365:32  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.124] 367:30  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.124] 368:32  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.124] 
[09:30:08.124] ./components/admin/documents/DocumentPermissionManager.tsx
[09:30:08.124] 27:3  Warning: 'onSuccess' is defined but never used. Allowed unused args must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.124] 47:6  Warning: React Hook useEffect has missing dependencies: 'loadAvailableOptions' and 'loadPermissions'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.124] 179:28  Error: 'Lock' is not defined.  react/jsx-no-undef
[09:30:08.124] 180:32  Error: 'Unlock' is not defined.  react/jsx-no-undef
[09:30:08.124] 181:28  Error: 'Share2' is not defined.  react/jsx-no-undef
[09:30:08.124] 182:29  Error: 'Check' is not defined.  react/jsx-no-undef
[09:30:08.124] 183:24  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.124] 237:14  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.124] 278:55  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.124] 
[09:30:08.124] ./components/admin/documents/DocumentUploadPage.tsx
[09:30:08.124] 32:6  Warning: React Hook useEffect has a missing dependency: 'fetchSites'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.124] 175:17  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.124] 177:17  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.124] 181:17  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.124] 277:16  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.125] 292:18  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.125] 328:22  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.125] 
[09:30:08.125] ./components/admin/documents/EnhancedDocumentManagement.tsx
[09:30:08.125] 126:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.125] 127:38  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.125] 128:44  Warning: Unexpected any. Specify a different type.  @typescript-eslint/no-explicit-any
[09:30:08.125] 133:10  Warning: 'currentUser' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.125] 144:6  Warning: React Hook useEffect has missing dependencies: 'loadAllStats', 'loadCurrentUser', 'loadPartners', 'loadSites', and 'loadUsers'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.125] 148:6  Warning: React Hook useEffect has a missing dependency: 'loadDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.125] 317:5  Warning: Unexpected console statement.  no-console
[09:30:08.125] 324:7  Warning: Unexpected console statement.  no-console
[09:30:08.125] 332:7  Warning: Unexpected console statement.  no-console
[09:30:08.125] 368:27  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.125] 390:18  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.125] 398:16  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.125] 414:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.125] 425:16  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.125] 436:16  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.125] 447:16  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.125] 517:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.125] 566:14  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:08.125] 589:16  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.125] 701:32  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.125] 707:30  Error: 'Lock' is not defined.  react/jsx-no-undef
[09:30:08.125] 742:30  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.125] 749:30  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.125] 757:32  Error: 'Share2' is not defined.  react/jsx-no-undef
[09:30:08.125] 766:32  Error: 'History' is not defined.  react/jsx-no-undef
[09:30:08.125] 774:30  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.125] 777:30  Error: 'MoreVertical' is not defined.  react/jsx-no-undef
[09:30:08.125] 802:18  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.125] 902:18  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.125] 956:18  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.125] 976:18  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.125] 1047:18  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.125] 
[09:30:08.125] ./components/admin/documents/InvoiceDocumentDetailModal.tsx
[09:30:08.125] 113:9  Warning: 'getPhaseLabel' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.125] 125:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.125] 132:14  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.125] 139:14  Error: 'RotateCcw' is not defined.  react/jsx-no-undef
[09:30:08.125] 146:14  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.125] 324:16  Error: 'DollarSign' is not defined.  react/jsx-no-undef
[09:30:08.125] 334:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.125] 391:26  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.125] 418:28  Error: 'Edit2' is not defined.  react/jsx-no-undef
[09:30:08.125] 464:20  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.125] 475:22  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.125] 506:26  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.125] 514:26  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.125] 535:22  Error: 'Users' is not defined.  react/jsx-no-undef
[09:30:08.125] 539:22  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.125] 543:22  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.126] 
[09:30:08.126] ./components/admin/documents/InvoiceDocumentUploadModal.tsx
[09:30:08.126] 76:6  Warning: React Hook React.useEffect has a missing dependency: 'fetchOrganizations'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.126] 202:23  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.126] 206:21  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.126] 208:27  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.126] 227:20  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.126] 228:28  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.126] 229:20  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.126] 230:20  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.126] 276:16  Error: 'DollarSign' is not defined.  react/jsx-no-undef
[09:30:08.126] 283:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.126] 290:16  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.126] 458:24  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.126] 468:24  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.126] 
[09:30:08.126] ./components/admin/documents/InvoiceDocumentsManagement.tsx
[09:30:08.126] 215:9  Warning: 'getPhaseLabel' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.126] 288:6  Warning: React Hook useEffect has missing dependencies: 'fetchSites' and 'fetchUserRole'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.126] 292:6  Warning: React Hook useEffect has a missing dependency: 'fetchDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.126] 302:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.126] 316:14  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.126] 370:14  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.126] 378:14  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.126] 410:14  Error: 'DollarSign' is not defined.  react/jsx-no-undef
[09:30:08.126] 449:26  Error: 'DollarSign' is not defined.  react/jsx-no-undef
[09:30:08.126] 511:28  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.126] 518:28  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.126] 525:28  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.126] 
[09:30:08.126] ./components/admin/documents/MarkupDocumentDetail.tsx
[09:30:08.126] 183:6  Warning: React Hook useEffect has missing dependencies: 'fetchDocument' and 'fetchSites'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.126] 219:16  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:08.126] 264:20  Error: 'Edit2' is not defined.  react/jsx-no-undef
[09:30:08.126] 271:20  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.126] 278:20  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.126] 285:20  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.126] 299:18  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.126] 304:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.126] 312:24  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.126] 329:22  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.126] 339:22  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.126] 346:22  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.126] 368:18  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.126] 411:18  Error: 'MapPin' is not defined.  react/jsx-no-undef
[09:30:08.126] 440:18  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.126] 462:18  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.126] 
[09:30:08.126] ./components/admin/documents/MarkupDocumentVersionModal.tsx
[09:30:08.126] 157:6  Warning: React Hook useEffect has missing dependencies: 'fetchHistory' and 'fetchVersions'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.126] 176:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.126] 190:16  Error: 'GitBranch' is not defined.  react/jsx-no-undef
[09:30:08.126] 201:16  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.126] 260:36  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.126] 264:36  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.127] 268:36  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.127] 280:34  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.127] 288:36  Error: 'RotateCcw' is not defined.  react/jsx-no-undef
[09:30:08.127] 327:34  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.127] 331:34  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.127] 335:34  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.127] 347:32  Error: 'RotateCcw' is not defined.  react/jsx-no-undef
[09:30:08.127] 
[09:30:08.127] ./components/admin/documents/MarkupDocumentsManagement.tsx
[09:30:08.127] 171:6  Warning: React Hook useEffect has a missing dependency: 'fetchSites'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.127] 175:6  Warning: React Hook useEffect has a missing dependency: 'fetchDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.127] 185:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.127] 199:14  Error: 'Building2' is not defined.  react/jsx-no-undef
[09:30:08.127] 221:14  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.127] 229:14  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.127] 261:14  Error: 'Edit3' is not defined.  react/jsx-no-undef
[09:30:08.127] 302:29  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.127] 308:30  Error: 'Edit3' is not defined.  react/jsx-no-undef
[09:30:08.127] 385:28  Error: 'PenTool' is not defined.  react/jsx-no-undef
[09:30:08.127] 392:28  Error: 'GitBranch' is not defined.  react/jsx-no-undef
[09:30:08.127] 399:28  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.127] 406:28  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.127] 
[09:30:08.127] ./components/admin/documents/MyDocumentsManagement.tsx
[09:30:08.127] 126:6  Warning: React Hook useEffect has a missing dependency: 'fetchDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.127] 136:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.127] 150:14  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.127] 168:14  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.127] 195:14  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.127] 272:28  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.127] 279:28  Error: 'Trash2' is not defined.  react/jsx-no-undef
[09:30:08.127] 
[09:30:08.127] ./components/admin/documents/PhotoGridDocumentsManagement.tsx
[09:30:08.127] 26:11  Warning: 'touchMode' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.127] 34:10  Warning: 'selectedDocuments' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.127] 34:29  Warning: 'setSelectedDocuments' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.127] 101:17  Warning: 'printWindow' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.127] 132:10  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.127] 133:12  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.127] 140:8  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.127] 143:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.127] 144:14  Error: 'Input' is not defined.  react/jsx-no-undef
[09:30:08.127] 163:14  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.127] 164:16  Error: 'Filter' is not defined.  react/jsx-no-undef
[09:30:08.127] 173:18  Error: 'Grid3x3' is not defined.  react/jsx-no-undef
[09:30:08.127] 179:18  Error: 'List' is not defined.  react/jsx-no-undef
[09:30:08.127] 192:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.127] 193:11  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
[09:30:08.127] 193:12  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:08.128] 202:14  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.128] 205:19  Warning: Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
[09:30:08.128] 211:19  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
[09:30:08.128] 211:20  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:08.128] 231:24  Error: 'Badge' is not defined.  react/jsx-no-undef
[09:30:08.128] 238:22  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.128] 239:24  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.128] 241:22  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.128] 242:24  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.128] 244:22  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.128] 245:24  Error: 'MoreVertical' is not defined.  react/jsx-no-undef
[09:30:08.128] 254:10  Error: 'Card' is not defined.  react/jsx-no-undef
[09:30:08.128] 285:27  Warning: Image elements must have an alt prop, either with meaningful text, or an empty string for decorative images.  jsx-a11y/alt-text
[09:30:08.128] 285:28  Error: 'Image' is not defined.  react/jsx-no-undef
[09:30:08.128] 311:26  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.128] 312:28  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.128] 314:26  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.128] 315:28  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.128] 317:26  Error: 'Button' is not defined.  react/jsx-no-undef
[09:30:08.128] 318:28  Error: 'MoreVertical' is not defined.  react/jsx-no-undef
[09:30:08.128] 
[09:30:08.128] ./components/admin/documents/RealRequiredDocumentsManagement.tsx
[09:30:08.128] 49:5  Warning: Unexpected console statement.  no-console
[09:30:08.128] 56:7  Warning: Unexpected console statement.  no-console
[09:30:08.128] 64:7  Warning: Unexpected console statement.  no-console
[09:30:08.128] 68:9  Warning: Unexpected console statement.  no-console
[09:30:08.128] 69:9  Warning: Unexpected console statement.  no-console
[09:30:08.128] 91:9  Warning: 'handleDelete' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.128] 223:10  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.128] 234:12  Error: 'FileCheck' is not defined.  react/jsx-no-undef
[09:30:08.128] 244:12  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.128] 283:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.128] 322:12  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.128] 388:28  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.128] 405:28  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.128] 
[09:30:08.128] ./components/admin/documents/RequiredDocumentDetailModal.tsx
[09:30:08.128] 88:6  Warning: React Hook useEffect has a missing dependency: 'fetchDocument'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.128] 271:18  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.128] 279:18  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.128] 287:18  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.128] 295:18  Error: 'AlertTriangle' is not defined.  react/jsx-no-undef
[09:30:08.128] 303:18  Error: 'Clock' is not defined.  react/jsx-no-undef
[09:30:08.128] 345:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.128] 353:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.128] 465:20  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.128] 504:22  Error: 'Edit2' is not defined.  react/jsx-no-undef
[09:30:08.128] 549:18  Error: 'Edit2' is not defined.  react/jsx-no-undef
[09:30:08.128] 568:20  Error: 'Save' is not defined.  react/jsx-no-undef
[09:30:08.128] 
[09:30:08.128] ./components/admin/documents/RequiredDocumentTypeDetailPage.tsx
[09:30:08.128] 58:6  Warning: React Hook useEffect has a missing dependency: 'fetchDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.128] 221:10  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.128] 236:14  Error: 'ArrowLeft' is not defined.  react/jsx-no-undef
[09:30:08.128] 240:14  Error: 'FileCheck' is not defined.  react/jsx-no-undef
[09:30:08.128] 251:12  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.128] 290:14  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.128] 318:12  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.128] 370:28  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.128] 396:28  Error: 'Calendar' is not defined.  react/jsx-no-undef
[09:30:08.128] 407:30  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.128] 416:34  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.128] 426:34  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.128] 435:30  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.128] 492:18  Error: 'XCircle' is not defined.  react/jsx-no-undef
[09:30:08.128] 496:16  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.128] 504:18  Error: 'Download' is not defined.  react/jsx-no-undef
[09:30:08.128] 
[09:30:08.129] ./components/admin/documents/RequiredDocumentTypesAdmin.tsx
[09:30:08.129] 184:12  Error: 'Plus' is not defined.  react/jsx-no-undef
[09:30:08.129] 225:24  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.129] 260:28  Error: 'Eye' is not defined.  react/jsx-no-undef
[09:30:08.129] 265:28  Error: 'EyeOff' is not defined.  react/jsx-no-undef
[09:30:08.129] 308:18  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.129] 
[09:30:08.129] ./components/admin/documents/RequiredDocumentUploadModal.tsx
[09:30:08.129] 60:6  Warning: React Hook useEffect has missing dependencies: 'fetchRequirements' and 'fetchUsers'. Either include them or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.129] 200:23  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.129] 204:21  Warning: 'uploadData' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.129] 206:27  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.129] 220:20  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.129] 221:20  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.129] 222:20  Warning: Forbidden non-null assertion.  @typescript-eslint/no-non-null-assertion
[09:30:08.129] 279:16  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.129] 286:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.129] 293:16  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.129] 448:24  Error: 'FileText' is not defined.  react/jsx-no-undef
[09:30:08.129] 458:24  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.129] 
[09:30:08.129] ./components/admin/documents/RequiredDocumentsManagement.tsx
[09:30:08.129] 140:9  Warning: 'handleStatusUpdate' is assigned a value but never used. Allowed unused vars must match /^_/u.  @typescript-eslint/no-unused-vars
[09:30:08.129] 203:14  Error: 'CheckCircle' is not defined.  react/jsx-no-undef
[09:30:08.129] 210:14  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.129] 218:14  Error: 'AlertCircle' is not defined.  react/jsx-no-undef
[09:30:08.129] 236:6  Warning: React Hook useEffect has a missing dependency: 'fetchDocuments'. Either include it or remove the dependency array.  react-hooks/exhaustive-deps
[09:30:08.129] 248:16  Error: 'Search' is not defined.  react/jsx-no-undef
[09:30:08.129] 262:16  Error: 'User' is not defined.  react/jsx-no-undef
[09:30:08.129] 318:16  Error: 'X' is not defined.  react/jsx-no-undef
[09:30:08.129] 326:16  Error: 'RefreshCw' is not defined.  react/jsx-no-undef
[09:30:08.129] 334:16  Error: 'Upload' is not defined.  react/jsx-no-undef
[09:30:08.129] 362:14  Error: 'FileCheck' is not defined.  react/jsx-no-undef
[09:30:08.129] 395:26  Error: 'FileCheck' is not defined.  react/jsx-no-undef
[09:30:08.129] 463:28  Error: 'Eye' is not defined.  react/jsx-no-undef