# Learning System Implementation - Language-Based Access (EN/AR)

## Overview

Successfully implemented language-based Learning System access architecture, replacing the certification-type model with a language-based (EN/AR) model as specified in the requirements.

**Date:** December 22, 2024
**Status:** ✅ Implementation Complete - Ready for Testing

---

## What Was Implemented

### 1. Database Schema ✅

**File:** `/supabase/migrations/20241222_learning_system_products.sql`

**Created:**
- `learning_system_products` table - Manages WooCommerce product mappings for EN/AR Learning System
- Added columns to `user_curriculum_access`: `language`, `source`, `includes_question_bank`, `includes_flashcards`
- Database functions:
  - `grant_learning_system_access()` - Grants access after WooCommerce purchase
  - `check_learning_system_access()` - Checks if user has active access for a language
  - `get_user_learning_system_accesses()` - Gets all user accesses (EN and AR)
- Admin view: `admin_learning_system_access` - For admin access management

**Key Changes:**
- Changed unique constraint from `(user_id, certification_type)` to `(user_id, language)`
- Users can now have separate EN and AR access with different expiry dates
- Access includes flags for Question Bank and Flashcards

### 2. Backend - Webhook Handler ✅

**File:** `/server/routes/woocommerce-webhook.ts`

**Changes:**
- Added Learning System product processing alongside membership processing
- Fetches `learning_system_products` from database
- Calls `grant_learning_system_access` RPC function when Learning System products are purchased
- Logs successful access grants and errors to `membership_activation_logs`
- Added `logLearningSystemError()` function for error tracking

**Flow:**
```
WooCommerce Order (completed)
  → Webhook receives order
  → Checks learning_system_products table
  → Finds user by email (creates if needed)
  → Calls grant_learning_system_access(user_id, language, ...)
  → Initializes user progress
  → Logs activation
```

### 3. Frontend - Service Layer ✅

**New Files:**
- `/client/src/entities/curriculum/curriculum-access-language.service.ts`
- `/client/src/entities/curriculum/curriculum-access-language.hooks.ts`

**Exported Services:**
```typescript
LearningSystemAccessService:
  - checkAccess(userId, language) → AccessCheckResult
  - getUserAccesses(userId) → UserAccessSummary
  - getAvailableLanguages(userId) → Language[]
  - hasQuestionBankAccess(userId, language) → boolean
  - hasFlashcardsAccess(userId, language) → boolean
  - grantAccess() - Admin only
  - revokeAccess() - Admin only
  - getAllUsersWithAccess() - Admin only
```

**React Hooks:**
- `useLanguageAccess` - Check access for specific language
- `useUserAccesses` - Get all user accesses (EN/AR)
- `useAvailableLanguages` - Get languages user has access to
- `useQuestionBankAccess` - Check QB access for language
- `useFlashcardsAccess` - Check FC access for language
- `useGrantAccess` - Admin mutation
- `useRevokeAccess` - Admin mutation
- `useAdminAccessList` - Admin query

### 4. Frontend - UI Components ✅

**New Component:**
- `/client/src/features/curriculum/components/LanguageSelector.tsx`
  - Displays EN/AR tabs when user has both languages
  - Auto-hides when user has only one language
  - Handles language switching

**Updated Pages:**

#### MyCurriculum.tsx (/learning-system)
- Added language state and selection
- Uses `useUserAccesses` to determine available languages
- Uses `useLanguageAccess` to check access for selected language
- Shows language selector when user has both EN and AR
- Auto-switches to available language
- Checks language-based access before showing curriculum

#### QuestionBankDashboard.tsx (/learning-system/question-bank)
- Added language-based access checking via `useQuestionBankAccess`
- Shows access denied message if user doesn't have QB access for selected language
- Displays language selector for multi-language users
- Links to shop if no access

#### FlashcardsDashboard.tsx (/learning-system/flashcards)
- Added language-based access checking via `useFlashcardsAccess`
- Shows access denied message if user doesn't have FC access for selected language
- Displays language selector for multi-language users
- Links to shop if no access

### 5. Admin Interface ✅

**New File:** `/client/pages/admin/LearningSystemProducts.tsx`

**Features:**
- View all Learning System product mappings
- Filter by language (EN/AR), status (active/inactive), search
- Create new product mappings with:
  - WooCommerce Product ID
  - Product Name and SKU
  - Language (EN or AR)
  - Validity months
  - Question Bank access toggle
  - Flashcards access toggle
