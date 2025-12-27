# Individual User Flow - Certification Exam Access

## Overview
This document describes the complete flow for individual users to access and take certification exams using vouchers purchased from the WooCommerce store.

## User Journey

### 1. **Purchase Certification Book**
**Location**: WooCommerce Store (`/store`)

User purchases a certification book (e.g., "BDA CP™ Business Analysis Fundamentals Book").

**What happens**:
- Order is placed in WooCommerce
- Order status: `completed`
- User receives book + exam voucher entitlement

### 2. **Admin Generates Voucher**
**Location**: Admin Panel → Customers & Vouchers (`/admin/customers-vouchers`)

Admin sees the customer in the list and generates vouchers.

**What happens**:
- Admin clicks "Generate Missing Vouchers"
- System creates voucher(s) in Supabase:
  - `code`: Unique code (e.g., `CERT-CP-ABC12345`)
  - `user_id`: Customer's user ID
  - `certification_type`: CP or SCP
  - `quiz_id`: NULL (wildcard - any exam) or specific quiz UUID
  - `status`: 'unused'
  - `expires_at`: Now + voucher_validity_months (e.g., 6 months)

### 3. **User Logs Into Portal**
**Location**: Portal Login (`/login`)

User logs in with their BDA Portal account.

**Requirements**:
- User must have created a portal account with the same email as WooCommerce purchase
- If no account exists, user sees "No vouchers - create account first" message in admin panel

### 4. **User Views Available Exams**
**Location**: Exam Applications (`/exam-applications`)

User navigates to certification exams page.

**⚠️ IMPORTANT: Voucher-Based Filtering**

The system **ONLY shows exams for which the user has a valid voucher**.

**Filtering Logic**:
```typescript
// For each quiz, check if user has a valid voucher
const hasAccess = userVouchers.some((voucher) => {
  // Must be unused and not expired
  if (voucher.status !== 'unused') return false;
  if (new Date(voucher.expires_at) <= now) return false;

  // Must match certification type
  if (voucher.certification_type !== quiz.certification_type) return false;

  // Either specific quiz match OR wildcard (quiz_id is null)
  return voucher.quiz_id === quiz.id || voucher.quiz_id === null;
});
```

**What user sees**:

✅ **If user has vouchers:**
- List of accessible exams (CP™ or SCP™ based on vouchers)
- Badge showing "X voucher(s) available" for each certification type
- Can click on exam to view details

❌ **If user has NO vouchers:**
- Orange warning card:
  - Icon: Ticket
  - Title: "No Exams Available"
  - Message: "You don't have any valid exam vouchers yet. Purchase a certification book from our store to get access to exams."
  - Button: "Visit Store" → Opens `/store` in new tab

### 5. **User Views Exam Details**
**Location**: Exam Detail (`/exam-applications/:examId`)

User clicks on an exam to view details.

**What user sees**:

✅ **Valid voucher found** (Green card):
- Icon: CheckCircle
- Message: "You have a valid exam voucher. You can proceed to start the certification exam."
- Shows voucher code in a box
- "Start Certification Exam" button is **enabled**

❌ **No valid voucher** (Red card):
- Icon: XCircle
- Message: "You need a valid exam voucher to take this certification exam..."
- Buttons: "Visit Store" | "Contact Support"
- "Start Exam" button is **disabled**

⚠️ **Profile incomplete** (Orange card):
- Icon: AlertCircle
- Message: "Your profile must be complete before you can take a certification exam..."
- Button: "Complete Profile"

### 6. **User Starts Exam**
**Location**: Take Exam (`/exam-applications/:examId/take`)

User clicks "Start Certification Exam" button.

**What happens**:
1. Page loads and validates voucher
2. **Voucher is automatically consumed**:
   ```typescript
   await useVoucherMutation.mutateAsync({
     voucher_code: voucher.code,
     quiz_id: quiz.id,
     attempt_id: mockAttemptId,
   });
   ```
3. Voucher status updated:
   - `status`: 'unused' → 'used'
   - `used_at`: Current timestamp
   - `attempt_id`: Quiz attempt UUID
4. Timer starts (e.g., 60 minutes)
5. Questions displayed one by one

**User cannot**:
- Use the same voucher again
- Go back and restart (voucher already consumed)

### 7. **User Completes Exam**
**Location**: Take Exam page

User answers all questions and clicks "Submit Exam".

**What happens**:
- Answers are saved
- Score is calculated
- Pass/fail status determined
- User redirected to results page
- Voucher remains 'used' (permanent)

## Voucher Types and Access Rules

### Wildcard Voucher (`quiz_id = NULL`)
**Access**: User can use this voucher for **ANY exam** of the matching certification type.

**Example**:
- Voucher: `certification_type = 'CP'`, `quiz_id = NULL`
- User sees: ALL CP™ exams
- User can take: Any ONE CP™ exam (voucher consumed after first use)

