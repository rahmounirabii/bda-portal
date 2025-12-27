# My Certifications Feature

## Overview
The My Certifications feature allows Individual users to view their earned certifications, track expiry dates, download certificates, and manage renewals.

## Components

### Client-Side

#### Entity Layer (`client/src/entities/certifications/`)

**Types** (`certifications.types.ts`):
- `UserCertification`: Interface representing a user's certification
- `CertificationStatus`: Status enum (pending, issued, expired, revoked)
- `CertificationType`: Type enum (CP™, SCP™)
- `CertificationFilters`: Filter options

**Service** (`certifications.service.ts`):
- `CertificationsService.getUserCertifications()`: Fetches user's certifications
- `CertificationsService.downloadCertificate()`: Downloads certificate PDF
- `CertificationsService.requestRenewal()`: Requests certification renewal

**Hooks** (`certifications.hooks.ts`):
- `useUserCertifications()`: React Query hook to fetch certifications with filters
- `useDownloadCertificate()`: Mutation hook to download certificate
- `useRequestRenewal()`: Mutation hook to request renewal

#### Page Component (`client/pages/individual/MyCertifications.tsx`)

Features:
- Search certifications by name/number
- Filter by type (CP™, SCP™)
- Filter by status (Pending, Issued, Expired)
- Statistics cards (Active, Pending, Curriculum Access)
- Certificate download buttons
- Expiry countdown and renewal alerts
- Curriculum access links (for purchased content)

## Current Implementation Status

### ✅ Implemented
- Frontend UI and components
- Certification entity (types, service, hooks)
- Filtering and search functionality
- Status badges and expiry tracking
- Empty state handling

### 🚧 Pending (Database Migration Required)
The `.bak` file `20251001000007_add_certification_results.sql.bak` contains the schema for storing certification results. This migration needs to be activated to enable full functionality:

```sql
-- Adds to quiz_attempts table:
- score INTEGER
- total_points_earned INTEGER
- total_points_possible INTEGER
- passed BOOLEAN
- time_spent_minutes INTEGER

-- Creates quiz_attempt_answers table for storing user answers
```

### 🔜 To Be Implemented
1. **Certificate Generation**: Backend service to generate PDF certificates
2. **Certificate Issuance**: Admin workflow to issue certificates within 14 days
3. **Certificate Storage**: Store generated certificates (S3/Supabase Storage)
4. **Renewal Workflow**: Process for certification renewal
5. **Curriculum Integration**: Link purchased curriculum to certifications
6. **Digital Badges**: Generate and manage digital certification badges

## Data Flow

### Current (Temporary)
```
quiz_attempts (passed=true) → UserCertification (status='pending')
```

### Future (Full Implementation)
```
1. User passes exam → quiz_attempts.passed = true
2. Admin generates certificate (within 14 days)
3. Certificate stored in certifications table
4. User downloads certificate from My Certifications page
5. Expiry tracking and renewal reminders
```

## Certificate Issuance Process

1. **Exam Completion**: User completes certification exam
2. **Results Verification**: System validates passing score
3. **Pending Period**: Certificate marked as "pending" (shown in UI)
4. **Generation**: Admin/automated system generates certificate within 14 days
5. **Notification**: User receives email when certificate is ready
6. **Download**: User can download certificate from My Certifications page

## Expiry and Renewal

### Expiry Rules
- Most certifications expire 3 years from issue date
- Expiry date shown in certification details
- Renewal alerts shown 90 days before expiry

### Renewal Process (To Be Implemented)
1. User clicks "Renew Certification"
2. System checks eligibility (PDC requirements, etc.)
3. User completes renewal requirements
4. Certificate validity extended

## Database Schema (Future)

```sql
CREATE TABLE certifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  quiz_attempt_id UUID REFERENCES quiz_attempts(id),

  certification_type certification_type NOT NULL,
  certificate_number VARCHAR(50) UNIQUE,

  exam_date TIMESTAMPTZ NOT NULL,
  issued_date TIMESTAMPTZ NOT NULL,
  expiry_date TIMESTAMPTZ NOT NULL,

  status certification_status NOT NULL DEFAULT 'issued',

  certificate_url TEXT,
  digital_badge_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Routes
- `/my-certifications` - My Certifications page (Individual users only)

## UI/UX Features

### Status Badges
- **Pending Issue** (Yellow): Certificate not yet generated (within 14 days)
- **Active** (Green): Certificate issued and valid
- **Expired** (Red): Certificate past expiry date
- **Revoked** (Gray): Certificate revoked by admin

### Statistics Cards
- Active Certifications count
- Pending Issue count
- Curriculum Access count

### Renewal Alerts
- Show alert when <90 days until expiry
- Display days remaining
- Provide renewal button

### Empty State
- Shows when user has no certifications
- Links to Exam Applications page

## Error Handling
- Missing certifications: Shows "No certifications found"
- Download errors: Toast notification with error message
- Network errors: Graceful fallback with retry

## Future Enhancements
- [ ] Automated certificate generation
- [ ] PDF certificate templates (bilingual EN/AR)
- [ ] Digital badges integration (Credly, Accredible)
- [ ] LinkedIn certificate sharing
- [ ] Verification links for employers
- [ ] Certification portfolio page (public profile)
- [ ] CPD/PDC tracking integration
- [ ] Recertification exam scheduling
- [ ] Certification analytics dashboard
- [ ] Multi-certificate packages
