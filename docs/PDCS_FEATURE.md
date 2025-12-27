# PDCs Feature (Professional Development Credits)

## Overview
The PDCs feature allows Individual users to track and manage their Professional Development Credits, which are required for certification renewal. Users need to earn 60 PDCs over 3 years to maintain their certification status.

## Components

### Database Schema

#### Migration: `20251002000001_create_pdc_system.sql`

**Tables Created:**

1. **`pdp_programs`**: Approved programs from PDP partners
   - `program_id`: Unique identifier for user entry (e.g., "PDP-2025-001")
   - `max_pdc_credits`: Maximum credits available
   - `activity_type`: Type of professional development activity
   - `valid_from` / `valid_until`: Program validity period
   - BoCK domain alignment tracking

2. **`pdc_entries`**: User PDC submissions
   - User and certification linkage
   - Program ID (optional - can submit manual entries)
   - Activity details (title, description, type)
   - Credits claimed vs. approved
   - Status workflow: pending → approved/rejected/expired
   - Documentation upload support

**Enums:**
- `pdc_status`: pending | approved | rejected | expired
- `pdc_activity_type`: training_course | conference | workshop | webinar | self_study | teaching | publication | volunteer_work | other

**Functions:**
- `get_user_pdc_total()`: Calculate approved credits for last 3 years
- `validate_program_id()`: Validate and return program details

### Client-Side

#### Entity Layer (`client/src/entities/pdc/`)

**Types** (`pdc.types.ts`):
- `PDCEntry`: User's PDC submission
- `PDPProgram`: Approved program from PDP partner
- `PDCSummary`: Progress summary (approved, pending, goal, percentage)
- `CreatePDCEntryDTO`: DTO for creating new entry
- `PDCFilters`: Filter options

**Service** (`pdc.service.ts`):
- `PDCService.getUserPDCEntries()`: Fetch user's submissions with filters
- `PDCService.getPDCSummary()`: Get progress summary
- `PDCService.createPDCEntry()`: Submit new PDC entry
- `PDCService.updatePDCEntry()`: Update pending entry
- `PDCService.deletePDCEntry()`: Delete pending entry
- `PDCService.getActivePDPPrograms()`: Get all active programs
- `PDCService.validateProgramId()`: Validate program ID

**Hooks** (`pdc.hooks.ts`):
- `useUserPDCEntries()`: React Query hook for entries
- `usePDCSummary()`: React Query hook for summary
- `useCreatePDCEntry()`: Mutation hook for creation
- `useUpdatePDCEntry()`: Mutation hook for updates
- `useDeletePDCEntry()`: Mutation hook for deletion
- `useActivePDPPrograms()`: Query hook for programs
- `useValidateProgramId()`: Mutation hook for validation

#### Page Component (`client/pages/individual/PDCs.tsx`)

**Features:**

1. **Progress Dashboard**
   - Visual progress bar (0-100%)
   - Total approved vs. 60 credit goal
   - Pending and rejected counts
   - 3-year expiry tracking

2. **PDC Entry Submission Form**
   - Program ID validation (auto-fills from PDP database)
   - Activity type selection (9 types)
   - Title, description, credits, date
   - File upload support (certificates/proof)
   - Notes for reviewers

3. **Entry Management**
   - List all PDC entries with status badges
   - Filter by status (pending/approved/rejected)
   - Delete pending entries
   - View rejection reasons
   - Timeline tracking

4. **Validation Logic**
   - Program ID lookup against approved programs
   - Credit limits enforcement (max per program)
   - Date validation (no future dates)
   - Required fields validation

## User Workflow

### Submitting a PDC Entry

**Option 1: With Program ID (Recommended)**
1. Enter Program ID from approved PDP partner
2. Click "Validate" to auto-fill program details
3. System verifies:
   - Program is active
   - Current date is within validity period
   - Credits don't exceed program maximum
4. Complete remaining fields
5. Submit for admin review

**Option 2: Manual Entry**
1. Skip Program ID
2. Manually fill all fields
3. Upload proof document
4. Submit for admin review

### Status Flow
```
pending → (Admin Review) → approved/rejected
                       ↓
              expired (after 3 years)
```

### Credit Counting Rules
- Only approved credits count towards goal
- Only credits from last 3 years are counted
- Expired credits automatically excluded from total

## Admin Workflow (Future)

### PDC Review Page
1. View pending submissions
2. Validate documentation
3. Cross-check with PDP partner database
4. Approve or reject with reason
5. Adjust credits if needed (partial approval)

### Fraud Detection
- Duplicate submission prevention
- Program ID verification
- Suspicious pattern detection
- Cross-validation with partner systems

## RLS Policies

### `pdp_programs`
- **SELECT**: All authenticated users can view active programs
- **INSERT/UPDATE/DELETE**: Only program providers and admins

### `pdc_entries`
- **SELECT**: Users see their own + admins see all
- **INSERT**: Users can create own entries
- **UPDATE**: Users can edit own pending entries only
- **DELETE**: Users can delete own pending entries

## Routes
- `/pdcs` - PDCs Management page (Individual users only)

## Activity Types

| Type | Label | Examples |
|------|-------|----------|
| `training_course` | Training Course | Formal courses, bootcamps |
| `conference` | Conference | Industry conferences, summits |
| `workshop` | Workshop | Hands-on workshops |
| `webinar` | Webinar | Online seminars |
| `self_study` | Self Study | Books, online courses |
| `teaching` | Teaching | Teaching/mentoring others |
| `publication` | Publication | Writing articles, blogs |
| `volunteer_work` | Volunteer Work | Community service |
| `other` | Other | Anything not covered above |

## Renewal Requirements

### Standard Renewal (Via PDCs)
- **Required**: 60 approved PDCs over 3 years
- **Alternative**: Retake certification exam

### Calculation
- System counts only approved credits
- Only credits from last 3 years
- Progress percentage: `(approved_total / 60) * 100`

### Expiry Tracking
- Activity date must be within 3 years
- Automatic expiry after 3 years from activity date
- System excludes expired credits from totals

## Integration Points

### With PDP Partners
- Program registry synchronization
- Cross-validation of Program IDs
- Participant verification
- Credit reporting

### With Certifications
- Link PDCs to specific certification
- Renewal eligibility checking
- Automated renewal processing (if 60+ PDCs)

## Testing Scenarios

1. ✅ User submits entry with valid Program ID
2. ✅ User submits manual entry without Program ID
3. ✅ Program ID validation succeeds
4. ✅ Program ID validation fails (inactive/invalid)
5. ✅ Credits exceed program maximum (rejected)
6. ✅ Admin approves entry
7. ✅ Admin rejects entry with reason
8. ✅ User edits pending entry
9. ✅ User deletes pending entry
10. ✅ Cannot edit/delete approved entries
11. ✅ Progress calculation correct
12. ✅ 3-year expiry enforced
13. ✅ Filter by status works
14. ✅ Empty state shows correctly

## Future Enhancements
- [ ] Automated approval for verified PDP programs
- [ ] Batch PDF certificate upload
- [ ] QR code scanning for program validation
- [ ] Mobile app for on-site PDC logging
- [ ] Gamification (badges, streaks)
- [ ] PDC marketplace integration
- [ ] Calendar integration for upcoming programs
- [ ] Recommendation engine (suggest programs)
- [ ] Analytics dashboard (activity types distribution)
- [ ] Export PDC transcript (PDF report)
- [ ] Social sharing (LinkedIn integration)
- [ ] Reminder notifications (renewal deadlines)
- [ ] Multi-year planning tool
- [ ] Peer verification system
