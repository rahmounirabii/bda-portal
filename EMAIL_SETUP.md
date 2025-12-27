# Email Notification System Setup

## Overview

The BDA certification system includes an automated email notification system for:
- Booking confirmations
- 48-hour exam reminders
- 24-hour exam reminders

## Architecture

1. **Database Layer**: Email queue table with automatic triggers
2. **Service Layer**: TypeScript service for queueing emails
3. **Worker Layer**: Background process that sends queued emails

## Setup Instructions

### 1. Apply Database Migration

```bash
cd bda-portal
npx supabase db push
```

This creates:
- `email_queue` table
- Email templates function
- Automatic trigger for booking confirmations

### 2. Configure SMTP Settings

Add these environment variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Sender
FROM_EMAIL=noreply@bda-association.com
FROM_NAME=BDA Association

# Supabase Service Key (for worker)
SUPABASE_SERVICE_KEY=your-service-key-here
```

### 3. Gmail Configuration (if using Gmail)

If using Gmail, you need to:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated password
   - Use this as `SMTP_PASS`

### 4. Alternative Email Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-smtp-username
SMTP_PASS=your-aws-smtp-password
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

### 5. Install Dependencies

```bash
npm install nodemailer @types/nodemailer dotenv
```

### 6. Run Email Worker

#### Manual Run (for testing)
```bash
npm run email-worker
```

#### Setup Cron Job (recommended for production)

Add to crontab (edit with `crontab -e`):

```bash
# Run email worker every minute
* * * * * cd /path/to/bda-association/bda-portal && npm run email-worker >> /var/log/bda-email-worker.log 2>&1

# Or every 5 minutes (recommended)
*/5 * * * * cd /path/to/bda-association/bda-portal && npm run email-worker >> /var/log/bda-email-worker.log 2>&1
```

#### Setup Systemd Service (alternative to cron)

Create `/etc/systemd/system/bda-email-worker.service`:

```ini
[Unit]
Description=BDA Email Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/bda-association/bda-portal
ExecStart=/usr/bin/npm run email-worker
Restart=always
RestartSec=60

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl daemon-reload
sudo systemctl enable bda-email-worker
sudo systemctl start bda-email-worker
```

## Testing

### 1. Test Email Configuration

Create a test script `scripts/test-email.ts`:

```typescript
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function testEmail() {
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful');

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: 'your-test-email@example.com',
      subject: 'BDA Email System Test',
      text: 'This is a test email from the BDA certification system.',
      html: '<p>This is a test email from the <strong>BDA certification system</strong>.</p>',
    });

    console.log('✅ Test email sent:', info.messageId);
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEmail();
```

Run:
```bash
npx ts-node scripts/test-email.ts
```

### 2. Test Booking Confirmation

1. Create a test booking through the UI
2. Check `email_queue` table:
   ```sql
   SELECT * FROM public.email_queue ORDER BY created_at DESC LIMIT 10;
   ```
3. Run the email worker:
   ```bash
   npm run email-worker
   ```
4. Verify email was sent (check `status = 'sent'`)

## Monitoring

### Check Email Queue Status

```sql
-- Get queue statistics
SELECT
    status,
    COUNT(*) as count,
    MAX(created_at) as latest
FROM public.email_queue
GROUP BY status;

-- Get failed emails
SELECT
    id,
    recipient_email,
    template_name,
    error_message,
    attempts,
    created_at
FROM public.email_queue
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Get pending emails
SELECT
    id,
    recipient_email,
    template_name,
    scheduled_for,
    attempts
FROM public.email_queue
WHERE status IN ('pending', 'retrying')
ORDER BY priority ASC, scheduled_for ASC;
```

### View Worker Logs

```bash
# If using cron
tail -f /var/log/bda-email-worker.log

# If using systemd
sudo journalctl -u bda-email-worker -f
```

## Email Templates

Templates are stored in the database function `get_email_template()`. To modify:

1. Edit the migration file: `20251105000006_create_email_notification_system.sql`
2. Update the template HTML/text
3. Create a new migration or manually update the function

### Available Templates

1. **booking_confirmation**: Sent immediately after booking
2. **exam_reminder_48h**: Sent 48 hours before exam
3. **exam_reminder_24h**: Sent 24 hours before exam

### Template Variables

Each template supports variables using `{{variable_name}}` syntax:

**booking_confirmation**:
- `{{candidate_name}}`
- `{{confirmation_code}}`
- `{{exam_date}}`
- `{{exam_time}}`
- `{{timezone}}`
- `{{duration}}`
- `{{exam_title}}`
- `{{dashboard_url}}`

**exam_reminder_48h / exam_reminder_24h**:
- `{{candidate_name}}`
- `{{exam_date}}`
- `{{exam_time}}`
- `{{confirmation_code}}`
- `{{dashboard_url}}`

## Troubleshooting

### Emails Not Sending

1. Check SMTP credentials:
   ```bash
   npm run test-email
   ```

2. Check email queue:
   ```sql
   SELECT * FROM email_queue WHERE status = 'failed';
   ```

3. Check worker logs

4. Verify firewall allows outbound SMTP (port 587/465)

### Gmail Specific Issues

- **"Less secure apps"**: Use App Passwords instead
- **Rate limiting**: Gmail limits to ~500 emails/day for free accounts
- **Blocked sign-in**: Check Gmail security settings

### High Queue Backlog

If you have thousands of pending emails:

```bash
# Run worker with higher batch size
BATCH_SIZE=50 npm run email-worker

# Or run multiple workers in parallel
npm run email-worker & npm run email-worker & npm run email-worker
```

## Production Recommendations

1. **Use a dedicated email service**: SendGrid, AWS SES, Mailgun (more reliable than Gmail)
2. **Monitor queue size**: Set up alerts if pending count > 100
3. **Run worker frequently**: Every 1-5 minutes
4. **Enable retry logic**: Already built-in (3 attempts by default)
5. **Log retention**: Clean up old sent emails after 90 days:
   ```sql
   DELETE FROM email_queue
   WHERE status = 'sent'
   AND sent_at < NOW() - INTERVAL '90 days';
   ```

## Security Considerations

1. Never commit `.env` file with SMTP credentials
2. Use service account keys (not personal email passwords)
3. Enable RLS policies on `email_queue` table (already configured)
4. Rotate SMTP passwords regularly
5. Monitor for suspicious email activity

## Next Steps

After email system is working:
- Implement reminder scheduling (Step 5)
- Test complete booking flow
- Monitor email delivery rates
- Adjust templates based on user feedback
