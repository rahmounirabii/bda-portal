# Membership Certificate System

## Overview

This document describes the Professional Membership Certificate generation system implemented for BDA (Business Development Association).

**Related User Story**: US3 - Display Membership Certificate (Professional Only)

## Features

✅ **Certificate Generation**
- PDF certificates for Professional members only
- Includes: Name, Membership Level, Issue Date, Expiry Date, Membership ID, BDA branding
- Professional design with gold accents, BDA logo, and official signatures
- Landscape A4 format (297mm x 210mm)

✅ **Certificate Persistence**
- Certificates remain downloadable even after membership expiry
- Stored in Supabase Storage (`membership-certificates` bucket)
- Signed URLs with 1-hour validity for secure access

✅ **Automatic Generation**
- Queued when professional membership is activated via WooCommerce webhook
- Can be manually triggered by admin for re-issue

## Architecture

### Components

1. **Certificate Generator Script**
   - Location: `scripts/membership-certificate-generator.ts`
   - Technology: Puppeteer + TypeScript
   - Output: Professional PDF certificates

2. **Storage Bucket**
   - Name: `membership-certificates`
   - Access: Private (signed URLs only)
   - Migration: `supabase/migrations/20251206000002_create_membership_certificates_bucket.sql`

3. **Database Integration**
   - Table: `user_memberships`
   - Field: `certificate_url` (stores storage path)
   - Logs: `membership_activation_logs` (tracks generation)

4. **Frontend Display**
   - Page: `client/pages/individual/MyMembership.tsx`
   - Only visible to Professional members
   - Download button with loading state

## Usage

### Generate Certificate for Specific Membership

```bash
npm run membership-certificate:generate [membership_id]
```

Example:
```bash
npm run membership-certificate:generate 550e8400-e29b-41d4-a716-446655440000
```

### Generate All Pending Certificates

```bash
npm run membership-certificate:generate
```

This will:
1. Query all Professional memberships without `certificate_url`
2. Generate PDF for each
3. Upload to Supabase Storage
4. Update `certificate_url` in database

### Manual Generation via Script

```bash
cd bda-portal
tsx scripts/membership-certificate-generator.ts [membership_id]
```

## Certificate Design

### Visual Elements

- **Background**: Navy blue gradient with subtle patterns
- **Corners**: Gold decorative borders
- **Seal**: Gold circular badge with year
- **Watermark**: "BDA" text at 25-degree angle
- **Colors**:
  - Professional Gold: `#D4AF37`
  - Dark Blue: `#1e3a5f`
  - Light Blue: `#2196F3`

### Content Sections

1. **Header**
   - "Official Membership Certificate"
   - "Certificate of Membership"
   - "Business Development Association"

2. **Main Body**
   - Member name (large serif font)
   - "Professional Member" badge
   - Membership description

3. **Credentials**
   - Membership ID (monospace font)
   - Start Date
   - Issue Date
   - Expiry Date

4. **Signatures**
   - Dr. Sarah Johnson (President, BDA)
   - Prof. Michael Chen (Director of Membership)

5. **Footer**
   - BDA logo
   - Contact information

## Webhook Integration

When a Professional membership is purchased:

1. **WooCommerce Webhook** → Portal
2. **Membership Activation** (`activate_membership` function)
3. **Certificate Queue** (`triggerCertificateGeneration`)
4. **Log Created** in `membership_activation_logs`
   ```json
   {
     "action": "certificate_generated",
     "action_source": "webhook",
     "details": {
       "status": "queued",
       "queued_at": "2025-12-06T10:30:00Z"
     }
   }
   ```

### Background Processing

The actual PDF generation happens asynchronously:

**Development/Manual**:
```bash
npm run membership-certificate:generate
```

**Production Options**:
1. Supabase Edge Function (recommended)
2. Background job queue (Bull/BullMQ)
3. Cron job (every 5 minutes)
4. Separate microservice

## Database Schema

### user_memberships

```sql
CREATE TABLE user_memberships (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  membership_id TEXT UNIQUE,         -- e.g., BDA-MEM-2024-0001
  membership_type membership_type,    -- 'basic' | 'professional'
  certificate_url TEXT,               -- Storage path (professional only)
  start_date DATE,
  expiry_date DATE,
  status membership_status,
  ...
);
```

### membership_activation_logs

```sql
CREATE TABLE membership_activation_logs (
  id UUID PRIMARY KEY,
  membership_id UUID REFERENCES user_memberships(id),
  user_id UUID REFERENCES users(id),
  action TEXT,                        -- 'certificate_generated', 'certificate_reissued'
  action_source TEXT,                 -- 'webhook', 'admin', 'system'
  details JSONB,
  created_at TIMESTAMPTZ
);
```

## Storage Policies

### Read Access

Users can download their own membership certificates:

```sql
CREATE POLICY "Users can view own membership certificates"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'membership-certificates'
  AND EXISTS (
    SELECT 1 FROM user_memberships
    WHERE user_id = auth.uid()
    AND certificate_url = name
  )
);
```

### Admin Access

Admins can manage all certificates:

```sql
CREATE POLICY "Admins can manage membership certificates"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'membership-certificates'
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);
```

