# Voucher Usage Flow Documentation

## Overview
This document describes the complete flow for customers to use vouchers purchased from the WooCommerce store to take certification exams.

## Architecture

### Database Schema
```sql
-- exam_vouchers table
CREATE TABLE exam_vouchers (
  id UUID PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id),
  certification_type VARCHAR(10) NOT NULL, -- 'CP' or 'SCP'
  quiz_id UUID REFERENCES quizzes(id) NULL, -- NULL = wildcard for any quiz
  status VARCHAR(20) NOT NULL, -- 'unused', 'used', 'expired', 'revoked'
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  attempt_id UUID REFERENCES quiz_attempts(id) NULL,
  woocommerce_order_id INTEGER NULL,
  certification_product_id UUID REFERENCES certification_products(id) NULL,
  admin_notes TEXT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Voucher Types

### 1. Specific Quiz Voucher
- `quiz_id` is set to a specific quiz UUID
- Voucher can ONLY be used for that exact quiz
- Example: Voucher for "BDA CP™ Business Analysis Fundamentals"

### 2. Wildcard Voucher
- `quiz_id` is NULL
- Voucher can be used for ANY quiz of the matching `certification_type`
- Example: Voucher for any CP™ exam

## Voucher Verification Logic

### Key Rules:
1. **Certification Type Match**: Voucher's `certification_type` MUST match the quiz's `certification_type`
2. **Quiz Match**: Either `quiz_id` matches exactly OR `quiz_id` is NULL (wildcard)
3. **Status**: Voucher status MUST be 'unused'
4. **Expiration**: Voucher `expires_at` MUST be in the future
5. **Priority**: Specific quiz vouchers are preferred over wildcard vouchers

## Client-Side Flow

### 1. Exam Applications Page (`/exam-applications`)

**File**: `client/pages/certification/ExamApplications.tsx`

**Features**:
- Lists all available certification exams (CP™, SCP™)
- Displays voucher count badges for each certification type
- Shows "X voucher(s) available" or "No voucher" badge

**Implementation**:
```typescript
// Hook to get voucher counts by certification type
const voucherCounts = useVoucherCountsByCertType();

// Display badge
{voucherCounts[quiz.certification_type] > 0 ? (
  <Badge className="bg-green-100 text-green-800 border-green-300">
    <Ticket className="h-3 w-3 mr-1" />
    {voucherCounts[quiz.certification_type]} voucher(s) available
  </Badge>
) : (
  <Badge variant="outline" className="text-gray-600">
    <Ticket className="h-3 w-3 mr-1" />
    No voucher
  </Badge>
)}
```

### 2. Exam Detail Page (`/exam-applications/:examId`)

**File**: `client/pages/certification/ExamDetail.tsx`

**Features**:
- Displays full exam details
- Checks for valid voucher using `useCheckVoucherForQuiz`
- Shows voucher status:
  - ✅ Green card: Valid voucher found (shows voucher code)
  - ❌ Red card: No voucher (links to store and support)
  - ⏳ Gray card: Checking voucher status
- "Start Exam" button disabled unless:
  - Profile is complete
  - Valid voucher exists

**Implementation**:
```typescript
// Check voucher
const { data: voucher, isLoading: voucherLoading } = useCheckVoucherForQuiz(
  examId || '',
  !!examId
);

