# Curriculum Access Management - Fix

**URL:** https://portal.bda-global.org/admin/curriculum/access
**Date Fixed:** 2025-12-28
**Status:** Resolved

---

## Issue Reported

The Curriculum Access Management section was not functioning:
1. Admin cannot grant access to any user
2. Neither single email nor bulk email access works
3. System does not allow entering email, saving access, or activating Learning System
4. Backend activation logic or UI input handling not connected

---

## Root Cause Analysis

The issue was caused by multiple factors:

### 1. RLS (Row Level Security) Blocking Direct Inserts
The AccessManagement page was trying to directly insert into `user_curriculum_access` table using:
```typescript
await supabase.from('user_curriculum_access').upsert(accessRecords, {...})
```
This was blocked by RLS policies since the admin client doesn't have direct insert permissions.

### 2. RPC Function Missing `exam_language` Parameter
The `auto_grant_curriculum_access` function was created before the `exam_language` column was added:
- Migration `20251228100001` added `exam_language` column to table
- Migration `20251228100001` changed unique constraint from `(user_id, certification_type)` to `(user_id, certification_type, exam_language)`
- But the RPC function wasn't updated to support this

### 3. ON CONFLICT Clause Mismatch
The old function used:
```sql
ON CONFLICT (user_id, certification_type)
```
But the constraint was changed to:
```sql
UNIQUE (user_id, certification_type, exam_language)
```

---

## Fixes Applied

### 1. New Database Migration

**File:** `supabase/migrations/20251228120001_fix_curriculum_access_function_with_language.sql`

#### Updated `auto_grant_curriculum_access` Function
Added `p_exam_language` parameter:
```sql
CREATE OR REPLACE FUNCTION public.auto_grant_curriculum_access(
    p_user_id UUID,
    p_certification_type TEXT,
    p_woocommerce_order_id INTEGER DEFAULT NULL,
    p_woocommerce_product_id INTEGER DEFAULT NULL,
    p_purchased_at TIMESTAMPTZ DEFAULT NOW(),
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_exam_language TEXT DEFAULT 'en'  -- NEW PARAMETER
)
```

Updated ON CONFLICT to match new constraint:
```sql
ON CONFLICT (user_id, certification_type, exam_language)
```

#### New `admin_grant_curriculum_access` Function
Created a dedicated admin function that:
- Takes user email instead of user_id
- Looks up user by email
- Uses SECURITY DEFINER to bypass RLS
- Returns success/error status in JSONB

```sql
CREATE OR REPLACE FUNCTION public.admin_grant_curriculum_access(
    p_user_email TEXT,
    p_certification_type TEXT,
    p_exam_language TEXT DEFAULT 'en',
    p_duration_months INTEGER DEFAULT 12
)
RETURNS JSONB
```

### 2. Updated AccessManagement.tsx

**File:** `client/src/features/curriculum/admin/pages/AccessManagement.tsx`

Changed from direct table insert to using RPC function:

```typescript
// Before - Direct insert (blocked by RLS)
await supabase.from('user_curriculum_access').upsert(accessRecords, {...})

// After - Using RPC function (bypasses RLS)
await supabase.rpc('admin_grant_curriculum_access', {
  p_user_email: email,
  p_certification_type: grantFormData.certificationType.toLowerCase(),
  p_exam_language: grantFormData.examLanguage,
  p_duration_months: grantFormData.durationMonths,
});
```

Added partial success handling for bulk operations:
```typescript
if (result.failedEmails && result.failedEmails.length > 0) {
  toast.warning(texts.accessGrantedPartial...);
} else {
  toast.success(texts.accessGrantedSuccess...);
}
```

### 3. Added Translation Keys

Added new translation for partial success:
```typescript
accessGrantedPartial: 'Access granted to {count} of {total} users. Failed: {failed}',
// Arabic:
accessGrantedPartial: 'تم منح الوصول لـ {count} من {total} مستخدمين. فشل: {failed}',
```

---

## Files Modified/Created

| File | Type | Changes |
|------|------|---------|
| `supabase/migrations/20251228120001_fix_curriculum_access_function_with_language.sql` | **New** | Updated RPC function + new admin function |
| `client/src/features/curriculum/admin/pages/AccessManagement.tsx` | Modified | Use RPC function, add partial success handling |

---

## How the Fix Works

### Grant Access Flow (Fixed)

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin enters emails: user1@example.com, user2@example.com       │
│ Selects: CP certification, English, 12 months                   │
│ Clicks "Grant Access"                                           │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ For each email, call RPC:                                        │
│                                                                  │
│   supabase.rpc('admin_grant_curriculum_access', {               │
│     p_user_email: 'user1@example.com',                          │
│     p_certification_type: 'cp',                                  │
│     p_exam_language: 'en',                                       │
│     p_duration_months: 12                                        │
│   })                                                             │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ RPC Function (SECURITY DEFINER - bypasses RLS):                  │
│                                                                  │
│ 1. Look up user by email in users table                          │
│ 2. If not found, return { success: false, error: 'Not found' }  │
│ 3. Calculate expires_at = NOW() + duration_months               │
│ 4. UPSERT into user_curriculum_access                            │
│ 5. Return { success: true, access: {...} }                       │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Results aggregated:                                              │
│                                                                  │
│ - successCount = 2                                               │
│ - failedEmails = []                                              │
│                                                                  │
│ Show toast: "Access granted to 2 user(s) for 12 months"          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Open Admin → Curriculum → Access Management
- [ ] Click "Grant Access" button
- [ ] Enter a valid user email (e.g., info@bda-global.org)
- [ ] Select certification type (CP or SCP)
- [ ] Select exam language (English or Arabic)
- [ ] Set duration (months)
- [ ] Click "Grant Access" in modal
- [ ] Verify success toast appears
- [ ] Verify new access record appears in table
- [ ] Test with multiple emails (comma or newline separated)
- [ ] Test with invalid email (should show partial success)
- [ ] Verify Activate/Deactivate buttons work
- [ ] Verify +1 Year extension button works

---

## Database Changes Required

After deploying, run the migration:
```bash
npx supabase db push
```

Or manually apply:
```sql
-- See: supabase/migrations/20251228120001_fix_curriculum_access_function_with_language.sql
```

---

## Notes

1. The RPC function uses `SECURITY DEFINER` to bypass RLS
2. All type casting is done server-side (lowercase for enums)
3. The function handles both new inserts and updates (upsert)
4. Failed emails are reported but don't block successful ones
5. TypeScript compilation verified successful
