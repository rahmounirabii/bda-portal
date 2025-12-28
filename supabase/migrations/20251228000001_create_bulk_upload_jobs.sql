-- Migration: Create bulk upload job tracking system
-- Purpose: Track bulk user upload jobs with real-time progress updates

-- ============================================================================
-- BULK UPLOAD JOBS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bulk_upload_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Job status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),

  -- Counts
  total_users INT NOT NULL DEFAULT 0,
  processed_count INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  error_count INT NOT NULL DEFAULT 0,
  skipped_count INT NOT NULL DEFAULT 0,

  -- Options
  send_welcome_email BOOLEAN NOT NULL DEFAULT true,
  activate_content BOOLEAN NOT NULL DEFAULT false,

  -- Error info
  error_message TEXT,

  -- Timestamps
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- BULK UPLOAD ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bulk_upload_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES bulk_upload_jobs(id) ON DELETE CASCADE,

  -- Row info
  row_number INT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  country_code TEXT,
  language TEXT DEFAULT 'EN',
  certification_track TEXT,

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'error', 'skipped')),
  error_message TEXT,

  -- Result
  created_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  email_queued BOOLEAN NOT NULL DEFAULT false,
  password_reset_link TEXT,

  -- Timestamps
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bulk_upload_jobs_created_by ON bulk_upload_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_jobs_status ON bulk_upload_jobs(status);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_jobs_created_at ON bulk_upload_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_bulk_upload_items_job_id ON bulk_upload_items(job_id);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_items_status ON bulk_upload_items(status);
CREATE INDEX IF NOT EXISTS idx_bulk_upload_items_email ON bulk_upload_items(email);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE bulk_upload_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulk_upload_items ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage bulk upload jobs"
  ON bulk_upload_jobs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage bulk upload items"
  ON bulk_upload_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================================
-- REALTIME
-- ============================================================================

-- Enable realtime for progress updates
ALTER PUBLICATION supabase_realtime ADD TABLE bulk_upload_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE bulk_upload_items;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at on jobs
CREATE OR REPLACE FUNCTION update_bulk_upload_job_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_bulk_upload_job_updated_at
  BEFORE UPDATE ON bulk_upload_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_bulk_upload_job_updated_at();

-- ============================================================================
-- WELCOME EMAIL TEMPLATE
-- ============================================================================

-- Insert welcome email template if email_templates table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_templates') THEN
    INSERT INTO email_templates (name, subject, html_body, text_body, variables, is_active)
    VALUES (
      'welcome_account_created',
      'Welcome to BDA Association - Your Account is Ready',
      '<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #0284c7 0%, #1e40af 50%, #1e3a5f 100%); padding: 40px 30px; text-align: center;">
        <img src="https://bda-global.org/wp-content/uploads/2024/01/bda-logo-white.png" alt="BDA Association" style="height: 50px; margin-bottom: 20px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to BDA!</h1>
      </td>
    </tr>

    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Dear {{full_name}},
        </p>
        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Your BDA Portal account has been successfully created. You can now access exclusive resources, track your certifications, and connect with the BDA community.
        </p>

        <!-- Account Info Box -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; border-radius: 8px; margin: 25px 0;">
          <tr>
            <td style="padding: 25px;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Your Account</p>
              <p style="color: #1e293b; font-size: 16px; margin: 0 0 15px;">
                <strong>Email:</strong> {{email}}
              </p>
              <p style="color: #1e293b; font-size: 16px; margin: 0;">
                <strong>Portal:</strong> <a href="{{portal_url}}" style="color: #1e40af;">{{portal_url}}</a>
              </p>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding: 10px 0 30px;">
              <a href="{{reset_password_url}}" style="display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: bold;">
                Set Your Password
              </a>
            </td>
          </tr>
        </table>

        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
          Click the button above to set your password and access your account. This link will expire in 24 hours.
        </p>

        <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 30px 0 0;">
          Best regards,<br>
          <strong>The BDA Team</strong>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #1e3a5f; padding: 30px; text-align: center;">
        <p style="color: #94a3b8; font-size: 14px; margin: 0 0 10px;">
          Business Data Analytics Association
        </p>
        <p style="color: #64748b; font-size: 12px; margin: 0;">
          &copy; 2024 BDA Association. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>',
      'Dear {{full_name}},

Your BDA Portal account has been successfully created.

Your Account:
- Email: {{email}}
- Portal: {{portal_url}}

To set your password and access your account, visit:
{{reset_password_url}}

This link will expire in 24 hours.

Best regards,
The BDA Team

---
Business Data Analytics Association
© 2024 BDA Association. All rights reserved.',
      '["full_name", "email", "portal_url", "reset_password_url"]',
      true
    )
    ON CONFLICT (name) DO UPDATE SET
      subject = EXCLUDED.subject,
      html_body = EXCLUDED.html_body,
      text_body = EXCLUDED.text_body,
      variables = EXCLUDED.variables,
      updated_at = now();
  END IF;
END $$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON bulk_upload_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON bulk_upload_items TO authenticated;