## Frontend Implementation

### Display Certificate Button

```typescript
// Only show for Professional members
{isProfessional && (
  <Card>
    <CardHeader>
      <CardTitle>Membership Certificate</CardTitle>
    </CardHeader>
    <CardContent>
      <Button
        onClick={handleDownloadCertificate}
        disabled={isDownloading || !membership.certificate_url}
      >
        {isDownloading ? 'Downloading...' : 'Download Certificate'}
      </Button>
    </CardContent>
  </Card>
)}
```

### Download Handler

```typescript
const handleDownloadCertificate = async () => {
  const result = await MembershipService.getMembershipCertificateUrl(
    membershipStatus.membership.id
  );

  if (result.error) throw result.error;

  // result.data is a signed URL valid for 1 hour
  window.open(result.data, '_blank');
};
```

### Service Method

```typescript
static async getMembershipCertificateUrl(
  membershipId: string
): Promise<MembershipResult<string>> {
  // Get membership and verify it's professional
  const { data: membership } = await supabase
    .from('user_memberships')
    .select('certificate_url, membership_type')
    .eq('id', membershipId)
    .single();

  if (membership.membership_type !== 'professional') {
    throw new Error('Certificates are only available for Professional members');
  }

  // Generate signed URL (1 hour validity)
  const { data } = await supabase.storage
    .from('membership-certificates')
    .createSignedUrl(membership.certificate_url, 3600);

  return { data: data.signedUrl, error: null };
}
```

## Admin Features

### Re-issue Certificate

Admins can re-issue certificates from the Membership Management page:

```typescript
const handleReissueCertificate = async (membership: UserMembership) => {
  const result = await MembershipService.reissueCertificate(
    membership.id,
    currentUser.id
  );

  // This clears the existing certificate_url
  // Admin must then run: npm run membership-certificate:generate
};
```

## Testing

### Test Certificate Generation

1. Create a test professional membership:
```sql
INSERT INTO user_memberships (
  user_id, membership_type, membership_id,
  start_date, expiry_date, status
) VALUES (
  '[user_id]', 'professional', 'BDA-MEM-2024-TEST-001',
  CURRENT_DATE, CURRENT_DATE + INTERVAL '12 months', 'active'
);
```

2. Generate certificate:
```bash
npm run membership-certificate:generate [membership_id]
```

3. Verify:
   - Check `membership-certificates/` folder for PDF
   - Check `user_memberships.certificate_url` is updated
   - Check Supabase Storage bucket contains the file

### Test Download from UI

1. Login as professional member
2. Navigate to "My Membership"
3. Click "Download Certificate"
4. Verify PDF opens in new tab

## Troubleshooting

### Certificate not generating

Check logs:
```bash
# Run generator with verbose output
tsx scripts/membership-certificate-generator.ts [membership_id]
```

Common issues:
- Missing Supabase credentials
- Puppeteer not installed
- User has no name (will show "Member")
- Membership is Basic (not Professional)

### Certificate not appearing in UI

1. Check `certificate_url` is set:
```sql
SELECT id, membership_id, certificate_url
FROM user_memberships
WHERE id = '[membership_id]';
```

2. Check storage bucket:
```bash
# Via Supabase Dashboard
Storage > membership-certificates
```

3. Check RLS policies are active

### Download fails

1. Verify signed URL generation:
```typescript
const { data, error } = await supabase.storage
  .from('membership-certificates')
  .createSignedUrl(path, 3600);

console.log({ data, error });
```

2. Check file exists in storage
3. Verify user has access (RLS policy)

## Production Deployment

### Recommended Setup

1. **Supabase Edge Function** for certificate generation:

```typescript
// functions/generate-membership-certificate/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { membershipId } = await req.json();

  // Generate certificate
  // Upload to storage
  // Update database

  return new Response(JSON.stringify({ success: true }));
});
```

2. **Trigger from webhook**:

```typescript
// In woocommerce-webhook.ts
await supabase.functions.invoke('generate-membership-certificate', {
  body: { membershipId }
});
```

3. **Or setup cron job**:

```bash
# Every 5 minutes, generate pending certificates
*/5 * * * * cd /path/to/bda-portal && npm run membership-certificate:generate
```

## Security Considerations

✅ **Access Control**
- Certificates stored in private bucket
- Signed URLs expire after 1 hour
- RLS policies enforce ownership

✅ **Data Privacy**
- Only member name and dates shown
- No sensitive information in certificate

✅ **Audit Trail**
- All certificate actions logged
- Admin actions tracked with user ID

## Future Enhancements

- [ ] Add QR code for verification
- [ ] Support for multiple languages (AR)
- [ ] Email certificate on activation
- [ ] Bulk download for admins
- [ ] Certificate expiry notifications

## Related Files

- `scripts/membership-certificate-generator.ts` - Generator script
- `server/routes/woocommerce-webhook.ts` - Webhook integration
- `client/pages/individual/MyMembership.tsx` - UI display
- `client/src/entities/membership/membership.service.ts` - Service methods
- `supabase/migrations/20251206000002_create_membership_certificates_bucket.sql` - Storage setup
