# Development Authentication Bypass Guide

## 🎯 Purpose

This guide explains how to bypass authentication during development for UI/UX testing while login functionality is being debugged in another session.

## ✅ Setup Completed

### 1. Environment Variable Configuration

```bash
# .env.local
NEXT_PUBLIC_DEV_AUTH_BYPASS=true
```

### 2. Mock Data

Mock user and profile data has been created in `/lib/dev-auth.ts`:

- Email: developer@inopnc.com
- Role: site_manager
- Name: 개발자 테스트

### 3. System Integration

The bypass has been integrated at multiple levels:

- ✅ Middleware (`/middleware.ts`)
- ✅ Auth Provider (`/providers/auth-provider.tsx`)
- ✅ Auth Hooks (`/hooks/use-auth.ts`)
- ✅ Server Components (`/app/mobile/page.tsx`)
- ✅ Dev Auth Provider (`/components/providers/dev-auth-provider.tsx`)

## 📱 Accessible Routes (Without Login)

### Mobile Pages ✅

- `/mobile` - Mobile dashboard home
- `/mobile/attendance` - Attendance/output information
- `/mobile/worklog` - Work logs
- `/mobile/sites` - Site information
- `/mobile/documents` - Document management
- `/mobile/notifications` - Notifications
- `/mobile/markup-tool` - Markup tool

### Admin Pages (Still require auth)

- `/dashboard/admin` - Admin pages still redirect to login
- This is intentional as mobile pages are the focus for UI/UX development

## 🚀 How to Use

1. **Start Development Server**

   ```bash
   npm run dev
   ```

2. **Access Pages Directly**
   - Open http://localhost:3000/mobile
   - All mobile pages are now accessible without login
   - You'll see "🔓 [DEV]" messages in console indicating bypass is active

3. **Test UI/UX**
   - Navigate freely between mobile pages
   - Test components and layouts
   - Improve UI/UX without authentication interruptions

## 🔍 Verification

Run the test script to verify all routes:

```bash
node test-dev-bypass.js
```

Expected output:

```
/mobile                        [200] ✅ OK
/mobile/attendance             [200] ✅ OK
/mobile/worklog                [200] ✅ OK
/mobile/sites                  [200] ✅ OK
/mobile/documents              [200] ✅ OK
/mobile/notifications          [200] ✅ OK
/mobile/markup-tool            [200] ✅ OK
```

## 🔒 Security Notes

- **Development Only**: This bypass ONLY works when `NODE_ENV=development`
- **Explicit Flag Required**: Must set `NEXT_PUBLIC_DEV_AUTH_BYPASS=true`
- **No Production Risk**: Will not work in production builds
- **Console Indicators**: All bypass activities are logged with 🔓 emoji

## 🛠️ Disabling the Bypass

To disable the bypass and return to normal authentication:

1. **Remove or set to false in `.env.local`:**

   ```bash
   # NEXT_PUBLIC_DEV_AUTH_BYPASS=true
   # or
   NEXT_PUBLIC_DEV_AUTH_BYPASS=false
   ```

2. **Restart the development server**

## 📝 Technical Details

### Mock User Object

```typescript
{
  id: 'dev-user-001',
  email: 'developer@inopnc.com',
  role: 'site_manager',
  full_name: '개발자 테스트'
}
```

### Files Modified

- `.env.local` - Environment variable
- `/lib/dev-auth.ts` - Mock data and bypass check function
- `/middleware.ts` - Skip auth checks when bypass enabled
- `/providers/auth-provider.tsx` - Use mock data when bypass enabled
- `/hooks/use-auth.ts` - Return mock user and profile
- `/app/mobile/page.tsx` - Server component bypass check
- `/components/providers/dev-auth-provider.tsx` - Dev auth context

## 🎉 Status

✅ **WORKING** - All mobile pages are accessible without authentication for UI/UX development!
