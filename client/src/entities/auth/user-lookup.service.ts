import { supabase } from '@/shared/config/supabase.config';

/**
 * User Lookup Service
 * Handles resolving customer emails to Supabase user IDs
 */

export interface UserLookupResult {
  user_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

export class UserLookupService {
  /**
   * Find user by email
   * Returns user_id if found, null if user doesn't exist yet
   * This is used when generating vouchers for WooCommerce customers
   */
  static async findUserByEmailForVoucher(
    email: string
  ): Promise<UserLookupResult | null> {
    try {
      // Try to find existing user
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('email', email)
        .maybeSingle();

      if (findError) {
        console.error('Error finding user:', findError);
        return null;
      }

      // User exists
      if (existingUser) {
        return {
          user_id: existingUser.id,
          email: existingUser.email,
          first_name: existingUser.first_name || undefined,
          last_name: existingUser.last_name || undefined,
        };
      }

      // User doesn't exist - they need to create an account first
      return null;
    } catch (error) {
      console.error('Exception in findUserByEmailForVoucher:', error);
      return null;
    }
  }

  /**
   * Find user by email (read-only, doesn't create)
   */
  static async findUserByEmail(email: string): Promise<{
    user_id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .eq('email', email)
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      return {
        user_id: data.id,
        email: data.email,
        first_name: data.first_name || undefined,
        last_name: data.last_name || undefined,
      };
    } catch (error) {
      console.error('Exception in findUserByEmail:', error);
      return null;
    }
  }

  /**
   * Batch lookup users by emails
   * Returns a map of email -> user_id
   */
  static async findUsersByEmails(
    emails: string[]
  ): Promise<Map<string, string>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email')
        .in('email', emails);

      if (error || !data) {
        return new Map();
      }

      const map = new Map<string, string>();
      data.forEach((user) => {
        map.set(user.email, user.id);
      });

      return map;
    } catch (error) {
      console.error('Exception in findUsersByEmails:', error);
      return new Map();
    }
  }
}
