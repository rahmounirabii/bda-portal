# Learning System Audit Findings & Fix Plan
**Date:** December 22, 2024
**Audit Scope:** Learning System (Curriculum, Question Bank, Flashcards) against requirements

---

## CRITICAL FINDINGS

### ❌ ISSUE #1: Fundamental Architecture Mismatch (CRITICAL)

**Requirement:**
- Products sold by LANGUAGE: "BDA Learning System - EN" and "BDA Learning System - AR"
- Access granted by language: EN or AR
- Each language package includes: Curriculum + Question Bank + Flashcards

**Current Implementation:**
- Products mapped by CERTIFICATION TYPE: CP or SCP
- Access granted by certification_type: CP or SCP
- Content stored bilingually (EN and AR in same rows)
- User gets access to BOTH languages if they have certification type

**Impact:** 🔴 BLOCKER
- Users cannot purchase language-specific access
- No way to sell "English only" or "Arabic only" versions
- No language-based access control exists

**Evidence:**
- `user_curriculum_access` table uses `certification_type` (CP/SCP), not language (EN/AR)
- `certification_type` enum only has 'CP' and 'SCP' values
- `MyCurriculum.tsx` line 33: hardcoded to 'CP' with TODO comment

---

### ❌ ISSUE #2: No Learning System Product Mapping

**Requirement:**
- WooCommerce products: "BDA Learning System - EN" and "BDA Learning System - AR"
- Products must map to language-based access

**Current Implementation:**
- Only `membership_product_mapping` table exists (for memberships)
- Only `certification_products` table exists (for EXAM VOUCHERS, not Learning System)
- NO table or webhook handler for Learning System products

**Impact:** 🔴 BLOCKER
- Purchases of "BDA Learning System" products are NOT processed
- No access is granted when users buy Learning System
- Webhook only handles membership products

**Evidence:**
- `woocommerce-webhook.ts` only processes `membership_product_mapping`
- No `learning_system_product_mapping` or similar table exists
- `certification_products` is for exam vouchers (links to exam_vouchers table)

---

### ❌ ISSUE #3: Missing DB Schema Fields

**Requirement:**
```sql
user_id
curriculum_access = true
language = EN / AR
activated_at = timestamp
source = "store_purchase"
```

**Current Schema:**
```sql
user_id
certification_type (CP/SCP)
purchased_at
expires_at
woocommerce_order_id
woocommerce_product_id
is_active
-- MISSING: language field
-- MISSING: source field
```

**Impact:** 🟡 MAJOR
- Cannot track which language user purchased
- Cannot differentiate between auto-grant sources
- Cannot implement language-based access control

---

### ❌ ISSUE #4: No Language Separation in UI

**Requirement:**
- If user has EN access → show English version
- If user has AR access → show Arabic version
- If user has both → show tabs EN / AR

**Current Implementation:**
- Content is bilingual (shows both EN and AR in same view)
- No language selection mechanism
- Uses global language context for UI language only

**Impact:** 🟡 MAJOR
- Users who buy "English only" still see Arabic content
- No way to enforce language-based access
- Doesn't match the purchased product

---

### ❌ ISSUE #5: Question Bank & Flashcards Not Linked to Access

**Requirement:**
- Purchasing "BDA Learning System" unlocks ALL THREE:
  1. Curriculum
  2. Question Bank
  3. Flashcards

**Current Implementation:**
- Only curriculum access is checked via `user_curriculum_access`
- Question Bank has no access control implementation (needs verification)
- Flashcards have no access control implementation (needs verification)

**Impact:** 🟠 MEDIUM
- Components might not be unlocked together
- User might access one but not others
- Inconsistent with product offering

**Status:** Requires further investigation of Question Bank and Flashcards modules

---

### ❌ ISSUE #6: No Webhook Handler for Learning System

**Requirement:**
- System receives webhook when Learning System purchased
- Matches email with portal user
- Grants access based on product (EN or AR)

**Current Implementation:**
- Webhook only handles membership products
- No handler for Learning System products
- Access service uses "auto-grant" when user visits, not webhook-triggered

**Impact:** 🟡 MAJOR
- Access not granted immediately after purchase
- User must visit curriculum page to trigger auto-grant
- Doesn't meet requirement of "immediate access"

---

### ❌ ISSUE #7: Wrong Product Table Used

**Requirement:**
- Products for Learning System (not exam vouchers)

**Current Implementation:**
- `certification_products` table is for EXAM VOUCHERS
- Links to `exam_vouchers` and `exam_timeslots` tables
- Used to grant exam vouchers, not curriculum access

**Impact:** 🟡 MAJOR
- Current auto-grant logic checks wrong product table
- Will never find Learning System products
- Conflates certification exams with learning system

---

## REQUIRED FIXES

### FIX #1: Database Schema Changes

**Create new table: `learning_system_products`**
```sql
CREATE TABLE learning_system_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  woocommerce_product_id INTEGER UNIQUE NOT NULL,
  woocommerce_product_name TEXT NOT NULL,
  woocommerce_product_sku TEXT,
  language TEXT NOT NULL CHECK (language IN ('EN', 'AR')),
  includes_curriculum BOOLEAN DEFAULT true,
  includes_question_bank BOOLEAN DEFAULT true,
  includes_flashcards BOOLEAN DEFAULT true,
  validity_months INTEGER DEFAULT 12,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Modify `user_curriculum_access` table:**
```sql
ALTER TABLE user_curriculum_access
  ADD COLUMN language TEXT CHECK (language IN ('EN', 'AR'));