const hasValidVoucher = !!voucher;
const canStartExam = isProfileComplete && hasValidVoucher;
```

### 3. Take Exam Page (`/exam-applications/:examId/take`)

**File**: `client/pages/certification/TakeExam.tsx`

**Features**:
- Validates voucher on page load
- Consumes voucher when exam starts
- Marks voucher as 'used' with:
  - `status = 'used'`
  - `used_at = current timestamp`
  - `attempt_id = quiz attempt UUID`
- Blocks access if no valid voucher
- Displays timer and questions

**Implementation**:
```typescript
useEffect(() => {
  if (!quiz || !voucher) return;

  const initExam = async () => {
    // Create attempt (placeholder for now)
    const mockAttemptId = 'temp-attempt-' + Date.now();
    setAttemptId(mockAttemptId);

    // Use voucher
    try {
      await useVoucherMutation.mutateAsync({
        voucher_code: voucher.code,
        quiz_id: quiz.id,
        attempt_id: mockAttemptId,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate voucher',
        variant: 'destructive',
      });
      navigate(`/exam-applications/${quiz.id}`);
    }
  };

  initExam();
}, [quiz?.id, voucher?.code]);
```

## Backend Services

### VoucherService (`client/src/entities/quiz/voucher.service.ts`)

#### `checkVoucherForQuiz(quizId: string)`
Finds a valid voucher for a specific quiz.

**Logic**:
1. Get current authenticated user
2. Fetch quiz to get its `certification_type`
3. Query for voucher matching:
   - `user_id = current user`
   - `certification_type = quiz.certification_type`
   - `quiz_id = quizId OR quiz_id IS NULL`
   - `status = 'unused'`
   - `expires_at > NOW()`
4. Order by `quiz_id DESC NULLS LAST` (prefer specific vouchers)
5. Return first match or null

**Return**: `QuizResult<ExamVoucher | null>`

#### `useVoucher(dto: UseVoucherDTO)`
Validates and marks a voucher as used.

**Input**:
```typescript
interface UseVoucherDTO {
  voucher_code: string;
  quiz_id: string;
  attempt_id: string;
}
```

**Logic**:
1. Get current authenticated user
2. Fetch quiz to get its `certification_type`
3. Verify voucher matches:
   - `code = dto.voucher_code`
   - `user_id = current user`
   - `certification_type = quiz.certification_type`
   - `quiz_id = dto.quiz_id OR quiz_id IS NULL`
   - `status = 'unused'`
   - `expires_at > NOW()`
4. Update voucher:
   ```sql
   UPDATE exam_vouchers
   SET status = 'used',
       used_at = NOW(),
       attempt_id = dto.attempt_id
   WHERE id = voucher.id
   ```
5. Return updated voucher

**Return**: `QuizResult<ExamVoucher>`

#### `batchExpireVouchers()`
Batch updates all expired vouchers.

**Logic**:
1. Query for all vouchers where:
   - `status = 'unused'`
   - `expires_at < NOW()`
2. Update all found vouchers to `status = 'expired'`
3. Return count of updated vouchers

**Return**: `QuizResult<{ updated_count: number }>`

**Usage**: Called manually by admin via "Expire Old Vouchers" button

### React Query Hooks (`client/src/entities/quiz/voucher.hooks.ts`)

#### `useUserVouchers(filters?: ExamVoucherFilters)`
Fetches all vouchers for the current user.

**Return**: `{ data: ExamVoucherWithQuiz[], isLoading, error }`

#### `useVoucherCountsByCertType()`
Calculates available voucher count for each certification type.

**Logic**:
- Filters vouchers where `status = 'unused'` AND `expires_at > NOW()`
- Groups by `certification_type`
- Returns `{ CP: number, SCP: number }`

**Return**: `{ CP: number, SCP: number }`

#### `useCheckVoucherForQuiz(quizId: string, enabled: boolean)`
Checks if user has a valid voucher for a specific quiz.

**Return**: `{ data: ExamVoucher | null, isLoading, error }`

#### `useVoucher()`
Mutation hook to consume a voucher.

**Return**: `{ mutateAsync: (dto: UseVoucherDTO) => Promise<ExamVoucher> }`

#### `useBatchExpireVouchers()`
Mutation hook to batch expire old vouchers (admin only).

**Return**: `{ mutateAsync: () => Promise<{ updated_count: number }>, isPending: boolean }`

**Usage**:
```typescript
const batchExpireMutation = useBatchExpireVouchers();

const handleExpire = async () => {
  const result = await batchExpireMutation.mutateAsync();
  console.log(`Expired ${result.updated_count} vouchers`);
};
```

## Admin Flow

Administrators can manage vouchers through:

1. **Certification Products** (`/admin/certification-products`)
   - Link WooCommerce products to certification types
   - Configure vouchers per purchase
   - Set voucher validity period

2. **Customers & Vouchers** (`/admin/customers-vouchers`)
   - View customers who purchased certification products
   - Generate vouchers for eligible customers
   - Track voucher generation status

3. **All Vouchers** (`/admin/vouchers`)
   - View all vouchers in the system
   - Filter by status, certification type, user
   - Revoke or delete vouchers
   - **Batch expire old vouchers** - Automatically mark all unused vouchers past expiration as 'expired'

## Voucher Expiration Logic

### Automatic Expiration (Database Trigger)

A PostgreSQL trigger exists to mark vouchers as expired:

```sql
CREATE TRIGGER auto_expire_vouchers
    BEFORE UPDATE ON public.exam_vouchers
    FOR EACH ROW
    EXECUTE FUNCTION check_voucher_expiration();