- Edit existing mappings
- Toggle active/inactive status
- Delete mappings with confirmation
- Real-time validation and error handling

---

## Architecture Summary

### Before (Certification-Type Based)
```
User → has_access(certification_type: CP/SCP) → Curriculum
                                              → Question Bank
                                              → Flashcards
```

### After (Language-Based)
```
User → purchases "Learning System - EN" from WooCommerce
     → Webhook grants access(user_id, language: EN)
     → User.access = { EN: { curriculum: ✓, QB: ✓, FC: ✓, expires: 2025-12-22 } }
     → UI shows EN content with language selector (if AR also purchased)

User → purchases "Learning System - AR"
     → User.access = {
          EN: { curriculum: ✓, QB: ✓, FC: ✓, expires: 2025-12-22 },
          AR: { curriculum: ✓, QB: ✓, FC: ✓, expires: 2026-01-15 }
        }
     → UI shows EN/AR tabs, allows switching
```

---

## Testing Checklist

### Database Setup
- [ ] Run migration: `supabase/migrations/20241222_learning_system_products.sql`
- [ ] Verify `learning_system_products` table exists
- [ ] Verify `user_curriculum_access` has new columns
- [ ] Check database functions are created

### Admin Configuration
1. **Access Admin Panel:**
   - [ ] Navigate to `/admin/learning-system-products`
   - [ ] Verify page loads without errors

2. **Create Product Mappings:**
   - [ ] Click "Add Product"
   - [ ] Create English product:
     - WooCommerce Product ID: [Your EN product ID]
     - Product Name: "BDA Learning System - English"
     - SKU: "BDA-LS-EN"
     - Language: EN
     - Validity: 12 months
     - Question Bank: ✓
     - Flashcards: ✓
   - [ ] Create Arabic product (same process, language: AR)
   - [ ] Verify both products appear in list

### Webhook Testing

#### Option 1: Manual Database Grant (Quick Test)
```sql
-- Grant EN access to a test user
SELECT grant_learning_system_access(
  '[user-id-here]'::uuid,
  'EN',
  null, -- no WC order ID
  null, -- no WC product ID
  NOW(),
  12,   -- 12 months validity
  true, -- includes QB
  true  -- includes FC
);
```

#### Option 2: WooCommerce Webhook (Full Test)
1. **Setup:**
   - [ ] Configure webhook secret in `.env`: `WOOCOMMERCE_WEBHOOK_SECRET=...`
   - [ ] Set up WooCommerce webhook pointing to: `https://your-domain/api/woocommerce/webhook`

2. **Test Purchase:**
   - [ ] Place test order in WooCommerce for EN product
   - [ ] Check webhook logs in terminal
   - [ ] Verify access granted in database:
     ```sql
     SELECT * FROM user_curriculum_access WHERE language = 'EN';
     ```
   - [ ] Check activation logs:
     ```sql
     SELECT * FROM membership_activation_logs
     WHERE action = 'learning_system_granted'
     ORDER BY created_at DESC;
     ```

### Frontend Testing

#### 1. No Access State
- [ ] Log in as user with no Learning System access
- [ ] Navigate to `/learning-system`
- [ ] Verify "Access Denied" message appears
- [ ] Navigate to `/learning-system/question-bank`
- [ ] Verify "Question Bank Access Required" message
- [ ] Navigate to `/learning-system/flashcards`
- [ ] Verify "Flashcards Access Required" message

#### 2. Single Language Access (EN only)
- [ ] Grant EN access to test user (via SQL or WC purchase)
- [ ] Log in as test user
- [ ] Navigate to `/learning-system`
- [ ] Verify curriculum loads
- [ ] Verify NO language selector appears (user has only EN)
- [ ] Navigate to `/learning-system/question-bank`
- [ ] Verify Question Bank loads
- [ ] Verify NO language selector appears
- [ ] Navigate to `/learning-system/flashcards`
- [ ] Verify Flashcards loads
- [ ] Verify NO language selector appears

#### 3. Multi-Language Access (EN + AR)
- [ ] Grant AR access to same test user
- [ ] Refresh page
- [ ] Navigate to `/learning-system`
- [ ] Verify language selector appears with EN/AR tabs
- [ ] Click AR tab, verify it switches
- [ ] Click EN tab, verify it switches back
- [ ] Navigate to `/learning-system/question-bank`
- [ ] Verify language selector appears
- [ ] Test language switching
- [ ] Navigate to `/learning-system/flashcards`
- [ ] Verify language selector appears
- [ ] Test language switching

