/**
 * Auth Storage Service
 * Handles localStorage operations for authentication
 * Security: Only stores email, NEVER password
 */

const STORAGE_KEYS = {
  LAST_EMAIL: 'bda-portal.last-email',
  REMEMBER_EMAIL: 'bda-portal.remember-email',
} as const;

/**
 * Service for managing authentication-related localStorage
 *
 * Security considerations:
 * - Only email is stored, NEVER password
 * - Email is cleared on explicit logout
 * - Optional feature (user can disable)
 */
export class AuthStorageService {
  /**
   * Save email to localStorage for auto-fill
   * Only called after SUCCESSFUL login
   *
   * @param email - User's email address
   */
  static saveLastEmail(email: string): void {
    try {
      // Validate email format
      if (!this.isValidEmail(email)) {
        console.warn('⚠️ [AuthStorage] Invalid email format, not saving:', email);
        return;
      }

      // Store email and remember preference
      localStorage.setItem(STORAGE_KEYS.LAST_EMAIL, email);
      localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, 'true');

      console.log('✅ [AuthStorage] Email saved for auto-fill');
    } catch (error) {
      console.warn('⚠️ [AuthStorage] Failed to save email:', error);
    }
  }

  /**
   * Get last used email if remember is enabled
   *
   * @returns Email address or null
   */
  static getLastEmail(): string | null {
    try {
      const remember = localStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL);
      if (remember !== 'true') {
        return null;
      }

      const email = localStorage.getItem(STORAGE_KEYS.LAST_EMAIL);

      // Validate email before returning
      if (email && this.isValidEmail(email)) {
        console.log('📧 [AuthStorage] Loaded saved email for auto-fill');
        return email;
      }

      return null;
    } catch (error) {
      console.warn('⚠️ [AuthStorage] Failed to get email:', error);
      return null;
    }
  }

  /**
   * Clear saved email
   * Called on explicit logout or when user unchecks "remember me"
   */
  static clearLastEmail(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.LAST_EMAIL);
      localStorage.removeItem(STORAGE_KEYS.REMEMBER_EMAIL);
      console.log('🧹 [AuthStorage] Cleared saved email');
    } catch (error) {
      console.warn('⚠️ [AuthStorage] Failed to clear email:', error);
    }
  }

  /**
   * Check if remember email is enabled
   *
   * @returns true if remember is enabled
   */
  static isRememberEnabled(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEYS.REMEMBER_EMAIL) === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Set remember email preference
   *
   * @param enabled - Whether to remember email
   */
  static setRememberPreference(enabled: boolean): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REMEMBER_EMAIL, enabled ? 'true' : 'false');

      if (!enabled) {
        // Clear email if remember is disabled
        localStorage.removeItem(STORAGE_KEYS.LAST_EMAIL);
      }

      console.log('💾 [AuthStorage] Remember preference set:', enabled);
    } catch (error) {
      console.warn('⚠️ [AuthStorage] Failed to set preference:', error);
    }
  }

  /**
   * Validate email format
   *
   * @param email - Email to validate
   * @returns true if valid email format
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Clear all auth storage
   * For cleanup or privacy purposes
   */
  static clearAll(): void {
    try {
      this.clearLastEmail();
      console.log('🧹 [AuthStorage] Cleared all auth storage');
    } catch (error) {
      console.warn('⚠️ [AuthStorage] Failed to clear all storage:', error);
    }
  }

  /**
   * Get storage status for debugging
   */
  static getStatus(): {
    rememberEnabled: boolean;
    hasStoredEmail: boolean;
    email: string | null;
  } {
    return {
      rememberEnabled: this.isRememberEnabled(),
      hasStoredEmail: !!localStorage.getItem(STORAGE_KEYS.LAST_EMAIL),
      email: this.getLastEmail(),
    };
  }
}
