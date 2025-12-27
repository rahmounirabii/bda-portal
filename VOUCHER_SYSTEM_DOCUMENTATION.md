# BDA Certification Voucher System Documentation

**Document Version**: 1.1
**Last Updated**: November 26, 2025
**Author**: Development Team
**Status**: ✅ TESTED & WORKING

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Database Schema](#2-database-schema)
3. [Production Flow](#3-production-flow)
4. [WooCommerce Integration](#4-woocommerce-integration)
5. [Frontend Implementation](#5-frontend-implementation)
6. [Production Readiness Checklist](#6-production-readiness-checklist)
7. [Testing Guide](#7-testing-guide)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. System Overview

The BDA Certification Voucher System manages exam access through a voucher-based model:

- **Users purchase certification products** on WooCommerce store
- **Vouchers are auto-generated** when orders complete
- **Users schedule and take exams** using their vouchers
- **Certificates are issued** upon passing

### Key Business Rules

| Rule | Description |
|------|-------------|
| One voucher per attempt | Each exam attempt consumes one voucher |
| User must exist first | Portal account required BEFORE purchase |
| Wildcard vouchers | Voucher can be for specific exam OR any exam of that type |
| Auto-expiration | Vouchers expire after configured period (default: 6 months) |
| Refund handling | Only unused vouchers are revoked on refund |

---

## 2. Database Schema

### 2.1 certification_products Table

Maps WooCommerce products to certification types.

```sql
CREATE TABLE certification_products (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  woocommerce_product_id   INTEGER UNIQUE NOT NULL,
  woocommerce_product_name TEXT NOT NULL,
  woocommerce_product_sku  TEXT,
  certification_type       certification_type NOT NULL, -- 'CP' or 'SCP'
  quiz_id                  UUID REFERENCES quizzes(id),  -- NULL = any exam of type
  vouchers_per_purchase    INTEGER DEFAULT 1,
  voucher_validity_months  INTEGER DEFAULT 6,
  is_active                BOOLEAN DEFAULT true,
  created_by               UUID REFERENCES users(id),
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 exam_vouchers Table

Individual vouchers assigned to users.

```sql
CREATE TABLE exam_vouchers (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                     TEXT UNIQUE NOT NULL,        -- e.g., "CERT-CP-A1B2C3D4"
  user_id                  UUID NOT NULL REFERENCES users(id),
  certification_type       certification_type NOT NULL,
  quiz_id                  UUID REFERENCES quizzes(id), -- NULL = wildcard
  woocommerce_order_id     INTEGER,
  certification_product_id UUID REFERENCES certification_products(id),
  purchased_at             TIMESTAMPTZ,
  status                   voucher_status DEFAULT 'unused', -- unused/used/expired/revoked
  expires_at               TIMESTAMPTZ NOT NULL,
  used_at                  TIMESTAMPTZ,
  attempt_id               UUID REFERENCES quiz_attempts(id),
  admin_notes              TEXT,
  created_by               UUID REFERENCES users(id),
  created_at               TIMESTAMPTZ DEFAULT now(),
  updated_at               TIMESTAMPTZ DEFAULT now()
);
```

### 2.3 Voucher Status Enum

```sql
CREATE TYPE voucher_status AS ENUM ('unused', 'used', 'expired', 'revoked');
```

| Status | Description |
|--------|-------------|
| `unused` | Available for use |
| `used` | Consumed by exam attempt |
| `expired` | Past expiration date |
| `revoked` | Cancelled (e.g., refund) |

### 2.4 Voucher Code Generation Function

```sql
CREATE OR REPLACE FUNCTION generate_voucher_code(cert_type certification_type)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate: CERT-CP-XXXXXXXX (8 random hex chars)
    new_code := 'CERT-' || cert_type || '-' ||
                upper(substr(md5(random()::text), 1, 8));

    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM exam_vouchers WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  RETURN new_code;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. Production Flow

### 3.1 Complete User Journey

```
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: ADMIN SETUP (One-time)                                 │
│                                                                 │
│  • Create WooCommerce product for certification exam            │
│  • Add mapping in certification_products table                  │
│  • Link WooCommerce product ID → certification type             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: USER CREATES PORTAL ACCOUNT                            │
│                                                                 │
│  URL: https://portal.bda-association.com/signup                 │
│  IMPORTANT: Account must exist BEFORE purchasing!               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: USER PURCHASES ON WOOCOMMERCE                          │
│                                                                 │
│  URL: https://bda-association.com/shop                          │
│  • User adds certification product to cart                      │
│  • Completes checkout with SAME EMAIL as Portal account         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: AUTOMATIC VOUCHER GENERATION                           │
│                                                                 │
│  Trigger: woocommerce_order_status_completed                    │
│  Handler: VoucherAutomationController.php                       │
│                                                                 │
│  Process:                                                       │
│  1. Lookup user by email in Portal database                     │
│  2. Load certification_products configuration                   │
│  3. Match order items to certification products                 │
│  4. Generate voucher code via generate_voucher_code()           │
│  5. Insert into exam_vouchers (status='unused')                 │
│  6. Add order note with voucher details                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 5: USER SEES "SCHEDULE EXAM" IN PORTAL                    │
│                                                                 │
│  URL: https://portal.bda-association.com/certification-exams    │
│  • Badge shows "Has Voucher"                                    │
│  • Button changes from "Purchase Voucher" → "Schedule Exam"     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 6: USER SCHEDULES EXAM                                    │
│                                                                 │
│  • Select date and time slot                                    │
│  • Confirm booking                                              │
│  • Receive confirmation email                                   │
│  • Status changes to "Scheduled"                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 7: USER TAKES EXAM (At Scheduled Time)                    │
│                                                                 │
│  • 15 minutes before: Status changes to "Ready"                 │
│  • Click "Launch Exam Now"                                      │
│  • Complete pre-exam checklist                                  │
│  • Voucher marked as 'used' when exam starts                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 8: CERTIFICATE ISSUED (If Passed)                         │
│                                                                 │
│  • Auto-generated credential ID: CP-2025-XXXX                   │
│  • PDF certificate available for download                       │
│  • Public verification link provided                            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 User Status Flow in Portal

| Status | Badge Color | Button | Description |
|--------|-------------|--------|-------------|
| `no_voucher` | Gray | "Purchase Voucher" | User has no valid voucher |
| `has_voucher` | Orange | "Schedule Exam" | User has unused voucher |
| `scheduled` | Yellow | "Waiting for Exam Time" | Exam booked, not yet time |
| `ready` | Green (pulsing) | "Launch Exam Now" | Within 15 min of start time |
| `certified` | Blue | "Already Certified" | User already passed |

---

## 4. WooCommerce Integration

### 4.1 Webhook Handler

**File**: `public_html/wp-content/themes/jupiterx/inc/api/controllers/VoucherAutomationController.php`

```php
class VoucherAutomationController {

    public function __construct() {
        // Hook into WooCommerce order status changes
        add_action('woocommerce_order_status_completed', [$this, 'handle_order_completed']);
        add_action('woocommerce_order_status_refunded', [$this, 'handle_order_refunded']);
    }

    public function handle_order_completed($order_id) {
        // 1. Get customer email from order
        // 2. Lookup user in Portal by email
        // 3. If not found → STOP (add order note)
        // 4. Load certification_products config
        // 5. For each order item:
        //    - Match to certification product
        //    - Check idempotency (prevent duplicates)
        //    - Generate voucher code
        //    - Insert into exam_vouchers
        // 6. Add order note with results
    }

    public function handle_order_refunded($order_id) {
        // 1. Find unused vouchers for this order
        // 2. Update status to 'revoked'
        // 3. Add order note
    }
}
```

### 4.2 Required Configuration (wp-config.php)

WordPress must have Supabase credentials configured in `wp-config.php`:

```php
// For LOCAL Docker environment (use Docker bridge gateway to reach host)
define('SUPABASE_URL', 'http://172.17.0.1:54321');

// For PRODUCTION
define('SUPABASE_URL', 'https://your-project.supabase.co');

// API Keys (same for both)
define('SUPABASE_ANON_KEY', 'your-anon-key');
define('SUPABASE_SERVICE_KEY', 'your-service-role-key');
```

**Important**: When running WordPress in Docker, use `http://172.17.0.1:54321` instead of `http://127.0.0.1:54321` to access Supabase running on the host.

The controller automatically detects the environment and uses the correct URL (see [wp-config.php](../../public_html/wp-config.php) for the auto-detection logic).

### 4.3 Order Notes Examples

**Success:**
```
✅ 1 exam voucher(s) automatically generated

Customer: user@example.com
Portal User ID: abc-123-def-456

Generated vouchers:
• CERT-CP-A1B2C3D4

Vouchers have been added to the customer's Portal account.
```

**User Not Found:**
```
⚠️ Automatic voucher generation skipped: Customer must create a BDA Portal account first.
Customer email: user@example.com
Action required: Ask customer to sign up at https://portal.bda-association.com
```

---

## 5. Frontend Implementation

### 5.1 Certification Exams Page

**File**: `client/pages/certification/TakeCertificationExam.tsx`

```tsx
// Fetch user's unused vouchers
const { data: vouchers } = useQuery({
  queryKey: ['user-vouchers'],
  queryFn: async () => {
    const result = await VoucherService.getUserVouchers({ status: 'unused' });
    return result.data || [];
  },
});

// Determine exam status for each exam
const getExamWithStatus = (exam) => {
  // 1. Check if already certified
  if (exam.is_certified) return { ...exam, userStatus: 'certified' };

  // 2. Find matching voucher
  const voucher = vouchers?.find(v =>
    v.certification_type === exam.certification_type &&
    v.status === 'unused' &&
    (!v.quiz_id || v.quiz_id === exam.id)
  );

  if (!voucher) return { ...exam, userStatus: 'no_voucher' };

  // 3. Check for active booking
  const booking = bookings?.find(b =>
    b.quiz_id === exam.id &&
    ['scheduled', 'rescheduled'].includes(b.status)
  );

  if (!booking) return { ...exam, userStatus: 'has_voucher', voucher };

  // 4. Check if within exam window
  const now = new Date();
  const examStart = new Date(booking.scheduled_start_time);
  const windowStart = new Date(examStart.getTime() - 15 * 60 * 1000);

  if (now >= windowStart) return { ...exam, userStatus: 'ready', voucher, booking };

  return { ...exam, userStatus: 'scheduled', voucher, booking };
};
```

### 5.2 Voucher Service

**File**: `client/src/entities/quiz/voucher.service.ts`

Key methods:

| Method | Description |
|--------|-------------|
| `getUserVouchers(filters?)` | Get user's vouchers with optional status filter |
| `checkVoucherForQuiz(quizId)` | Check if user has valid voucher for specific exam |
| `useVoucher(dto)` | Mark voucher as used for exam attempt |

### 5.3 React Query Hooks

**File**: `client/src/entities/quiz/voucher.hooks.ts`

```tsx
// User hooks
useUserVouchers(filters?)           // Fetch user's vouchers
useCheckVoucherForQuiz(quizId)      // Check voucher for specific exam
useVoucher()                        // Mutation to use voucher

// Admin hooks
useAllVouchers(filters?)            // List all vouchers
useCreateVoucher()                  // Create voucher manually
useRevokeVoucher()                  // Revoke voucher
useVoucherStats()                   // Get statistics
```

---

## 6. Production Readiness Checklist

### 6.1 Database Setup

| Item | SQL Check | Status |
|------|-----------|--------|
| exam_vouchers table exists | `\d exam_vouchers` | ✅ |
| certification_products table exists | `\d certification_products` | ✅ |
| generate_voucher_code function | `SELECT proname FROM pg_proc WHERE proname = 'generate_voucher_code'` | ✅ |
| RLS policies configured | `SELECT * FROM pg_policies WHERE tablename = 'exam_vouchers'` | ✅ |
| At least one active quiz | `SELECT * FROM quizzes WHERE is_active = true` | ✅ |

### 6.2 WooCommerce Configuration

| Item | How to Verify | Status |
|------|---------------|--------|
| Certification product created | WP Admin → Products | ✅ Products 14972 (CP) and 14982 (SCP) |
| Product mapped in certification_products | Check table has rows | ✅ 2 products mapped |
| Supabase credentials in WordPress | Check wp-config.php | ✅ Auto-detection configured |
| VoucherAutomationController loaded | Check debug log | ✅ "Automation controller initialized" |

### 6.3 Portal Configuration

| Item | How to Verify | Status |
|------|---------------|--------|
| TakeCertificationExam page works | Navigate to /certification-exams | ✅ |
| Voucher display shows correctly | Check "Your Vouchers" section | ✅ |
| Schedule exam flow works | Click "Schedule Exam" button | ⏳ |

---

## 7. Testing Guide

### 7.1 Test Voucher Flow (In Apps)

| Step | URL | Action |
|------|-----|--------|
| 1 | Supabase Dashboard → certification_products | Add product mapping |
| 2 | `localhost:8080/wp-admin` → Products | Create WooCommerce product |
| 3 | `localhost:8082/signup` | Create Portal account |
| 4 | `localhost:8080/shop` | Purchase certification product |
| 5 | `localhost:8080/wp-admin` → Orders | Verify order note shows voucher |
| 6 | `localhost:8082/certification-exams` | Verify "Schedule Exam" button |

### 7.2 Add Test certification_products Mapping

Via Supabase Dashboard → Table Editor → certification_products:

| Field | Value |
|-------|-------|
| woocommerce_product_id | (Your WooCommerce product ID) |
| woocommerce_product_name | "CP Certification Exam" |
| woocommerce_product_sku | "BDA-CP-001" |
| certification_type | CP |
| quiz_id | (Quiz UUID or NULL for any CP exam) |
| vouchers_per_purchase | 1 |
| voucher_validity_months | 6 |
| is_active | true |

### 7.3 Manual Voucher Creation (For Testing)

```sql
INSERT INTO exam_vouchers (
  code,
  user_id,
  certification_type,
  quiz_id,
  status,
  expires_at
) VALUES (
  'TEST-CP-2025-001',
  'user-uuid-here',
  'CP',
  'quiz-uuid-here',
  'unused',
  '2026-12-31 23:59:59+00'
);
```

### 7.4 Verify Voucher in Database

```sql
SELECT
  v.code,
  v.status,
  v.certification_type,
  v.expires_at,
  u.email
FROM exam_vouchers v
JOIN users u ON v.user_id = u.id
WHERE u.email = 'user@example.com';
```

---

## 8. Troubleshooting

### 8.1 "Purchase Voucher" Shown When User Should Have Voucher

**Possible Causes:**

1. **No voucher in database**
   ```sql
   SELECT * FROM exam_vouchers WHERE user_id = 'user-uuid';
   ```

2. **Voucher status is not 'unused'**
   ```sql
   SELECT code, status FROM exam_vouchers WHERE user_id = 'user-uuid';
   ```

3. **Voucher expired**
   ```sql
   SELECT code, expires_at FROM exam_vouchers
   WHERE user_id = 'user-uuid' AND expires_at < NOW();
   ```

4. **Voucher certification_type doesn't match exam**
   ```sql
   SELECT v.certification_type as voucher_type, q.certification_type as quiz_type
   FROM exam_vouchers v, quizzes q
   WHERE v.user_id = 'user-uuid';
   ```

### 8.2 WooCommerce Order Completed But No Voucher Generated

**Check Order Notes:**
- "User NOT FOUND in Portal" → User must create Portal account first
- "No certification products configured" → Add certification_products mapping
- "Not a certification product" → Product ID doesn't match any mapping

**Check WordPress Debug Log:**
```bash
tail -f wp-content/debug.log | grep "BDA Voucher"
```

### 8.3 Voucher Query Returns 400 Error

**Possible Causes:**

1. **Wrong status value** - Use `'unused'` not `'active'`
2. **Wrong column names** - Use `scheduled_start_time` not `scheduled_start`
3. **RLS policy blocking** - Check user is authenticated

### 8.4 Common SQL Fixes

**Manually expire old vouchers:**
```sql
UPDATE exam_vouchers
SET status = 'expired'
WHERE status = 'unused' AND expires_at < NOW();
```

**Revoke specific voucher:**
```sql
UPDATE exam_vouchers
SET status = 'revoked', admin_notes = 'Manually revoked'
WHERE code = 'CERT-CP-XXXXXX';
```

**Check voucher statistics:**
```sql
SELECT
  status,
  COUNT(*) as count
FROM exam_vouchers
GROUP BY status;
```

---

## Appendix: File Locations

| Component | File Path |
|-----------|-----------|
| Database Migration | `supabase/migrations/20251001000008_create_voucher_system.sql` |
| WooCommerce Webhook | `public_html/wp-content/themes/jupiterx/inc/api/controllers/VoucherAutomationController.php` |
| Voucher Service | `client/src/entities/quiz/voucher.service.ts` |
| Voucher Hooks | `client/src/entities/quiz/voucher.hooks.ts` |
| Certification Exams Page | `client/pages/certification/TakeCertificationExam.tsx` |
| Exam Launch Page | `client/pages/certification/ExamLaunch.tsx` |

---

## 9. Test Results (November 26, 2025)

### 9.1 Test Summary

| Test | Result | Details |
|------|--------|---------|
| Controller initialization | ✅ PASS | Debug log shows "✅ [BDA Voucher] Automation controller initialized" |
| Supabase connectivity | ✅ PASS | WordPress container connects to Supabase via Docker bridge (172.17.0.1:54321) |
| Product mapping lookup | ✅ PASS | Found 2 certification products configured |
| User lookup by email | ✅ PASS | Portal user found by WooCommerce billing email |
| Voucher code generation | ✅ PASS | Generated codes: CERT-CP-2B1BA2C3, CERT-SCP-C046CAF4 |
| Database insertion | ✅ PASS | Vouchers created with correct status, expiry, and user assignment |

### 9.2 Test Order Details

- **Order ID**: #19232
- **Customer Email**: studio.aquadev@gmail.com
- **Products Purchased**:
  - 14972 (BDA-CP English) → Voucher generated
  - 14982 (BDA-SCP English) → Voucher generated
  - 14518 (BDA-CP Arabic) → Not mapped (skipped)
  - 14520 (BDA-SCP Arabic) → Not mapped (skipped)

### 9.3 Generated Vouchers

| Voucher Code | Type | Status | Expires | WC Order |
|--------------|------|--------|---------|----------|
| CERT-CP-2B1BA2C3 | CP | unused | 2026-05-26 | 19232 |
| CERT-SCP-C046CAF4 | SCP | unused | 2026-05-26 | 19232 |

### 9.4 Debug Log Output

```
[26-Nov-2025 23:49:16 UTC] 🎯 [BDA Voucher] Processing order #19232
[26-Nov-2025 23:49:16 UTC] 👤 [BDA Voucher] Customer: tttt rrrrr (studio.aquadev@gmail.com)
[26-Nov-2025 23:49:16 UTC] ✅ [BDA Voucher] Portal user found: abb1500c-8a38-47be-8a0a-820ad2e7b1d0
[26-Nov-2025 23:49:16 UTC] 📋 [BDA Voucher] Found 2 certification product(s) configured
[26-Nov-2025 23:49:16 UTC] 📦 [BDA Voucher] Processing item: شهادة BDA-CP (ID: 14972)
[26-Nov-2025 23:49:16 UTC]   ✅ Certification product matched! Type: CP
[26-Nov-2025 23:49:16 UTC]   ✅ Successfully created 1 voucher(s): CERT-CP-2B1BA2C3
[26-Nov-2025 23:49:16 UTC] 📦 [BDA Voucher] Processing item: شهادة BDA-SCP (ID: 14982)
[26-Nov-2025 23:49:16 UTC]   ✅ Certification product matched! Type: SCP
[26-Nov-2025 23:49:16 UTC]   ✅ Successfully created 1 voucher(s): CERT-SCP-C046CAF4
[26-Nov-2025 23:49:16 UTC] 🎉 [BDA Voucher] SUCCESS: Created 2 voucher(s)
```

### 9.5 Fixes Applied

1. **wp-config.php**: Added auto-detection for Docker environment
   - Uses `http://172.17.0.1:54321` when running in Docker locally
   - Uses production Supabase URL otherwise

2. **certification_products**: Added product mappings
   - 14972 → CP certification (English)
   - 14982 → SCP certification (English)

---

**End of Document**
