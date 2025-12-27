/**
 * Membership Certificate PDF Generator
 *
 * Generates professional PDF certificates for Professional BDA members
 * Usage: tsx scripts/membership-certificate-generator.ts [membership_id]
 *
 * US3: Display Membership Certificate (Professional Only)
 * - PDF includes: Name, Level, Issue Date, Expiry Date, Membership ID, BDA branding
 * - Certificate must remain downloadable even after membership expiry
 * - PDF is generated and stored on activation
 */

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in environment');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// Types
// ============================================================================

interface MembershipCertificateData {
  membership_id: string;
  user_full_name: string;
  user_email: string;
  membership_type: 'basic' | 'professional';
  start_date: string;
  expiry_date: string;
  issued_date: string;
}

// ============================================================================
// HTML/CSS Membership Certificate Template
// ============================================================================

function generateMembershipCertificateHTML(data: MembershipCertificateData): string {
  const startDate = new Date(data.start_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const expiryDate = new Date(data.expiry_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const issuedDate = new Date(data.issued_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // BDA brand colors
  const lightBlue = '#2196F3';
  const darkBlue = '#1e3a5f';
  const gold = '#C9A227';
  const professionalGold = '#D4AF37';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Montserrat', 'Arial', sans-serif;
      width: 297mm;
      height: 210mm;
      background: linear-gradient(135deg, ${darkBlue} 0%, #0d1f33 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .certificate-container {
      width: 282mm;
      height: 196mm;
      background: #ffffff;
      position: relative;
      overflow: hidden;
    }

    /* Decorative corner elements */
    .corner-decoration {
      position: absolute;
      width: 100px;
      height: 100px;
    }
    .corner-decoration.top-left {
      top: 20px;
      left: 20px;
      border-top: 4px solid ${professionalGold};
      border-left: 4px solid ${professionalGold};
    }
    .corner-decoration.top-right {
      top: 20px;
      right: 20px;
      border-top: 4px solid ${professionalGold};
      border-right: 4px solid ${professionalGold};
    }
    .corner-decoration.bottom-left {
      bottom: 20px;
      left: 20px;
      border-bottom: 4px solid ${professionalGold};
      border-left: 4px solid ${professionalGold};
    }
    .corner-decoration.bottom-right {
      bottom: 20px;
      right: 20px;
      border-bottom: 4px solid ${professionalGold};
      border-right: 4px solid ${professionalGold};
    }

    /* Subtle background pattern */
    .background-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        radial-gradient(circle at 15% 85%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 85% 15%, rgba(33, 150, 243, 0.05) 0%, transparent 50%);
      z-index: 0;
    }

    .certificate-content {
      position: relative;
      z-index: 10;
      text-align: center;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 30px 50px;
    }

    /* Header with decorative line */
    .header {
      margin-bottom: 10px;
    }

    .header-line {
      width: 100%;
      height: 5px;
      background: linear-gradient(to right, transparent, ${professionalGold}, ${darkBlue}, ${professionalGold}, transparent);
      margin-bottom: 25px;
    }

    .certificate-label {
      font-size: 12px;
      font-weight: 600;
      color: ${professionalGold};
      letter-spacing: 8px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .certificate-title {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-size: 52px;
      font-weight: 700;
      color: ${darkBlue};
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .certificate-subtitle {
      font-size: 16px;
      font-weight: 400;
      color: #666;
      letter-spacing: 2px;
    }

    /* Main content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 20px 0;
    }

    .membership-type-label {
      font-size: 14px;
      font-weight: 500;
      color: #888;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 12px;
    }

    .membership-badge {
      display: inline-block;
      background: linear-gradient(135deg, ${professionalGold} 0%, #DAA520 100%);
      color: white;
      padding: 15px 50px;
      border-radius: 50px;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 3px;
      margin: 15px 0;
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.4);
      text-transform: uppercase;
    }

    .presented-to {
      font-size: 14px;
      font-weight: 400;
      color: #888;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin: 20px 0 10px;
    }

    .recipient-name {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-size: 56px;
      font-weight: 600;
      color: ${darkBlue};
      margin: 15px 0 20px;
      position: relative;
      display: inline-block;
    }

    .recipient-name::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 50%;
      transform: translateX(-50%);
      width: 70%;
      height: 3px;
      background: linear-gradient(to right, transparent, ${professionalGold}, transparent);
    }

    .membership-description {
      font-size: 15px;
      color: #555;
      line-height: 1.9;
      max-width: 700px;
      margin: 20px auto;
    }

    .membership-id-section {
      margin: 18px 0;
    }

    .membership-id-label {
      font-size: 11px;
      color: #999;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .membership-id {
      font-size: 24px;
      font-weight: 700;
      color: ${professionalGold};
      letter-spacing: 4px;
      font-family: 'Montserrat', monospace;
    }

    /* Footer */
    .footer-section {
      margin-top: auto;
    }

    .dates-row {
      display: flex;
      justify-content: center;
      gap: 80px;
      margin-bottom: 20px;
    }

    .date-item {
      text-align: center;
    }

    .date-label {
      font-size: 10px;
      color: #999;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .date-value {
      font-size: 14px;
      font-weight: 600;
      color: ${darkBlue};
    }

    .signatures-row {
      display: flex;
      justify-content: space-around;
      padding: 0 100px;
      margin-bottom: 20px;
    }

    .signature-block {
      text-align: center;
      min-width: 200px;
    }

    .signature-line {
      width: 180px;
      height: 2px;
      background: linear-gradient(to right, transparent, #ccc, transparent);
      margin: 0 auto 10px;
    }

    .signature-name {
      font-size: 14px;
      font-weight: 700;
      color: ${darkBlue};
      margin-bottom: 3px;
    }

    .signature-title {
      font-size: 11px;
      color: #888;
      font-weight: 400;
    }

    /* Logo at bottom */
    .logo-section {
      margin-top: 15px;
      padding-top: 15px;
      border-top: 2px solid #eee;
    }

    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
    }

    .logo-text {
      display: flex;
      align-items: baseline;
    }

    .logo-b {
      font-size: 40px;
      font-weight: 700;
      color: ${lightBlue};
      font-family: 'Montserrat', sans-serif;
    }

    .logo-da {
      font-size: 40px;
      font-weight: 700;
      color: ${darkBlue};
      font-family: 'Montserrat', sans-serif;
    }

    .logo-full-name {
      font-size: 11px;
      font-weight: 600;
      color: #666;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-left: 15px;
    }

    .verification-url {
      font-size: 10px;
      color: #aaa;
      margin-top: 10px;
      letter-spacing: 1px;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-25deg);
      font-size: 200px;
      font-weight: 700;
      color: rgba(212, 175, 55, 0.04);
      z-index: 1;
      letter-spacing: 30px;
      font-family: 'Montserrat', sans-serif;
    }

    /* Seal/Badge decoration */
    .seal {
      position: absolute;
      bottom: 70px;
      right: 70px;
      width: 90px;
      height: 90px;
      border: 4px solid ${professionalGold};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fff 0%, #faf8f0 100%);
    }

    .seal-inner {
      width: 70px;
      height: 70px;
      border: 2px solid ${professionalGold};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }

    .seal-text {
      font-size: 9px;
      font-weight: 700;
      color: ${darkBlue};
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .seal-year {
      font-size: 16px;
      font-weight: 700;
      color: ${professionalGold};
      margin-top: 2px;
    }

    /* Professional Badge Icon */
    .professional-crown {
      position: absolute;
      top: 70px;
      right: 70px;
      font-size: 50px;
      color: ${professionalGold};
      opacity: 0.15;
    }
  </style>
</head>
<body>
  <div class="certificate-container">
    <!-- Background pattern -->
    <div class="background-pattern"></div>

    <!-- Corner decorations -->
    <div class="corner-decoration top-left"></div>
    <div class="corner-decoration top-right"></div>
    <div class="corner-decoration bottom-left"></div>
    <div class="corner-decoration bottom-right"></div>

    <!-- Watermark -->
    <div class="watermark">BDA</div>

    <!-- Professional Crown Icon -->
    <div class="professional-crown">★</div>

    <!-- Seal -->
    <div class="seal">
      <div class="seal-inner">
        <span class="seal-text">Member</span>
        <span class="seal-year">${new Date(data.start_date).getFullYear()}</span>
      </div>
    </div>

    <div class="certificate-content">
      <!-- Header -->
      <div class="header">
        <div class="header-line"></div>
        <div class="certificate-label">Official Membership Certificate</div>
        <div class="certificate-title">Certificate of Membership</div>
        <div class="certificate-subtitle">Business Development Association</div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="membership-type-label">This certifies that</div>

        <div class="recipient-name">${data.user_full_name}</div>

        <div class="membership-description">
          is a valued member in good standing of the Business Development Association,
          having been granted the status of
        </div>

        <div class="membership-badge">Professional Member</div>

        <div class="membership-description">
          with all rights, privileges, and benefits accorded to members of this class
        </div>

        <div class="membership-id-section">
          <div class="membership-id-label">Membership ID</div>
          <div class="membership-id">${data.membership_id}</div>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <div class="dates-row">
          <div class="date-item">
            <div class="date-label">Membership Start</div>
            <div class="date-value">${startDate}</div>
          </div>
          <div class="date-item">
            <div class="date-label">Date Issued</div>
            <div class="date-value">${issuedDate}</div>
          </div>
          <div class="date-item">
            <div class="date-label">Valid Until</div>
            <div class="date-value">${expiryDate}</div>
          </div>
        </div>

        <div class="signatures-row">
          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-name">Dr. Sarah Johnson</div>
            <div class="signature-title">President, BDA</div>
          </div>

          <div class="signature-block">
            <div class="signature-line"></div>
            <div class="signature-name">Prof. Michael Chen</div>
            <div class="signature-title">Director of Membership</div>
          </div>
        </div>

        <!-- Logo Section at Bottom -->
        <div class="logo-section">
          <div class="logo-container">
            <div class="logo-text">
              <span class="logo-b">B</span><span class="logo-da">DA</span>
            </div>
            <div class="logo-full-name">Business Development Association</div>
          </div>
          <div class="verification-url">
            portal.bda-global.org • membership@bda-global.org
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

// ============================================================================
// Get Membership Certificate Data
// ============================================================================

async function getMembershipCertificateData(
  membershipId: string
): Promise<MembershipCertificateData | null> {
  const { data, error } = await supabase
    .from('user_memberships')
    .select(`
      membership_id,
      membership_type,
      start_date,
      expiry_date,
      created_at,
      user:users!user_memberships_user_id_fkey(
        first_name,
        last_name,
        email
      )
    `)
    .eq('id', membershipId)
    .single();

  if (error) {
    console.error('❌ Error fetching membership:', error.message);
    return null;
  }

  if (!data) {
    console.error('❌ Membership not found:', membershipId);
    return null;
  }

  if (data.membership_type !== 'professional') {
    console.error('❌ Certificates are only available for Professional members');
    return null;
  }

  const user = data.user as any;

  return {
    membership_id: data.membership_id,
    user_full_name: `${user.first_name} ${user.last_name}`.trim() || 'Member',
    user_email: user.email,
    membership_type: data.membership_type,
    start_date: data.start_date,
    expiry_date: data.expiry_date,
    issued_date: data.created_at,
  };
}

// ============================================================================
// Convert HTML to PDF
// ============================================================================

async function generatePDFFromHTML(html: string, outputPath: string): Promise<boolean> {
  try {
    console.log('  🌐 Launching browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // Set viewport for landscape A4
    await page.setViewport({
      width: 1123, // A4 landscape width in pixels at 96 DPI
      height: 794, // A4 landscape height in pixels at 96 DPI
    });

    console.log('  📝 Loading certificate HTML...');
    await page.setContent(html, { waitUntil: 'networkidle0' });

    console.log('  🖨️  Generating PDF...');
    await page.pdf({
      path: outputPath,
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });

    await browser.close();

    console.log(`  ✅ PDF saved to: ${outputPath}`);

    return true;
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return false;
  }
}

// ============================================================================
// Upload Certificate to Supabase Storage
// ============================================================================

async function uploadMembershipCertificate(
  membershipIdCode: string,
  membershipRecordId: string,
  filePath: string
): Promise<string | null> {
  try {
    const fileName = `${membershipIdCode}.pdf`;
    // Store in membership-certificates bucket
    const storagePath = fileName;

    const fileBuffer = fs.readFileSync(filePath);

    console.log(`  📤 Uploading to membership-certificates/${storagePath}...`);

    const { data, error } = await supabase.storage
      .from('membership-certificates')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      console.error('❌ Error uploading certificate:', error.message);
      return null;
    }

    console.log('  ✅ Upload successful');

    // Store the storage path (not public URL) - we'll use signed URLs for access
    const storageReference = storagePath;

    // Update membership record with storage path
    const { error: updateError } = await supabase
      .from('user_memberships')
      .update({
        certificate_url: storageReference,
        updated_at: new Date().toISOString()
      })
      .eq('id', membershipRecordId);

    if (updateError) {
      console.warn('⚠️  Warning: Could not update certificate URL:', updateError.message);
    } else {
      console.log('  ✅ Database updated with certificate path');
    }

    return storageReference;
  } catch (error) {
    console.error('❌ Error in upload process:', error);
    return null;
  }
}

// ============================================================================
// Generate Membership Certificate
// ============================================================================

async function generateMembershipCertificate(membershipId: string): Promise<void> {
  console.log(`\n👑 Generating Professional Membership certificate for: ${membershipId}\n`);

  // 1. Get membership data
  console.log('📋 Fetching membership data...');
  const data = await getMembershipCertificateData(membershipId);

  if (!data) {
    console.error('❌ Failed to get membership data');
    return;
  }

  console.log('✅ Membership data retrieved');
  console.log(`   Member: ${data.user_full_name}`);
  console.log(`   Type: ${data.membership_type}`);
  console.log(`   Membership ID: ${data.membership_id}`);
  console.log(`   Valid: ${data.start_date} to ${data.expiry_date}`);

  // 2. Generate HTML
  console.log('\n📝 Generating certificate HTML...');
  const html = generateMembershipCertificateHTML(data);

  // 3. Create output directory
  const outputDir = path.join(process.cwd(), 'membership-certificates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 4. Generate PDF
  const outputPath = path.join(outputDir, `${data.membership_id}.pdf`);
  console.log(`\n🖨️  Generating PDF...`);
  const success = await generatePDFFromHTML(html, outputPath);

  if (!success) {
    console.error('❌ Failed to generate PDF');
    return;
  }

  // 5. Upload to Supabase Storage
  console.log('\n☁️  Uploading to Supabase...');
  const publicUrl = await uploadMembershipCertificate(data.membership_id, membershipId, outputPath);

  if (publicUrl) {
    console.log(`✅ Membership certificate uploaded successfully!`);
    console.log(`   URL: ${publicUrl}`);
  } else {
    console.log('⚠️  Upload skipped or failed - certificate saved locally');
  }

  console.log('\n✅ Membership certificate generation complete!\n');
}

// ============================================================================
// Generate All Pending Membership Certificates
// ============================================================================

async function generateAllPendingMembershipCertificates(): Promise<void> {
  console.log('\n👑 Generating all pending Professional membership certificates...\n');

  // Get all professional memberships without certificate URLs
  const { data: memberships, error } = await supabase
    .from('user_memberships')
    .select('id, membership_id, certificate_url')
    .eq('membership_type', 'professional')
    .is('certificate_url', null)
    .limit(100);

  if (error) {
    console.error('❌ Error fetching memberships:', error.message);
    return;
  }

  if (!memberships || memberships.length === 0) {
    console.log('✅ No pending membership certificates found');
    return;
  }

  console.log(`📋 Found ${memberships.length} membership certificates to generate\n`);

  for (const membership of memberships) {
    await generateMembershipCertificate(membership.id);
    console.log('---\n');
  }

  console.log(`✅ Completed generating ${memberships.length} membership certificates\n`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const membershipId = process.argv[2];

  if (membershipId) {
    // Generate specific membership certificate
    await generateMembershipCertificate(membershipId);
  } else {
    // Generate all pending membership certificates
    await generateAllPendingMembershipCertificates();
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
