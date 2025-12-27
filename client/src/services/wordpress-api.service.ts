/**
 * WordPress API Service
 * Handles communication with WordPress store backend
 */

import { API_CONFIG } from '../config/api.config';
import { fetchWithRetry, isNetworkError } from '@/shared/utils/network-retry';

export interface WordPressUser {
  wp_user_id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  bda_role?: string;
  bda_organization?: string;
  portal_active?: boolean;
}

export interface WordPressResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class WordPressAPIService {
  private static get baseURL() {
    return API_CONFIG.wordpress.baseURL;
  }

  private static get apiKey() {
    return API_CONFIG.wordpress.apiKey;
  }

  /**
   * Vérifier les credentials utilisateur dans WordPress
   */
  static async verifyCredentials(email: string, password: string): Promise<WordPressResponse<{
    user_data: WordPressUser;
    needs_portal_account: boolean;
  }>> {
    try {
      const response = await fetchWithRetry(
        `${this.baseURL}/auth/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BDA-API-Key': this.apiKey,
          },
          body: JSON.stringify({
            email,
            password,
          }),
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`🔄 [WordPressAPI] Retrying verifyCredentials (attempt ${attempt})...`);
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Authentication failed',
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('❌ [WordPressAPI] verifyCredentials error:', error);
      return {
        success: false,
        error: isNetworkError(error)
          ? 'Impossible de se connecter au serveur. Vérifiez votre connexion.'
          : (error instanceof Error ? error.message : 'Network error'),
      };
    }
  }

  /**
   * Créer un compte Portal pour un utilisateur WordPress existant
   */
  static async createPortalUser(wpUserId: number, portalData: any = {}): Promise<WordPressResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/create-portal-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BDA-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          wp_user_id: wpUserId,
          portal_data: portalData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to create portal user',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Créer un utilisateur WordPress depuis le Portal
   */
  static async createStoreUser(userData: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    bda_role?: string;
    bda_organization?: string;
  }): Promise<WordPressResponse<{ wp_user_id: number }>> {
    try {
      const response = await fetch(`${this.baseURL}/users/create-store-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BDA-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          email: userData.email,
          password: userData.password,
          user_data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            bda_role: userData.bda_role,
            organization: userData.bda_organization,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to create store user',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Synchroniser le profil utilisateur
   */
  static async syncProfile(wpUserId: number, profileData: any): Promise<WordPressResponse> {
    try {
      const response = await fetch(`${this.baseURL}/users/sync-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BDA-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          wp_user_id: wpUserId,
          profile_data: profileData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to sync profile',
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Récupérer les données utilisateur depuis WordPress
   */
  static async getUserData(wpUserId: number): Promise<WordPressResponse<WordPressUser>> {
    try {
      const response = await fetch(`${this.baseURL}/users/get-user-data?wp_user_id=${wpUserId}`, {
        method: 'GET',
        headers: {
          'X-BDA-API-Key': this.apiKey,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to get user data',
        };
      }

      return {
        success: true,
        data: data.user_data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Tester la connectivité avec l'API WordPress
   * Uses the /test endpoint which doesn't require authentication
   */
  static async testConnection(): Promise<WordPressResponse> {
    try {
      const response = await fetch(`${this.baseURL}/test`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: 'API connection failed',
        };
      }

      // Check if response indicates success
      if (data.success === true || data.message) {
        return {
          success: true,
          data: data,
        };
      }

      return {
        success: false,
        error: 'Unexpected API response',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  /**
   * Configurer la clé API
   */
  static setApiKey(apiKey: string) {
    API_CONFIG.wordpress.apiKey = apiKey;
  }

  /**
   * Configurer l'URL de base
   */
  static setBaseURL(baseURL: string) {
    API_CONFIG.wordpress.baseURL = baseURL.replace(/\/+$/, '') + '/wp-json/bda-portal/v1';
  }

  /**
   * Créer une session WordPress pour un utilisateur
   * Permet l'accès seamless au Store après login Portal
   */
  static async createSession(wpUserId: number): Promise<WordPressResponse> {
    try {
      const response = await fetchWithRetry(
        `${this.baseURL}/auth/create-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BDA-API-Key': this.apiKey,
          },
          credentials: 'include', // Important pour les cookies
          body: JSON.stringify({
            wp_user_id: wpUserId,
          }),
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`🔄 [WordPressAPI] Retrying createSession (attempt ${attempt})...`);
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to create session',
        };
      }

      return {
        success: true,
        data: data,
        message: 'Session created successfully'
      };
    } catch (error) {
      console.error('❌ [WordPressAPI] createSession error:', error);
      return {
        success: false,
        error: isNetworkError(error)
          ? 'Impossible de synchroniser la session. Vous pouvez toujours accéder au Portal.'
          : (error instanceof Error ? error.message : 'Network error'),
      };
    }
  }

  /**
   * Déconnecter un utilisateur WordPress
   * Nettoie la session Store
   */
  static async logout(wpUserId?: number): Promise<WordPressResponse> {
    try {
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-BDA-API-Key': this.apiKey,
        },
        credentials: 'include',
        body: JSON.stringify({
          wp_user_id: wpUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to logout',
        };
      }

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      // Logout non-bloquant
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  /**
   * Vérifier si un utilisateur existe dans WordPress
   */
  static async checkUserExists(email: string): Promise<WordPressResponse<WordPressUser>> {
    try {
      const response = await fetchWithRetry(
        `${this.baseURL}/users/check-user?email=${encodeURIComponent(email)}`,
        {
          method: 'GET',
          headers: {
            'X-BDA-API-Key': this.apiKey,
          },
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`🔄 [WordPressAPI] Retrying checkUserExists (attempt ${attempt})...`);
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to check user existence',
        };
      }

      return {
        success: true,
        data: data.user_exists ? data.user_data : null,
      };
    } catch (error) {
      console.error('❌ [WordPressAPI] checkUserExists error:', error);
      return {
        success: false,
        error: isNetworkError(error)
          ? 'Impossible de se connecter au serveur. Vérifiez votre connexion.'
          : (error instanceof Error ? error.message : 'Network error'),
      };
    }
  }

  /**
   * Créer un utilisateur dans WordPress
   */
  static async createUser(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<WordPressResponse<WordPressUser>> {
    try {
      const response = await fetchWithRetry(
        `${this.baseURL}/users/create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-BDA-API-Key': this.apiKey,
          },
          body: JSON.stringify({
            email: userData.email,
            password: userData.password,
            first_name: userData.firstName,
            last_name: userData.lastName,
          }),
        },
        {
          maxRetries: 2,
          onRetry: (attempt) => {
            console.log(`🔄 [WordPressAPI] Retrying createUser (attempt ${attempt})...`);
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'Failed to create user',
        };
      }

      return {
        success: true,
        data: data.user_data,
        message: data.message,
      };
    } catch (error) {
      console.error('❌ [WordPressAPI] createUser error:', error);
      return {
        success: false,
        error: isNetworkError(error)
          ? 'Impossible de se connecter au serveur. Vérifiez votre connexion.'
          : (error instanceof Error ? error.message : 'Network error'),
      };
    }
  }
}