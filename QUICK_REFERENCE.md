# Quick Reference - New Features

## 🎯 Two New Features Implemented

### 1. 🎫 Bulk Voucher Issuance
**What:** Issue exam vouchers to multiple users at once
**Who:** Admins & Super Admins only
**Where:**
- Main page: https://portal.bda-global.org/admin/vouchers
- Customer page: https://portal.bda-global.org/admin/customers-vouchers

**How to Use:**
1. Click "Bulk Issue" button
2. Paste emails (comma or newline separated)
3. Select CP or SCP certification
4. Set expiration date
5. Click "Issue Vouchers"

**Example Input:**
```
john@example.com, jane@example.com
alice@example.com
bob@example.com
```

---

### 2. ⏱️ Auto-Logout After Inactivity
**What:** Automatically logs out inactive users
**Who:** ALL users (Admin, Individual, ECP, PDP, Super Admin)
**When:** After 30 minutes of inactivity
**Warning:** At 28 minutes (2 minutes before logout)

**What Counts as Activity:**
- Moving mouse
- Clicking anything
- Pressing keyboard keys
- Scrolling
- Navigating pages

---

## 🚀 Quick Test

### Test Bulk Vouchers (2 minutes):
1. Login as Admin
2. Go to `/admin/vouchers`
3. Click "Bulk Issue"
4. Enter your email
5. Set expiration: tomorrow
6. Submit
7. ✅ Should see success message

### Test Auto-Logout (For Quick Test - Modify Code First):

**⚠️ For Testing Only - Reduce Timeout:**

Edit: `client/src/services/session-manager.service.ts`

Lines 46-47, change to:
```typescript
private readonly INACTIVITY_TIMEOUT = 2 * 60 * 1000;           // 2 min for testing
private readonly INACTIVITY_WARNING_BEFORE = 1 * 60 * 1000;   // 1 min warning
```

**Test:**
1. Login
2. Don't touch anything for 1 minute
3. ✅ Should see "Inactivity Warning"
4. Wait 1 more minute
5. ✅ Should auto-logout and redirect to login

**⚠️ IMPORTANT: Revert back to 30 minutes after testing!**

---

## 📊 Status

| Feature | Status | Tested |
|---------|--------|--------|
| TypeScript Compilation | ✅ PASS | Yes |
| Bulk Vouchers - Admin Access | ✅ READY | Needs manual test |
| Bulk Vouchers - Non-Admin Block | ✅ READY | Needs manual test |
| Auto-Logout - All Profiles | ✅ READY | Needs manual test |
| UI Consistency | ✅ VERIFIED | Yes |
| Security | ✅ VERIFIED | Yes |

---

## 📁 Files Changed

### Core Implementation:
- `client/src/entities/quiz/voucher.service.ts` (+125 lines)
- `client/src/entities/quiz/voucher.hooks.ts` (+28 lines)
- `client/src/services/session-manager.service.ts` (+110 lines)
- `client/src/shared/hooks/useSessionExpiry.ts` (+30 lines)

### UI Implementation:
- `client/pages/admin/Vouchers.tsx` (+130 lines)
- `client/pages/admin/CustomersVouchers.tsx` (+118 lines)

**Total:** ~541 lines of new code

---

## 🔧 Configuration

### Inactivity Timeout:
**File:** `client/src/services/session-manager.service.ts`
**Lines:** 46-47

```typescript
private readonly INACTIVITY_TIMEOUT = 30 * 60 * 1000;          // 30 minutes
private readonly INACTIVITY_WARNING_BEFORE = 2 * 60 * 1000;   // 2 minutes
```

### To Change Timeout:
1. Edit the numbers above (in milliseconds)
2. Run `npm run typecheck`
3. Rebuild: `npm run build`
4. Deploy

**Common Values:**
- 15 minutes = `15 * 60 * 1000`
- 30 minutes = `30 * 60 * 1000` (current)
- 60 minutes = `60 * 60 * 1000`

---

## 🎨 UI Consistency

### Both Bulk Voucher Pages:
- ✅ Same modal design
- ✅ Same form fields
- ✅ Same validation
- ✅ Same error messages
- ✅ Same success messages

### All User Profiles (Auto-Logout):
- ✅ Same 30-minute timeout
- ✅ Same warning message
- ✅ Same logout behavior
- ✅ Same activity tracking

---

## 🐛 Troubleshooting

### Bulk Vouchers Not Working?
1. Check: Are you logged in as Admin?
2. Check: Do the users exist in the system?
3. Check: Is the expiration date in the future?
4. Check: Browser console for errors

### Auto-Logout Not Working?
1. Check: Are you actually inactive? (even mouse movements reset timer)
2. Check: Browser console for `[SessionManager]` logs
3. Check: Are you logged in? (public pages don't have auto-logout)
4. Check: Try in incognito mode (extensions may cause activity)

### Not Seeing Warning Toast?
1. Check: Toast notifications enabled in browser
2. Check: You have `useToast` working on other pages
3. Check: Console for JavaScript errors

---

## 📞 Need Help?

**Documentation:**
- Full test plan: `FEATURE_TEST_PLAN.md`
- Validation summary: `VALIDATION_SUMMARY.md`
- This reference: `QUICK_REFERENCE.md`

**Debug Logs:**
- Open browser console
- Look for `[SessionManager]` logs
- Look for `[useSessionExpiry]` logs

**Common Issues:**
1. "User not found" → User needs to create portal account first
2. "Permission denied" → Check admin role assignment
3. "Timeout too short/long" → Edit session-manager.service.ts

---

## ✅ Ready to Deploy

Both features are:
- ✅ Implemented
- ✅ Type-safe (TypeScript passes)
- ✅ Consistent across all profiles
- ✅ Documented
- ✅ Ready for manual testing

**Next Step:** Manual testing by QA team or stakeholders

---

**Last Updated:** 2025-12-23
**Version:** 1.0.0
