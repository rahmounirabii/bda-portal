# Exam Vouchers - Bulk Issuance Fix

**URL:** https://portal.bda-global.org/admin/vouchers
**Date Fixed:** 2025-12-28
**Status:** Resolved

---

## Issue Reported

The Exam Vouchers section bulk issuance was not working:
1. Single user voucher issuance worked correctly
2. Bulk voucher issuance (multiple emails) was not available/working
3. No feedback on which emails failed and why

---

## Root Cause Analysis

The bulk issuance UI and service existed but had issues:

### 1. Case-Sensitive Email Lookup
The original code used:
```typescript
const { data: users } = await supabase
  .from('users')
  .select('id, email')
  .in('email', emailList);  // Case-sensitive match!
```

If admin entered "User@Example.com" but database had "user@example.com", the lookup failed.

### 2. Silent Failures for Missing Users
Emails not found in the system were silently ignored. The admin had no way to know which emails didn't have accounts.

### 3. Date Format Issues
The `datetime-local` input provides dates in format "2025-12-31T12:00" which wasn't being properly converted to ISO format for the database.

### 4. No Detailed Error Messages
When vouchers failed to create, the admin only saw a count, not which specific emails failed or why.

---

## Fixes Applied

### 1. Case-Insensitive Email Lookup

**File:** `client/src/entities/quiz/voucher.service.ts`

Changed from batch lookup to individual case-insensitive lookups:

```typescript
// Before - case-sensitive batch lookup
const { data: users } = await supabase
  .from('users')
  .select('id, email')
  .in('email', emailList);

// After - case-insensitive individual lookup
for (const email of emailList) {
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .ilike('email', email)  // Case-insensitive!
    .limit(1);

  if (!users || users.length === 0) {
    results.failed.push({
      email,
      error: 'User not found - must create account first',
    });
    continue;
  }
  // ... create voucher
}
```

### 2. Email Normalization

Emails are now normalized to lowercase before processing:

```typescript
const emailList = params.emails
  .split(/[,\n]/)
  .map((e) => e.trim().toLowerCase())
  .filter((e) => e && e.includes('@'));
```

### 3. Proper Date Formatting

Added validation and conversion for expiration date:

```typescript
// Ensure expires_at is a valid ISO string
let expiresAtISO: string;
try {
  const expiresDate = new Date(params.expires_at);
  if (isNaN(expiresDate.getTime())) {
    throw new Error('Invalid date');
  }
  expiresAtISO = expiresDate.toISOString();
} catch {
  return {
    data: null,
    error: {
      code: 'INVALID_DATE',
      message: 'Invalid expiration date format',
    },
  };
}
```

### 4. Detailed Error Feedback

**File:** `client/pages/admin/Vouchers.tsx`

Added detailed toast notifications showing which emails failed and why:

```tsx
toast({
  title: result.created > 0 ? texts.success : texts.failed,
  description: (
    <div className="space-y-2">
      <p>{successMsg}</p>
      <p className="text-amber-600 font-medium">
        {texts.failedEmails.replace('{count}', String(result.failed.length))}
      </p>
      <ul className="text-sm text-gray-600 list-disc list-inside max-h-32 overflow-y-auto">
        {result.failed.map((f, i) => (
          <li key={i}>
            <span className="font-mono">{f.email}</span>: {f.error}
          </li>
        ))}
      </ul>
    </div>
  ),
  variant: result.created > 0 ? 'default' : 'destructive',
  duration: 10000,
});
```

---

## Files Modified

| File | Changes |
|------|---------|
| `client/src/entities/quiz/voucher.service.ts` | Fixed email lookup, date formatting, detailed error tracking |
| `client/pages/admin/Vouchers.tsx` | Added detailed error feedback, new translation keys |

---

## How Bulk Issuance Now Works

```
┌─────────────────────────────────────────────────────────────────┐
│ Admin enters emails:                                             │
│ user1@example.com                                               │
│ User2@Example.COM                                               │
│ nonexistent@email.com                                           │
│                                                                  │
│ Selects: CP certification, English, expires 2025-12-31          │
│ Clicks "Issue Vouchers"                                          │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ For each email:                                                  │
│                                                                  │
│ 1. user1@example.com                                            │
│    → ilike lookup → Found user → Create voucher ✓               │
│                                                                  │
│ 2. user2@example.com (normalized)                               │
│    → ilike lookup → Found user → Create voucher ✓               │
│                                                                  │
│ 3. nonexistent@email.com                                        │
│    → ilike lookup → Not found → Add to failed list              │
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│ Toast notification shows:                                        │
│                                                                  │
│ ✓ Success                                                        │
│   2 voucher(s) created successfully                              │
│   1 failed                                                       │
│   • nonexistent@email.com: User not found - must create account │
└─────────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

- [ ] Open Admin → Vouchers
- [ ] Click "Bulk Issue" button
- [ ] Enter multiple emails (comma or newline separated)
- [ ] Include at least one email that doesn't exist in system
- [ ] Select certification type (CP/SCP)
- [ ] Select exam language (EN/AR)
- [ ] Select expiration date
- [ ] Click "Issue Vouchers"
- [ ] Verify success toast shows count of created vouchers
- [ ] Verify failed emails are listed with reasons
- [ ] Verify created vouchers appear in the list
- [ ] Test with mixed case emails (e.g., User@Example.COM)
- [ ] Test with duplicate emails (should create only one)

---

## Translation Keys Added

```typescript
// English
failedEmails: '{count} failed',
failedDetails: 'Failed emails: {details}',
userNotFoundBulk: 'User not found',

// Arabic
failedEmails: 'فشل {count}',
failedDetails: 'البريد الإلكتروني الفاشل: {details}',
userNotFoundBulk: 'المستخدم غير موجود',
```

---

## Notes

1. TypeScript compilation verified successful
2. The bulk issuance processes emails sequentially to provide accurate feedback
3. Case-insensitive lookup uses PostgreSQL's `ilike` operator
4. Toast notification shows for 10 seconds when there are failures
5. Modal closes only if at least one voucher was created successfully
