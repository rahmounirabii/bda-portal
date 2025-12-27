/**
 * Reminder Worker
 *
 * Background worker to process exam reminders (48h and 24h)
 * Run this via cron every hour
 *
 * Usage:
 *   npm run reminder-worker
 *   or setup cron: 0 * * * * cd /path/to/bda-portal && npm run reminder-worker
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// ============================================================================
// Configuration
// ============================================================================

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

// ============================================================================
// Initialize Supabase Client
// ============================================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// ============================================================================
// Process Reminders
// ============================================================================

async function processReminders(): Promise<void> {
  console.log('🔔 Starting reminder worker...');
  const startTime = Date.now();

  try {
    // Call the database function to process all reminders
    const { data, error } = await supabase.rpc('process_all_reminders');

    if (error) {
      console.error('❌ Error processing reminders:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('📭 No reminders to process');
      return;
    }

    // Display results
    console.log('\n📊 Reminder Processing Summary:');
    console.log('─'.repeat(50));

    let totalProcessed = 0;
    let totalQueued = 0;

    data.forEach((result: any) => {
      console.log(`\n${result.reminder_type} Reminders:`);
      console.log(`  Bookings Processed: ${result.bookings_processed}`);
      console.log(`  Emails Queued: ${result.emails_queued}`);

      totalProcessed += result.bookings_processed;
      totalQueued += result.emails_queued;
    });

    console.log('\n' + '─'.repeat(50));
    console.log(`Total Bookings Processed: ${totalProcessed}`);
    console.log(`Total Emails Queued: ${totalQueued}`);

    // Get upcoming reminders for monitoring
    const { data: upcoming } = await supabase.rpc('get_upcoming_reminders');

    if (upcoming && upcoming.length > 0) {
      console.log(`\n📅 Upcoming Reminders (${upcoming.length}):`);
      console.log('─'.repeat(50));

      upcoming.slice(0, 5).forEach((reminder: any) => {
        const hours = Math.round(reminder.hours_until_exam * 10) / 10;
        const needs = [];
        if (reminder.needs_48h_reminder) needs.push('48h');
        if (reminder.needs_24h_reminder) needs.push('24h');

        console.log(`\n  ${reminder.confirmation_code}`);
        console.log(`    Email: ${reminder.user_email}`);
        console.log(`    Exam in: ${hours} hours`);
        console.log(`    Needs: ${needs.join(', ') || 'None'}`);
      });

      if (upcoming.length > 5) {
        console.log(`\n  ... and ${upcoming.length - 5} more`);
      }
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n⏱️  Duration: ${duration}s`);
    console.log('✅ Reminder worker completed\n');
  }
}

// ============================================================================
// Get Reminder Statistics
// ============================================================================

async function getReminderStats(): Promise<void> {
  console.log('📊 Fetching reminder statistics...\n');

  try {
    // Get counts by reminder status
    const { data: bookings } = await supabase
      .from('exam_bookings')
      .select('reminder_48h_sent, reminder_24h_sent, status, scheduled_start_time')
      .eq('status', 'scheduled')
      .gte('scheduled_start_time', new Date().toISOString());

    if (!bookings) {
      console.log('No upcoming bookings found');
      return;
    }

    let pending48h = 0;
    let sent48h = 0;
    let pending24h = 0;
    let sent24h = 0;

    bookings.forEach((booking: any) => {
      if (booking.reminder_48h_sent) {
        sent48h++;
      } else {
        pending48h++;
      }

      if (booking.reminder_24h_sent) {
        sent24h++;
      } else {
        pending24h++;
      }
    });

    console.log('48-hour Reminders:');
    console.log(`  ✅ Sent: ${sent48h}`);
    console.log(`  ⏳ Pending: ${pending48h}`);
    console.log('');
    console.log('24-hour Reminders:');
    console.log(`  ✅ Sent: ${sent24h}`);
    console.log(`  ⏳ Pending: ${pending24h}`);
    console.log('');
    console.log(`Total Upcoming Bookings: ${bookings.length}`);

  } catch (error) {
    console.error('Error fetching statistics:', error);
  }
}

// ============================================================================
// Test Reminder System
// ============================================================================

async function testReminderSystem(): Promise<void> {
  console.log('🧪 Testing reminder system...\n');

  try {
    // Test 1: Check if reminder functions exist
    console.log('Test 1: Checking reminder functions...');
    const { data: functions, error: funcError } = await supabase
      .rpc('get_upcoming_reminders');

    if (funcError) {
      console.error('❌ Reminder functions not available:', funcError);
      return;
    }

    console.log('✅ Reminder functions available');

    // Test 2: Check for upcoming bookings
    console.log('\nTest 2: Checking for upcoming bookings...');
    const { data: bookings, error: bookingError } = await supabase
      .from('exam_bookings')
      .select('id, scheduled_start_time, reminder_48h_sent, reminder_24h_sent')
      .eq('status', 'scheduled')
      .gte('scheduled_start_time', new Date().toISOString())
      .order('scheduled_start_time', { ascending: true })
      .limit(5);

    if (bookingError) {
      console.error('❌ Error fetching bookings:', bookingError);
      return;
    }

    if (!bookings || bookings.length === 0) {
      console.log('⚠️  No upcoming bookings found');
      console.log('   Create a test booking to test reminders');
      return;
    }

    console.log(`✅ Found ${bookings.length} upcoming bookings`);

    bookings.forEach((booking: any, index: number) => {
      const examTime = new Date(booking.scheduled_start_time);
      const hoursUntil = (examTime.getTime() - Date.now()) / (1000 * 60 * 60);

      console.log(`\n  Booking ${index + 1}:`);
      console.log(`    Exam time: ${examTime.toLocaleString()}`);
      console.log(`    Hours until: ${hoursUntil.toFixed(1)}`);
      console.log(`    48h reminder: ${booking.reminder_48h_sent ? '✅ Sent' : '⏳ Pending'}`);
      console.log(`    24h reminder: ${booking.reminder_24h_sent ? '✅ Sent' : '⏳ Pending'}`);
    });

    // Test 3: Check email queue
    console.log('\n\nTest 3: Checking email queue...');
    const { data: emails, error: emailError } = await supabase
      .from('email_queue')
      .select('template_name, status')
      .in('template_name', ['exam_reminder_48h', 'exam_reminder_24h'])
      .order('created_at', { ascending: false })
      .limit(10);

    if (emailError) {
      console.error('❌ Error fetching emails:', emailError);
      return;
    }

    if (!emails || emails.length === 0) {
      console.log('⚠️  No reminder emails in queue yet');
    } else {
      console.log(`✅ Found ${emails.length} reminder emails in queue`);

      const pending = emails.filter((e: any) => e.status === 'pending').length;
      const sent = emails.filter((e: any) => e.status === 'sent').length;
      const failed = emails.filter((e: any) => e.status === 'failed').length;

      console.log(`    Pending: ${pending}`);
      console.log(`    Sent: ${sent}`);
      console.log(`    Failed: ${failed}`);
    }

    console.log('\n✅ Reminder system test completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  // Verify configuration
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase configuration');
    console.log('   Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY');
    process.exit(1);
  }

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'test':
      await testReminderSystem();
      break;

    case 'stats':
      await getReminderStats();
      break;

    case 'process':
    default:
      await processReminders();
      break;
  }

  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { processReminders, testReminderSystem, getReminderStats };