### Specific Quiz Voucher (`quiz_id = UUID`)
**Access**: User can ONLY use this voucher for the specific exam.

**Example**:
- Voucher: `certification_type = 'CP'`, `quiz_id = '123-456-789'`
- User sees: Only the quiz with ID '123-456-789'
- User can take: Only that specific exam

### Multiple Vouchers
**Access**: User sees ALL exams for which they have vouchers.

**Example**:
- Voucher 1: CP™ wildcard
- Voucher 2: SCP™ specific exam
- User sees: All CP™ exams + specific SCP™ exam

## Edge Cases

### User Has Expired Vouchers
**Behavior**: Expired vouchers are excluded from filtering logic.

**Result**: User doesn't see exams for expired vouchers.

**Solution**: User must purchase new vouchers.

### User Has Used Vouchers
**Behavior**: Used vouchers are excluded from filtering logic.

**Result**: User doesn't see exams for used vouchers (unless they have another unused voucher).

**Solution**: User must purchase new vouchers to take more exams.

### User Purchases Multiple Books
**Behavior**: Each book generates voucher(s).

**Result**: User accumulates multiple vouchers (e.g., 2 CP™ vouchers, 1 SCP™ voucher).

**Access**: User can take multiple exams (one per voucher).

### User Has Both CP™ and SCP™ Vouchers
**Behavior**: Filtering shows exams for both certification types.

**Result**: User sees CP™ exams AND SCP™ exams in the list.

### Voucher Expires During Exam
**Behavior**: Once voucher is consumed (marked 'used'), expiration no longer matters.

**Result**: User can complete the exam even if voucher expires during the exam.

### User Account Not Created
**Behavior**: Admin cannot generate voucher (no user_id found).

**Result**: Admin sees "Customer Account Not Found" message.

**Solution**: Customer must create portal account first, then admin can generate vouchers.

## User Interface Elements

### Info Banner (Blue)
Located at top of `/exam-applications` page.

**Text**: "You can only see exams for which you have a valid voucher. Purchase a certification book from our store to receive exam vouchers..."

### Voucher Badges
Each exam card shows:
- ✅ Green badge: "X voucher(s) available"
- ⚠️ Gray badge: "No voucher"

### Empty State (Orange Card)
Shown when user has no accessible exams.

**Elements**:
- Large ticket icon
- Title: "No Exams Available"
- Description with call-to-action
- "Visit Store" button

### Exam Detail Cards
- Green: Valid voucher + shows code
- Red: No voucher + links to store/support
- Orange: Profile incomplete + link to profile

## Testing Checklist

### Individual User Flow
- [ ] User purchases certification book from WooCommerce
- [ ] Admin generates voucher for customer
- [ ] User logs into portal
- [ ] User navigates to `/exam-applications`
- [ ] User ONLY sees exams for which they have vouchers
- [ ] User with NO vouchers sees orange "No Exams Available" card
- [ ] User clicks exam card
- [ ] Exam detail shows green voucher card with code
- [ ] User clicks "Start Certification Exam"
- [ ] Voucher is marked as 'used'
- [ ] User sees exam questions
- [ ] User completes exam
- [ ] Voucher remains 'used' (cannot be reused)

### Voucher Filtering
- [ ] User with CP™ voucher sees only CP™ exams
- [ ] User with SCP™ voucher sees only SCP™ exams
- [ ] User with wildcard voucher sees all exams of that cert type
- [ ] User with specific voucher sees only that specific exam
- [ ] User with multiple vouchers sees all accessible exams
- [ ] Expired vouchers are excluded from filtering
- [ ] Used vouchers are excluded from filtering

### Edge Cases
- [ ] User with no portal account → admin cannot generate voucher
- [ ] User with expired vouchers → no exams visible
- [ ] User with used vouchers → no exams visible (unless other unused vouchers exist)
- [ ] User purchases multiple books → accumulates multiple vouchers
- [ ] Voucher expires during exam → exam can still be completed

## Related Files

### Frontend
- `client/pages/certification/ExamApplications.tsx` - Main exam listing page with filtering
- `client/pages/certification/ExamDetail.tsx` - Exam details with voucher verification
- `client/pages/certification/TakeExam.tsx` - Exam taking interface with voucher consumption
- `client/src/entities/quiz/voucher.hooks.ts` - Voucher hooks including `useUserVouchers`
- `client/src/entities/quiz/voucher.service.ts` - Voucher service with filtering logic

### Admin
- `client/pages/admin/CustomersVouchers.tsx` - Customer-centric voucher generation
- `client/pages/admin/Vouchers.tsx` - All vouchers management

### Backend
- `supabase/migrations/20251001000008_create_voucher_system.sql` - Voucher schema

## Support

For questions or issues, contact the BDA development team.