#### 4. Selective Access (QB but not FC)
- [ ] Create product mapping with QB: ✓, FC: ✗
- [ ] Purchase this product (or grant via SQL)
- [ ] Verify curriculum loads
- [ ] Verify Question Bank loads
- [ ] Verify Flashcards shows "Access Required" message

#### 5. Expiry Testing
- [ ] Manually set `expires_at` to past date in database
- [ ] Refresh application
- [ ] Verify access denied appears
- [ ] Check that `reason` shows "expired"

### Admin Testing
- [ ] Navigate to `/admin/learning-system-products`
- [ ] Test search functionality
- [ ] Test language filter (All/EN/AR)
- [ ] Test status filter (All/Active/Inactive)
- [ ] Edit a product mapping
- [ ] Toggle product active/inactive
- [ ] Delete a product mapping (with confirmation)

---

## Files Modified/Created

### Database
- ✅ Created: `supabase/migrations/20241222_learning_system_products.sql`

### Backend
- ✅ Modified: `server/routes/woocommerce-webhook.ts`

### Frontend - Service Layer
- ✅ Created: `client/src/entities/curriculum/curriculum-access-language.service.ts`
- ✅ Created: `client/src/entities/curriculum/curriculum-access-language.hooks.ts`
- ✅ Modified: `client/src/entities/curriculum/index.ts`

### Frontend - Components
- ✅ Created: `client/src/features/curriculum/components/LanguageSelector.tsx`
- ✅ Modified: `client/src/features/curriculum/pages/MyCurriculum.tsx`
- ✅ Modified: `client/src/features/question-bank/pages/QuestionBankDashboard.tsx`
- ✅ Modified: `client/src/features/flashcards/pages/FlashcardsDashboard.tsx`

### Admin
- ✅ Created: `client/pages/admin/LearningSystemProducts.tsx`

### Documentation
- ✅ Created: `LEARNING_SYSTEM_AUDIT_FINDINGS.md` (audit report)
- ✅ Created: `LEARNING_SYSTEM_IMPLEMENTATION.md` (this file)

---

## Migration Guide

### For Existing Users
Existing users with `user_curriculum_access` records will:
1. Be backfilled with `language = 'EN'` (default)
2. Have `includes_question_bank = true`
3. Have `includes_flashcards = true`
4. Retain their existing access and expiry dates

### WooCommerce Product Setup
1. Go to WooCommerce → Products
2. Note the Product IDs for your Learning System products
3. Go to Portal Admin → Learning System Products
4. Create mappings for each product with appropriate language

Example Products:
- **BDA Learning System - English** (ID: 12345)
  - Language: EN
  - Validity: 12 months
  - QB: ✓, FC: ✓

- **BDA Learning System - Arabic** (ID: 12346)
  - Language: AR
  - Validity: 12 months
  - QB: ✓, FC: ✓

---

## Troubleshooting

### Webhook Not Working
1. Check webhook secret matches `.env` file
2. Verify webhook URL is accessible
3. Check server logs for errors
4. Test with WooCommerce webhook test tool

### User Not Getting Access
1. Check `membership_activation_logs` for errors:
   ```sql
   SELECT * FROM membership_activation_logs
   WHERE error_message IS NOT NULL
   ORDER BY created_at DESC;
   ```
2. Verify product mapping exists and is active
3. Check user exists in database
4. Verify webhook reached server

### Language Selector Not Appearing
1. Check user has access to both EN and AR
2. Verify `useUserAccesses` hook returns correct data
3. Check browser console for errors

### Access Denied Despite Having Access
1. Verify `expires_at` is in the future
2. Check `is_active = true`
3. Verify language matches selected language
4. Check browser console for hook errors

---

## Next Steps

1. **Run Database Migration**
   ```bash
   psql $DATABASE_URL < supabase/migrations/20241222_learning_system_products.sql
   ```

2. **Configure Admin Product Mappings**
   - Access `/admin/learning-system-products`
   - Add your WooCommerce products

3. **Test Complete Flow**
   - Follow testing checklist above
   - Test with real WooCommerce orders

4. **Monitor Logs**
   - Check `membership_activation_logs` for webhook activity
   - Monitor for any errors

5. **Update Documentation**
   - Update user guides if needed
   - Document product SKUs for reference

---

## Support

If issues arise:
1. Check server logs for webhook errors
2. Review database logs for RPC function errors
3. Check browser console for frontend errors
4. Review `membership_activation_logs` table for activation errors

---

**Implementation Completed:** December 22, 2024
**Ready for Testing:** ✅