ALTER TABLE user_curriculum_access
  ADD COLUMN source TEXT DEFAULT 'store_purchase';

ALTER TABLE user_curriculum_access
  ADD COLUMN includes_question_bank BOOLEAN DEFAULT true;

ALTER TABLE user_curriculum_access
  ADD COLUMN includes_flashcards BOOLEAN DEFAULT true;

-- Add unique constraint for user + language
ALTER TABLE user_curriculum_access
  ADD CONSTRAINT unique_user_language UNIQUE (user_id, language);
```

### FIX #2: Webhook Handler Enhancement

**Add Learning System product handling to webhook:**
```typescript
// In woocommerce-webhook.ts

// Get Learning System product mappings
const { data: learningProducts } = await supabase
  .from('learning_system_products')
  .select('*')
  .eq('is_active', true);

const learningProductMap = new Map(
  learningProducts.map(p => [p.woocommerce_product_id.toString(), p])
);

// Process Learning System purchases
for (const item of order.line_items) {
  const learningProduct = learningProductMap.get(item.product_id.toString());

  if (learningProduct) {
    // Grant Learning System access
    await grantLearningSystemAccess({
      userId,
      language: learningProduct.language,
      orderId: order.id,
      productId: item.product_id,
      purchaseDate: order.date_created
    });
  }
}
```

### FIX #3: Access Service Updates

**Update `CurriculumAccessService`:**
- Change from `certification_type` parameter to `language` parameter
- Check `learning_system_products` instead of `certification_products`
- Support checking multiple language accesses (EN and AR)
- Return language-specific access information

### FIX #4: UI Language Tabs

**Update `MyCurriculum.tsx`:**
```typescript
// Check which languages user has access to
const { data: accessList } = await supabase
  .from('user_curriculum_access')
  .select('*')
  .eq('user_id', userId)
  .eq('is_active', true);

const hasEN = accessList.some(a => a.language === 'EN');
const hasAR = accessList.some(a => a.language === 'AR');

// Show language tabs if user has both
if (hasEN && hasAR) {
  return <CurriculumWithLanguageTabs />;
} else if (hasEN) {
  return <CurriculumDashboard language="EN" />;
} else if (hasAR) {
  return <CurriculumDashboard language="AR" />;
} else {
  return <AccessDenied />;
}
```

### FIX #5: Question Bank & Flashcards Access

**Create unified access check:**
```typescript
async function checkLearningSystemAccess(userId, language) {
  const { data } = await supabase
    .from('user_curriculum_access')
    .select('*')
    .eq('user_id', userId)
    .eq('language', language)
    .eq('is_active', true)
    .single();

  return {
    hasCurriculumAccess: !!data,
    hasQuestionBankAccess: data?.includes_question_bank ?? false,
    hasFlashcardsAccess: data?.includes_flashcards ?? false
  };
}
```

### FIX #6: Admin Management UI

**Create Learning System Product Management page:**
- Map WooCommerce products to languages
- View all users with access
- Manually grant/revoke access
- See access expiry dates

---

## MIGRATION PLAN

### Phase 1: Database (Non-breaking)
1. Create `learning_system_products` table
2. Add new columns to `user_curriculum_access`
3. Backfill existing data with language='EN' (default)

### Phase 2: Webhook (Additive)
1. Add Learning System product handling
2. Keep existing membership handling
3. Test with test products

### Phase 3: Services (Backward Compatible)
1. Update access service to support both old and new
2. Add language parameter with CP fallback
3. Test auto-grant flow

### Phase 4: UI (Feature Flag)
1. Add language tabs behind feature flag
2. Test with users who have both languages
3. Roll out gradually

### Phase 5: Cleanup
1. Remove certification_type dependencies
2. Update all hardcoded 'CP' references
3. Remove TODO comments

---

## TESTING CHECKLIST

- [ ] User purchases "BDA Learning System - EN"
- [ ] Webhook grants access with language='EN'
- [ ] User sees English-only content
- [ ] Curriculum unlocked
- [ ] Question Bank unlocked
- [ ] Flashcards unlocked
- [ ] User purchases "BDA Learning System - AR" (same user)
- [ ] User now sees EN/AR language tabs
- [ ] Can switch between languages
- [ ] Both languages show correct content
- [ ] Access expires after 1 year
- [ ] Error logging works correctly

---

## PRIORITY RATING

**P0 - CRITICAL BLOCKERS:**
- Issue #1: Architecture mismatch (prevents language-based sales)
- Issue #2: No product mapping (no purchases work)
- Issue #6: No webhook handler (no automatic access)

**P1 - MAJOR ISSUES:**
- Issue #3: Missing DB fields
- Issue #4: No language separation in UI
- Issue #7: Wrong product table

**P2 - MEDIUM ISSUES:**
- Issue #5: Component unlocking (needs verification)

---

## ESTIMATED EFFORT

- Database changes: 2-3 hours
- Webhook handler: 3-4 hours
- Service layer updates: 4-5 hours
- UI language tabs: 5-6 hours
- Question Bank/Flashcards integration: 3-4 hours (TBD)
- Testing & QA: 4-5 hours
- **Total: 21-27 hours**

---

## NEXT STEPS

1. ✅ Review and approve this audit
2. Create database migration scripts
3. Implement webhook handler
4. Update access services
5. Build UI language selection
6. Comprehensive testing
7. Production deployment