```

**How it works**:
- Triggers **BEFORE UPDATE** on exam_vouchers table
- If voucher status is 'unused' AND `expires_at < NOW()`, sets status to 'expired'
- This means vouchers are expired automatically when:
  - User tries to use an expired voucher
  - Admin updates the voucher record
  - Any UPDATE operation touches the voucher

**Limitation**: Vouchers don't automatically expire in the background - they require an UPDATE to trigger the function.

### Manual Batch Expiration (Admin Action)

Admins can manually expire all old vouchers using the **"Expire Old Vouchers"** button in `/admin/vouchers`.

**Process**:
1. Admin clicks "Expire Old Vouchers" button
2. System finds all vouchers where `status = 'unused'` AND `expires_at < NOW()`
3. Batch updates all found vouchers to `status = 'expired'`
4. Shows toast notification: "X voucher(s) marked as expired"

**Benefits**:
- Clean up voucher stats
- Ensure accurate reporting
- Can be run periodically by admin

**Future Enhancement**: Could be automated with a Supabase Edge Function running daily.

## Error Handling

### No Voucher Available
- User sees red warning card on exam detail page
- Button text: "Voucher Required"
- Links to store and support

### Voucher Expired
- System automatically filters out expired vouchers
- Voucher with `expires_at < NOW()` is not shown as available

### Wrong Certification Type
- Voucher verification ensures `certification_type` matches
- CP™ voucher cannot be used for SCP™ exam and vice versa

### Already Used Voucher
- Status check prevents used vouchers from being used again
- Voucher with `status = 'used'` is excluded from available vouchers

## Testing Checklist

### User Flow
- [ ] User logs in to portal
- [ ] User navigates to `/exam-applications`
- [ ] User sees voucher count badge (if they have vouchers)
- [ ] User clicks exam card
- [ ] User sees green voucher card with code
- [ ] User clicks "Start Certification Exam"
- [ ] User is redirected to `/exam-applications/:examId/take`
- [ ] Voucher is marked as 'used'
- [ ] User sees exam questions
- [ ] User completes exam
- [ ] Voucher remains 'used' (not reusable)

### Admin Flow
- [ ] Admin logs in
- [ ] Admin navigates to `/admin/certification-products`
- [ ] Admin links WooCommerce product to certification type
- [ ] Admin navigates to `/admin/customers-vouchers`
- [ ] Admin sees customers who purchased products
- [ ] Admin clicks "Generate Missing Vouchers"
- [ ] Vouchers are created in Supabase
- [ ] Customer can see vouchers in their account

### Edge Cases
- [ ] User with no voucher cannot start exam
- [ ] Expired voucher is not counted as available
- [ ] Used voucher cannot be used again
- [ ] Wildcard voucher (quiz_id = NULL) works for any quiz of that cert type
- [ ] Specific voucher only works for designated quiz
- [ ] CP™ voucher doesn't work for SCP™ exam
- [ ] SCP™ voucher doesn't work for CP™ exam

## Next Steps

1. **Exam Attempt Creation**: Replace mock attempt ID with real quiz attempt creation
2. **Score Calculation**: Implement full exam grading logic
3. **Results Page**: Create results page to show exam score and pass/fail status
4. **Certification Issuance**: Automatically issue certificate on passing exam
5. **Voucher Expiration Job**: Background job to mark expired vouchers as 'expired'
6. **Email Notifications**: Send email when voucher is generated/used
7. **Voucher History**: User page to view voucher history

## Related Files

### Frontend
- `client/pages/certification/ExamApplications.tsx`
- `client/pages/certification/ExamDetail.tsx`
- `client/pages/certification/TakeExam.tsx`
- `client/pages/admin/CertificationProductsUnified.tsx`
- `client/pages/admin/CustomersVouchers.tsx`
- `client/pages/admin/Vouchers.tsx`

### Services & Hooks
- `client/src/entities/quiz/voucher.service.ts`
- `client/src/entities/quiz/voucher.hooks.ts`
- `client/src/entities/quiz/quiz.types.ts`
- `client/src/entities/auth/user-lookup.service.ts`

### WooCommerce Integration
- `public_html/wp-content/themes/jupiterx/functions.php` (REST API endpoints)
- `client/src/entities/woocommerce/woocommerce.service.ts`
- `client/src/entities/woocommerce/woocommerce.hooks.ts`

## Support

For questions or issues, contact the BDA development team.
