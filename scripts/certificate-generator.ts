/**
 * Certificate PDF Generator
 *
 * Generates professional PDF certificates for passed exams
 * Usage: tsx scripts/certificate-generator.ts [credential_id]
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

interface CertificateData {
  credential_id: string;
  user_full_name: string;
  user_email: string;
  certification_type: string;
  issued_date: string;
  expiry_date: string;
  exam_title: string | null;
  exam_score: number | null;
  exam_date: string | null;
}

// ============================================================================
// HTML/CSS Certificate Template
// ============================================================================

function generateCertificateHTML(data: CertificateData): string {
  const issuedDate = new Date(data.issued_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const expiryDate = new Date(data.expiry_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const certFullName =
    data.certification_type === 'CP'
      ? 'Certified Professional (CP™)'
      : 'Senior Certified Professional (SCP™)';

  // BDA brand colors
  const lightBlue = '#2196F3';
  const darkBlue = '#1e3a5f';
  const gold = '#C9A227';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap" rel="stylesheet">
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
      width: 80px;
      height: 80px;
    }
    .corner-decoration.top-left {
      top: 15px;
      left: 15px;
      border-top: 3px solid ${gold};
      border-left: 3px solid ${gold};
    }
    .corner-decoration.top-right {
      top: 15px;
      right: 15px;
      border-top: 3px solid ${gold};
      border-right: 3px solid ${gold};
    }
    .corner-decoration.bottom-left {
      bottom: 15px;
      left: 15px;
      border-bottom: 3px solid ${gold};
      border-left: 3px solid ${gold};
    }
    .corner-decoration.bottom-right {
      bottom: 15px;
      right: 15px;
      border-bottom: 3px solid ${gold};
      border-right: 3px solid ${gold};
    }

    /* Subtle background pattern */
    .background-pattern {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image:
        radial-gradient(circle at 20% 80%, rgba(33, 150, 243, 0.03) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(30, 58, 95, 0.03) 0%, transparent 50%);
      z-index: 0;
    }

    .certificate-content {
      position: relative;
      z-index: 10;
      text-align: center;
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 25px 40px;
    }

    /* Header with decorative line */
    .header {
      margin-bottom: 8px;
    }

    .header-line {
      width: 100%;
      height: 4px;
      background: linear-gradient(to right, transparent, ${lightBlue}, ${darkBlue}, ${lightBlue}, transparent);
      margin-bottom: 20px;
    }

    .certificate-label {
      font-size: 11px;
      font-weight: 500;
      color: ${gold};
      letter-spacing: 6px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }

    .certificate-title {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-size: 42px;
      font-weight: 700;
      color: ${darkBlue};
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .certificate-subtitle {
      font-size: 14px;
      font-weight: 300;
      color: #666;
      letter-spacing: 1px;
    }

    /* Main content */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 10px 0;
    }

    .presented-to {
      font-size: 13px;
      font-weight: 400;
      color: #888;
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .recipient-name {
      font-family: 'Playfair Display', 'Georgia', serif;
      font-size: 48px;
      font-weight: 600;
      color: ${darkBlue};
      margin: 10px 0 15px;
      position: relative;
      display: inline-block;
    }

    .recipient-name::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      width: 60%;
      height: 2px;
      background: linear-gradient(to right, transparent, ${gold}, transparent);
    }

    .achievement-text {
      font-size: 14px;
      color: #555;
      line-height: 1.8;
      max-width: 600px;
      margin: 15px auto;
    }

    .certification-badge {
      display: inline-block;
      background: linear-gradient(135deg, ${darkBlue} 0%, ${lightBlue} 100%);
      color: white;
      padding: 12px 40px;
      border-radius: 50px;
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 2px;
      margin: 15px 0;
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.3);
    }

    .credential-section {
      margin: 12px 0;
    }

    .credential-label {
      font-size: 10px;
      color: #999;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 5px;
    }

    .credential-id {
      font-size: 20px;
      font-weight: 600;
      color: ${gold};
      letter-spacing: 3px;
      font-family: 'Montserrat', monospace;
    }

    .exam-score {
      font-size: 12px;
      color: #666;
      margin-top: 8px;
    }

    .exam-score strong {
      color: ${darkBlue};
      font-weight: 600;
    }

    /* Footer */
    .footer-section {
      margin-top: auto;
    }

    .dates-row {
      display: flex;
      justify-content: center;
      gap: 60px;
      margin-bottom: 15px;
    }

    .date-item {
      text-align: center;
    }

    .date-label {
      font-size: 9px;
      color: #999;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 3px;
    }

    .date-value {
      font-size: 13px;
      font-weight: 500;
      color: ${darkBlue};
    }

    .signatures-row {
      display: flex;
      justify-content: space-around;
      padding: 0 80px;
      margin-bottom: 15px;
    }

    .signature-block {
      text-align: center;
      min-width: 180px;
    }

    .signature-line {
      width: 160px;
      height: 1px;
      background: linear-gradient(to right, transparent, #ccc, transparent);
      margin: 0 auto 8px;
    }

    .signature-name {
      font-size: 13px;
      font-weight: 600;
      color: ${darkBlue};
      margin-bottom: 2px;
    }

    .signature-title {
      font-size: 10px;
      color: #888;
      font-weight: 400;
    }

    /* Logo at bottom */
    .logo-section {
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px solid #eee;
    }

    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .logo-text {
      display: flex;
      align-items: baseline;
    }

    .logo-b {
      font-size: 36px;
      font-weight: 700;
      color: ${lightBlue};
      font-family: 'Montserrat', sans-serif;
    }

    .logo-da {
      font-size: 36px;
      font-weight: 700;
      color: ${darkBlue};
      font-family: 'Montserrat', sans-serif;
    }

    .logo-full-name {
      font-size: 10px;
      font-weight: 500;
      color: #666;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-left: 15px;
    }

    .verification-url {
      font-size: 9px;
      color: #aaa;
      margin-top: 8px;
      letter-spacing: 1px;
    }

    /* Watermark */
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 180px;
      font-weight: 700;
      color: rgba(33, 150, 243, 0.03);
      z-index: 1;
      letter-spacing: 20px;
      font-family: 'Montserrat', sans-serif;
    }

    /* Seal/Badge decoration */
    .seal {
      position: absolute;
      bottom: 60px;
      right: 60px;
      width: 80px;
      height: 80px;
      border: 3px solid ${gold};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #fff 0%, #f9f6f0 100%);
    }

    .seal-inner {
      width: 60px;
      height: 60px;
      border: 1px solid ${gold};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }

    .seal-text {
      font-size: 8px;
      font-weight: 600;
      color: ${darkBlue};
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .seal-year {
      font-size: 14px;
      font-weight: 700;
      color: ${gold};
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
    <div class="watermark">${data.certification_type}</div>

    <!-- Seal -->
    <div class="seal">
      <div class="seal-inner">
        <span class="seal-text">Certified</span>
        <span class="seal-year">${new Date(data.issued_date).getFullYear()}</span>
      </div>
    </div>

    <div class="certificate-content">
      <!-- Header -->
      <div class="header">
        <div class="header-line"></div>
        <div class="certificate-label">Official Certificate</div>
        <div class="certificate-title">Certificate of Achievement</div>
        <div class="certificate-subtitle">Professional Certification Program</div>
      </div>

      <!-- Main Content -->
      <div class="main-content">
        <div class="presented-to">This is to certify that</div>

        <div class="recipient-name">${data.user_full_name}</div>

        <div class="achievement-text">
          has successfully completed all requirements and demonstrated exceptional competence
          in the field of Business Development, thereby earning the professional designation of
        </div>

        <div class="certification-badge">${certFullName}</div>

        <div class="credential-section">
          <div class="credential-label">Credential ID</div>
          <div class="credential-id">${data.credential_id}</div>
        </div>

        ${data.exam_score ? `
        <div class="exam-score">
          Examination Score: <strong>${data.exam_score}%</strong>
        </div>
        ` : ''}
      </div>

      <!-- Footer -->
      <div class="footer-section">
        <div class="dates-row">
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
            <div class="signature-title">Chief Certification Officer</div>
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
            Verify at: portal.bda-association.com/verify/${data.credential_id}
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
// Get Certificate Data
// ============================================================================

async function getCertificateData(
  credentialId: string
): Promise<CertificateData | null> {
  const { data, error } = await supabase.rpc('get_certificate_details', {
    p_credential_id: credentialId,
  });

  if (error) {
    console.error('❌ Error fetching certificate:', error.message);
    return null;
  }

  if (!data || data.length === 0) {
    console.error('❌ Certificate not found:', credentialId);
    return null;
  }

  return data[0] as CertificateData;
}

// ============================================================================
// Convert HTML to PDF (using Puppeteer or similar)
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

    // Also save HTML for reference
    const htmlPath = outputPath.replace('.pdf', '.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`  📄 HTML saved to: ${htmlPath}`);

    return true;
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    return false;
  }
}

// ============================================================================
// Upload Certificate to Supabase Storage
// ============================================================================

async function uploadCertificate(
  credentialId: string,
  filePath: string
): Promise<string | null> {
  try {
    const fileName = `${credentialId}.pdf`;
    // Store directly in bucket root (bucket is already called 'certificates')
    const storagePath = fileName;

    const fileBuffer = fs.readFileSync(filePath);

    console.log(`  📤 Uploading to certificates/${storagePath}...`);

    const { data, error } = await supabase.storage
      .from('certificates')
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

    // Update certificate record with storage path
    const { error: updateError } = await supabase
      .from('user_certifications')
      .update({ certificate_url: storageReference })
      .eq('credential_id', credentialId);

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
// Generate Certificate
// ============================================================================

async function generateCertificate(credentialId: string): Promise<void> {
  console.log(`\n🎓 Generating certificate for: ${credentialId}\n`);

  // 1. Get certificate data
  console.log('📋 Fetching certificate data...');
  const data = await getCertificateData(credentialId);

  if (!data) {
    console.error('❌ Failed to get certificate data');
    return;
  }

  console.log('✅ Certificate data retrieved');
  console.log(`   Recipient: ${data.user_full_name}`);
  console.log(`   Type: ${data.certification_type}`);
  console.log(`   Issued: ${data.issued_date}`);

  // 2. Generate HTML
  console.log('\n📝 Generating certificate HTML...');
  const html = generateCertificateHTML(data);

  // 3. Create output directory
  const outputDir = path.join(process.cwd(), 'certificates');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 4. Generate PDF
  const outputPath = path.join(outputDir, `${credentialId}.pdf`);
  console.log(`\n🖨️  Generating PDF...`);
  const success = await generatePDFFromHTML(html, outputPath);

  if (!success) {
    console.error('❌ Failed to generate PDF');
    return;
  }

  // 5. Upload to Supabase Storage
  console.log('\n☁️  Uploading to Supabase...');
  const publicUrl = await uploadCertificate(credentialId, outputPath);

  if (publicUrl) {
    console.log(`✅ Certificate uploaded successfully!`);
    console.log(`   URL: ${publicUrl}`);
  } else {
    console.log('⚠️  Upload skipped or failed - certificate saved locally');
  }

  console.log('\n✅ Certificate generation complete!\n');
}

// ============================================================================
// Generate All Pending Certificates
// ============================================================================

async function generateAllPendingCertificates(): Promise<void> {
  console.log('\n🎓 Generating all pending certificates...\n');

  // Get all certificates without URLs
  const { data: certificates, error } = await supabase
    .from('user_certifications')
    .select('credential_id, certificate_url')
    .is('certificate_url', null)
    .eq('status', 'active')
    .limit(100);

  if (error) {
    console.error('❌ Error fetching certificates:', error.message);
    return;
  }

  if (!certificates || certificates.length === 0) {
    console.log('✅ No pending certificates found');
    return;
  }

  console.log(`📋 Found ${certificates.length} certificates to generate\n`);

  for (const cert of certificates) {
    await generateCertificate(cert.credential_id);
    console.log('---\n');
  }

  console.log(`✅ Completed generating ${certificates.length} certificates\n`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const credentialId = process.argv[2];

  if (credentialId) {
    // Generate specific certificate
    await generateCertificate(credentialId);
  } else {
    // Generate all pending certificates
    await generateAllPendingCertificates();
  }
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
