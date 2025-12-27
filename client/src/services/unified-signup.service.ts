/**
 * Unified Signup Service
 * Gère tous les cas possibles de signup de manière transparente
 */

import { AuthService } from '@/entities/auth/auth.service';
import { WordPressAPIService } from './wordpress-api.service';
import { UnifiedAuthService } from './unified-auth.service';

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  accessType: 'portal-only' | 'store-only' | 'both';
  role?: 'individual' | 'ecp' | 'pdp';
  organization?: string;
}

export interface AccountStatus {
  portalExists: boolean;
  storeExists: boolean;
  linked: boolean;
  portalData?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
  storeData?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    wpRole?: string;
  };
  conflictData?: ConflictInfo;
}

export interface ConflictInfo {
  type: 'name_mismatch' | 'role_mismatch' | 'data_inconsistency';
  portalValue: string;
  storeValue: string;
  field: string;
}

export interface SignupResult {
  success: boolean;
  action: 'created' | 'linked' | 'confirmed_existing' | 'requires_confirmation';
  portalAccount?: any;
  storeAccount?: any;
  conflicts?: ConflictInfo[];
  nextStep?: 'login' | 'confirm_data' | 'complete_setup';
  message: string;
}

export class UnifiedSignupService {

  /**
   * Point d'entrée principal pour le signup unifié
   */
  static async handleSignup(request: SignupRequest): Promise<SignupResult> {
    console.log('🚀 [UnifiedSignupService] Starting signup process:', {
      email: request.email,
      role: request.role,
      accessType: request.accessType,
      hasOrganization: !!request.organization
    });

    try {
      // 1. Vérification silencieuse des comptes existants
      console.log('🔍 [UnifiedSignupService] Checking account status...');
      const accountStatus = await this.checkAccountStatus(request.email);
      console.log('📋 [UnifiedSignupService] Account status:', accountStatus);

      // 2. Analyse du cas et choix de la stratégie
      console.log('🎯 [UnifiedSignupService] Determining strategy...');
      const strategy = this.determineStrategy(accountStatus, request);
      console.log('📝 [UnifiedSignupService] Selected strategy:', strategy);

      // 3. Exécution de la stratégie appropriée
      console.log('⚡ [UnifiedSignupService] Executing strategy:', strategy);
      const result = await this.executeStrategy(strategy, request, accountStatus);
      console.log('✅ [UnifiedSignupService] Strategy execution result:', result);

      return result;

    } catch (error) {
      console.error('❌ [UnifiedSignupService] Unified signup failed:', error);
      console.error('📊 [UnifiedSignupService] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        request: request
      });
      return {
        success: false,
        action: 'requires_confirmation',
        message: 'An error occurred. Please try again.',
        nextStep: 'complete_setup'
      };
    }
  }

  /**
   * Vérification silencieuse de l'état des comptes
   */
  private static async checkAccountStatus(email: string): Promise<AccountStatus> {
    // Vérification des deux systèmes en parallèle
    const [portalCheck, storeCheck] = await Promise.allSettled([
      this.checkPortalAccount(email),
      this.checkStoreAccount(email)
    ]);

    const portalExists = portalCheck.status === 'fulfilled' && portalCheck.value !== null;
    const storeExists = storeCheck.status === 'fulfilled' && storeCheck.value !== null;

    const portalData = portalExists ? portalCheck.value : undefined;
    const storeData = storeExists ? storeCheck.value : undefined;

    // Détection des conflits de données
    const conflictData = this.detectConflicts(portalData, storeData);

    // Vérification si les comptes sont liés
    const linked = portalData?.wp_user_id === storeData?.wp_user_id;

    return {
      portalExists,
      storeExists,
      linked,
      portalData,
      storeData,
      conflictData
    };
  }

  /**
   * Vérification compte Portal
   */
  private static async checkPortalAccount(email: string) {
    try {
      // Utiliser l'API Supabase pour vérifier l'existence
      const response = await AuthService.checkUserExists(email);

      // Si on trouve dans public.users
      if (response.exists && response.userData) {
        console.log('✅ [checkPortalAccount] Found user in public.users:', response.userData);
        return response.userData;
      }

      // Double-check en essayant de se connecter avec un faux mot de passe
      const { supabase } = await import('@/shared/config/supabase.config');
      const authCheck = await supabase.auth.signInWithPassword({
        email: email,
        password: 'dummy-check-12345'
      });

      // Si on a "Invalid login credentials", l'utilisateur existe dans auth.users
      if (authCheck.error?.message?.includes('Invalid login credentials')) {
        console.warn('⚠️ [checkPortalAccount] User exists in auth.users but NOT in public.users!', email);
        // On retourne null pour forcer une tentative de création
        return null;
      }

      return null;
    } catch (error) {
      console.error('❌ [checkPortalAccount] Error:', error);
      return null;
    }
  }

  /**
   * Vérification compte Store
   */
  private static async checkStoreAccount(email: string) {
    try {
      const response = await WordPressAPIService.checkUserExists(email);
      return response.success && response.data ? response.data : null;
    } catch (error) {
      console.error('Error checking WordPress user:', error);
      return null;
    }
  }

  /**
   * Détection des conflits de données
   */
  private static detectConflicts(portalData: any, storeData: any): ConflictInfo | undefined {
    if (!portalData || !storeData) return undefined;

    // Vérification des noms
    const portalFullName = `${portalData.firstName || ''} ${portalData.lastName || ''}`.trim();
    const storeFullName = `${storeData.firstName || ''} ${storeData.lastName || ''}`.trim();

    if (portalFullName && storeFullName && portalFullName !== storeFullName) {
      return {
        type: 'name_mismatch',
        portalValue: portalFullName,
        storeValue: storeFullName,
        field: 'fullName'
      };
    }

    return undefined;
  }

  /**
   * Détermination de la stratégie à utiliser
   */
  private static determineStrategy(status: AccountStatus, request: SignupRequest): SignupStrategy {
    const { portalExists, storeExists, linked, conflictData } = status;

    // Cas 1: Aucun compte n'existe
    if (!portalExists && !storeExists) {
      return 'create_new_accounts';
    }

    // Cas 2: Seulement Portal existe
    if (portalExists && !storeExists) {
      if (request.accessType === 'store-only') {
        return 'create_store_link_existing_portal';
      }
      if (request.accessType === 'both') {
        return 'create_store_link_existing_portal';
      }
      return 'confirm_existing_portal';
    }

    // Cas 3: Seulement Store existe
    if (!portalExists && storeExists) {
      if (request.accessType === 'portal-only') {
        return 'create_portal_link_existing_store';
      }
      if (request.accessType === 'both') {
        return 'create_portal_link_existing_store';
      }
      return 'confirm_existing_store';
    }

    // Cas 4: Les deux existent
    if (portalExists && storeExists) {
      if (linked) {
        return 'confirm_existing_linked';
      }
      if (conflictData) {
        return 'resolve_conflicts_and_link';
      }
      return 'link_existing_accounts';
    }

    return 'requires_manual_review';
  }

  /**
   * Exécution de la stratégie choisie
   */
  private static async executeStrategy(
    strategy: SignupStrategy,
    request: SignupRequest,
    status: AccountStatus
  ): Promise<SignupResult> {

    switch (strategy) {
      case 'create_new_accounts':
        return await this.createNewAccounts(request);

      case 'create_portal_link_existing_store':
        return await this.createPortalLinkStore(request, status.storeData!);

      case 'create_store_link_existing_portal':
        return await this.createStoreLinkPortal(request, status.portalData!);

      case 'confirm_existing_portal':
        return this.confirmExistingPortal(status.portalData!);

      case 'confirm_existing_store':
        return this.confirmExistingStore(status.storeData!);

      case 'confirm_existing_linked':
        return this.confirmExistingLinked(status);

      case 'link_existing_accounts':
        return await this.linkExistingAccounts(request, status);

      case 'resolve_conflicts_and_link':
        return await this.resolveConflictsAndLink(request, status);

      default:
        return {
          success: false,
          action: 'requires_confirmation',
          message: 'This case requires manual review. Please contact support.',
          nextStep: 'complete_setup'
        };
    }
  }

  /**
   * Création de nouveaux comptes
   */
  private static async createNewAccounts(request: SignupRequest): Promise<SignupResult> {
    console.log('🆕 [createNewAccounts] Starting account creation:', {
      accessType: request.accessType,
      email: request.email,
      role: request.role
    });

    try {
      if (request.accessType === 'portal-only') {
        console.log('🎯 [createNewAccounts] Creating portal-only account...');

        const signupData = {
          email: request.email,
          password: request.password,
          firstName: request.firstName,
          lastName: request.lastName,
          role: request.role || 'individual',
          signupType: 'portal-only'
        };
        console.log('📝 [createNewAccounts] Portal signup data:', signupData);

        // Créer seulement le compte Portal
        console.log('📞 [createNewAccounts] Calling AuthService.signUp...');
        const portalAccount = await AuthService.signUp(signupData);
        console.log('✅ [createNewAccounts] AuthService.signUp response:', portalAccount);

        const result = {
          success: true,
          action: 'created',
          portalAccount,
          message: 'Portal account created successfully!',
          nextStep: 'login'
        };
        console.log('🎉 [createNewAccounts] Portal-only success result:', result);
        return result;
      }

      if (request.accessType === 'store-only') {
        console.log('🏪 [createNewAccounts] Creating store-only account...');

        // Créer seulement le compte Store
        const storeRequestData = {
          email: request.email,
          password: request.password,
          firstName: request.firstName,
          lastName: request.lastName
        };
        console.log('📝 [createNewAccounts] Store request data:', storeRequestData);

        console.log('📞 [createNewAccounts] Calling WordPressAPIService.createUser...');
        const storeAccount = await WordPressAPIService.createUser(storeRequestData);
        console.log('✅ [createNewAccounts] WordPressAPIService.createUser response:', storeAccount);

        const result = {
          success: true,
          action: 'created',
          storeAccount: storeAccount.data,
          message: 'Store account created successfully!',
          nextStep: 'login'
        };
        console.log('🎉 [createNewAccounts] Store-only success result:', result);
        return result;
      }

      // Créer les deux comptes de manière transparente
      console.log('🔗 [createNewAccounts] Creating unified accounts (both)...');
      const unifiedRequestData = {
        email: request.email,
        password: request.password,
        first_name: request.firstName,
        last_name: request.lastName,
        bda_role: request.role || 'individual',
        organization: request.organization,
        signup_type: 'both' as const
      };
      console.log('📝 [createNewAccounts] Unified request data:', unifiedRequestData);

      console.log('📞 [createNewAccounts] Calling UnifiedAuthService.signUp...');
      const result = await UnifiedAuthService.signUp(unifiedRequestData);
      console.log('✅ [createNewAccounts] UnifiedAuthService.signUp response:', result);

      if (result.success) {
        const finalResult = {
          success: true,
          action: 'created' as const,
          portalAccount: result.user,
          storeAccount: result.user, // UnifiedAuthService creates both, unified user contains both
          message: 'Portal and Store accounts created and linked successfully!',
          nextStep: 'login' as const
        };
        console.log('🎉 [createNewAccounts] Unified success result:', finalResult);
        return finalResult;
      } else {
        console.error('❌ [createNewAccounts] UnifiedAuthService.signUp failed:', result.error);
        const errorResult = {
          success: false,
          action: 'requires_confirmation' as const,
          message: result.error?.message || 'Error creating accounts.',
          nextStep: 'complete_setup' as const
        };
        console.error('💥 [createNewAccounts] Returning UnifiedAuthService error result:', errorResult);
        return errorResult;
      }

    } catch (error) {
      console.error('❌ [createNewAccounts] Error caught:', error);
      console.error('📊 [createNewAccounts] Error details:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        cause: error?.cause,
        request: request
      });

      const errorResult = {
        success: false,
        action: 'requires_confirmation',
        message: 'Error creating accounts.',
        nextStep: 'complete_setup'
      };
      console.error('💥 [createNewAccounts] Returning error result:', errorResult);
      return errorResult;
    }
  }

  /**
   * Créer Portal et lier au Store existant
   */
  private static async createPortalLinkStore(request: SignupRequest, storeData: any): Promise<SignupResult> {
    try {
      // Vérifier d'abord les credentials du store
      const storeAuth = await WordPressAPIService.verifyCredentials(request.email, request.password);
      if (!storeAuth.success) {
        return {
          success: false,
          action: 'requires_store_password',
          message: 'EXISTING_STORE_ACCOUNT: The credentials do not match your existing Store account.',
          nextStep: 'provide_store_password'
        };
      }

      // Créer le compte Portal et le lier directement via Supabase
      console.log('📞 [createPortalLinkStore] Creating Portal account linked to Store...');

      // Import direct de supabase
      const { supabase } = await import('@/shared/config/supabase.config');

      // D'abord essayer de se connecter avec les credentials pour voir si le compte existe déjà
      const signInAttempt = await supabase.auth.signInWithPassword({
        email: request.email,
        password: request.password
      });

      if (signInAttempt.data.user) {
        // Le compte Supabase existe déjà avec le bon mot de passe
        console.log('✅ [createPortalLinkStore] Portal account already exists with correct password');

        // ✅ CORRECTION: Vérifier si la liaison existe, sinon la faire
        const { data: existingUser } = await supabase
          .from('users')
          .select('wp_user_id')
          .eq('id', signInAttempt.data.user.id)
          .single();

        if (!existingUser || !existingUser.wp_user_id) {
          console.log('🔗 [createPortalLinkStore] Linking existing Portal account to Store...');

          // Faire la liaison dans public.users
          const { error: upsertError } = await supabase
            .from('users')
            .upsert({
              id: signInAttempt.data.user.id,
              email: request.email,
              first_name: request.firstName,
              last_name: request.lastName,
              role: request.role || 'individual',
              wp_user_id: storeData.wp_user_id,
              wp_sync_status: 'synced',
              organization: request.organization,
              signup_type: 'both',
              created_from: 'portal',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (upsertError) {
            console.error('❌ [createPortalLinkStore] Failed to upsert:', upsertError);
          } else {
            console.log('✅ [createPortalLinkStore] Portal account linked to Store ID:', storeData.wp_user_id);
          }
        }

        return {
          success: true,
          action: 'confirmed_existing',
          portalAccount: signInAttempt.data.user,
          storeAccount: storeData,
          message: 'Your accounts are already linked. You can sign in directly.',
          nextStep: 'login'
        };
      }

      // Si on arrive ici, essayer de créer le compte
      const supabaseResult = await supabase.auth.signUp({
        email: request.email,
        password: request.password,
        options: {
          data: {
            first_name: request.firstName,
            last_name: request.lastName,
            bda_role: request.role || 'individual',
            organization: request.organization,
            wp_user_id: storeData.wp_user_id,
            signup_type: 'portal-only'
          }
        }
      });

      if (supabaseResult.error) {
        console.error('❌ [createPortalLinkStore] Portal creation failed:', supabaseResult.error);

        // Si c'est une erreur de base de données, l'utilisateur existe probablement déjà dans auth.users
        if (supabaseResult.error.message.includes('Database error')) {
          console.log('🔄 [createPortalLinkStore] Database error - user might already exist, trying recovery strategies...');

          // Stratégie 1: Essayer de se connecter avec les mêmes credentials
          const retrySignIn = await supabase.auth.signInWithPassword({
            email: request.email,
            password: request.password
          });

          if (retrySignIn.data.user) {
            console.log('✅ [createPortalLinkStore] Successfully signed in existing user after database error');

            // Mettre à jour les metadata auth
            await supabase.auth.updateUser({
              data: {
                first_name: request.firstName,
                last_name: request.lastName,
                bda_role: request.role || 'individual',
                organization: request.organization,
                wp_user_id: storeData.wp_user_id
              }
            });

            // ✅ CORRECTION: Upsert dans la table public.users (créer OU mettre à jour)
            const { error: upsertError } = await supabase
              .from('users')
              .upsert({
                id: retrySignIn.data.user.id,
                email: request.email,
                first_name: request.firstName,
                last_name: request.lastName,
                role: request.role || 'individual',
                wp_user_id: storeData.wp_user_id,
                wp_sync_status: 'synced',
                organization: request.organization,
                signup_type: 'both',
                created_from: 'portal',
                updated_at: new Date().toISOString()
              }, {
                onConflict: 'id'
              });

            if (upsertError) {
              console.error('❌ [createPortalLinkStore] Failed to upsert in public.users:', upsertError);
            } else {
              console.log('✅ [createPortalLinkStore] Portal user linked to Store ID:', storeData.wp_user_id);
            }

            return {
              success: true,
              action: 'confirmed_existing',
              portalAccount: retrySignIn.data.user,
              storeAccount: storeData,
              message: 'Your account has been recovered and linked successfully.',
              nextStep: 'login'
            };
          }

          // Stratégie 2: Essayer de récupérer le compte via la fonction upsert
          console.log('🔧 [createPortalLinkStore] Attempting account recovery via upsert function...');

          const { data: upsertResult, error: upsertError } = await supabase.rpc('upsert_user_account', {
            p_email: request.email,
            p_password: request.password,
            p_first_name: request.firstName,
            p_last_name: request.lastName,
            p_role: request.role || 'individual',
            p_wp_user_id: storeData.wp_user_id
          });

          if (upsertResult?.success) {
            console.log('✅ [createPortalLinkStore] Account recovered via upsert');

            // Maintenant essayer de se connecter
            const finalSignIn = await supabase.auth.signInWithPassword({
              email: request.email,
              password: request.password
            });

            if (finalSignIn.data.user) {
              return {
                success: true,
                action: 'confirmed_existing',
                portalAccount: finalSignIn.data.user,
                storeAccount: storeData,
                message: 'Your account has been recovered and linked successfully.',
                nextStep: 'login'
              };
            }
          }

          // Stratégie 3: Envoyer un email de réinitialisation
          console.log('🔧 [createPortalLinkStore] Last resort - sending password reset email...');
          const resetResult = await supabase.auth.resetPasswordForEmail(request.email, {
            redirectTo: `${window.location.origin}/reset-password`
          });

          if (!resetResult.error) {
            return {
              success: true,
              action: 'requires_confirmation',
              message: 'Account recovery initiated. Please check your email to reset your Portal password.',
              nextStep: 'login'
            };
          }

          return {
            success: false,
            action: 'requires_confirmation',
            message: 'Unable to recover your account automatically. Please contact support.',
            nextStep: 'login'
          };
        }

        // Si l'erreur est que l'utilisateur existe déjà mais avec un mot de passe différent
        if (supabaseResult.error.message.includes('already registered') ||
            supabaseResult.error.message.includes('already exists')) {
          return {
            success: false,
            action: 'requires_confirmation',
            message: 'A Portal account already exists with this email but with a different password. Please sign in instead.',
            nextStep: 'login'
          };
        }

        return {
          success: false,
          action: 'requires_confirmation',
          message: supabaseResult.error.message || 'Error creating Portal account.',
          nextStep: 'complete_setup'
        };
      }

      // ✅ CORRECTION: Upsert dans la table public.users (créer OU mettre à jour)
      if (supabaseResult.data.user) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert({
            id: supabaseResult.data.user.id,
            email: request.email,
            first_name: request.firstName,
            last_name: request.lastName,
            role: request.role || 'individual',
            wp_user_id: storeData.wp_user_id,
            wp_sync_status: 'synced',
            organization: request.organization,
            signup_type: 'both',
            created_from: 'portal',
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          });

        if (upsertError) {
          console.error('❌ [createPortalLinkStore] Failed to link in public.users:', upsertError);
        } else {
          console.log('✅ [createPortalLinkStore] New Portal user linked to Store ID:', storeData.wp_user_id);
        }
      }

      const portalResult = {
        success: true,
        user: supabaseResult.data.user
      };

      return {
        success: true,
        action: 'created',
        portalAccount: portalResult.user,
        storeAccount: storeData,
        message: 'Portal account created and linked to your existing Store account!',
        nextStep: 'login'
      };

    } catch (error) {
      return {
        success: false,
        action: 'requires_confirmation',
        message: 'Error linking accounts.',
        nextStep: 'complete_setup'
      };
    }
  }

  /**
   * Créer Store et lier au Portal existant
   */
  private static async createStoreLinkPortal(request: SignupRequest, portalData: any): Promise<SignupResult> {
    try {
      // Vérifier d'abord les credentials du portal
      const portalAuth = await AuthService.signInWithEmailAndPassword(request.email, request.password);
      if (!portalAuth.success) {
        return {
          success: false,
          action: 'requires_confirmation',
          message: 'The credentials do not match your existing Portal account.',
          nextStep: 'complete_setup'
        };
      }

      // Créer le compte Store
      const storeResult = await WordPressAPIService.createUser({
        email: request.email,
        password: request.password,
        firstName: request.firstName,
        lastName: request.lastName
      });

      // Lier les comptes
      await AuthService.linkWordPressAccount(portalData.id, storeResult.data.wp_user_id);

      return {
        success: true,
        action: 'created',
        portalAccount: portalData,
        storeAccount: storeResult.data,
        message: 'Store account created and linked to your existing Portal account!',
        nextStep: 'login'
      };

    } catch (error) {
      return {
        success: false,
        action: 'requires_confirmation',
        message: 'Error creating Store account.',
        nextStep: 'complete_setup'
      };
    }
  }

  /**
   * Confirmer compte Portal existant
   */
  private static confirmExistingPortal(portalData: any): SignupResult {
    return {
      success: true,
      action: 'confirmed_existing',
      portalAccount: portalData,
      message: 'You already have a Portal account. You can sign in directly.',
      nextStep: 'login'
    };
  }

  /**
   * Confirmer compte Store existant
   */
  private static confirmExistingStore(storeData: any): SignupResult {
    return {
      success: true,
      action: 'confirmed_existing',
      storeAccount: storeData,
      message: 'You already have a Store account. You can sign in directly.',
      nextStep: 'login'
    };
  }

  /**
   * Confirmer comptes liés existants
   */
  private static confirmExistingLinked(status: AccountStatus): SignupResult {
    return {
      success: true,
      action: 'confirmed_existing',
      portalAccount: status.portalData,
      storeAccount: status.storeData,
      message: 'Your Portal and Store accounts are already linked. You can sign in directly.',
      nextStep: 'login'
    };
  }

  /**
   * Lier des comptes existants
   */
  private static async linkExistingAccounts(request: SignupRequest, status: AccountStatus): Promise<SignupResult> {
    try {
      // Vérifier les credentials des deux comptes
      const [portalAuth, storeAuth] = await Promise.all([
        AuthService.signInWithEmailAndPassword(request.email, request.password),
        WordPressAPIService.verifyCredentials(request.email, request.password)
      ]);

      if (!portalAuth.success || !storeAuth.success) {
        return {
          success: false,
          action: 'requires_confirmation',
          message: 'The credentials do not match your existing accounts.',
          nextStep: 'complete_setup'
        };
      }

      // Lier les comptes
      await AuthService.linkWordPressAccount(status.portalData!.id, status.storeData!.wp_user_id);

      return {
        success: true,
        action: 'linked',
        portalAccount: status.portalData,
        storeAccount: status.storeData,
        message: 'Your Portal and Store accounts have been linked successfully!',
        nextStep: 'login'
      };

    } catch (error) {
      return {
        success: false,
        action: 'requires_confirmation',
        message: 'Error linking accounts.',
        nextStep: 'complete_setup'
      };
    }
  }

  /**
   * Résoudre les conflits et lier
   * Actually resolves data conflicts between Portal and Store accounts
   * Uses form data as the source of truth for conflict resolution
   */
  private static async resolveConflictsAndLink(request: SignupRequest, status: AccountStatus): Promise<SignupResult> {
    console.log('🔧 [resolveConflictsAndLink] Starting conflict resolution:', {
      email: request.email,
      conflicts: status.conflictData,
      portalId: status.portalData?.id,
      wpUserId: status.storeData?.wp_user_id
    });

    try {
      // Step 1: Verify credentials for both accounts to ensure user owns both
      console.log('🔐 [resolveConflictsAndLink] Verifying credentials...');

      const portalAuth = await AuthService.signIn(request.email, request.password);
      const storeAuth = await WordPressAPIService.verifyCredentials(request.email, request.password);

      if (portalAuth.error || !portalAuth.user || !storeAuth.success) {
        console.error('❌ [resolveConflictsAndLink] Credential verification failed');
        return {
          success: false,
          action: 'requires_confirmation',
          message: 'The credentials do not match your existing accounts. Please try again.',
          nextStep: 'complete_setup'
        };
      }

      // Step 2: Prepare resolution data from form (source of truth)
      const resolutionData = {
        first_name: request.firstName,
        last_name: request.lastName,
        role: request.role || 'individual',
        organization: request.organization
      };

      console.log('📝 [resolveConflictsAndLink] Resolution data:', resolutionData);

      // Step 3: Update Portal account (Supabase)
      console.log('🔄 [resolveConflictsAndLink] Updating Portal account...');
      const portalUpdateResult = await AuthService.updateUserProfile(
        status.portalData!.id,
        resolutionData
      );

      if (portalUpdateResult.error) {
        console.error('❌ [resolveConflictsAndLink] Portal update failed:', portalUpdateResult.error);
        return {
          success: false,
          action: 'requires_confirmation',
          message: 'Failed to update Portal account. Please try again.',
          nextStep: 'confirm_data'
        };
      }

      console.log('✅ [resolveConflictsAndLink] Portal account updated successfully');

      // Step 4: Update Store account (WordPress) - non-blocking
      let storeUpdateSuccess = false;
      try {
        console.log('🔄 [resolveConflictsAndLink] Updating Store account...');
        const storeUpdateResult = await WordPressAPIService.syncProfile(
          status.storeData!.wp_user_id,
          {
            first_name: request.firstName,
            last_name: request.lastName,
            bda_role: request.role || 'individual',
            organization: request.organization
          }
        );

        if (storeUpdateResult.success) {
          console.log('✅ [resolveConflictsAndLink] Store account updated successfully');
          storeUpdateSuccess = true;
        } else {
          console.warn('⚠️ [resolveConflictsAndLink] Store update failed (non-blocking):', storeUpdateResult.error);
        }
      } catch (storeError) {
        console.warn('⚠️ [resolveConflictsAndLink] Store update error (non-blocking):', storeError);
      }

      // Step 5: Link accounts if not already linked
      if (!status.linked) {
        console.log('🔗 [resolveConflictsAndLink] Linking accounts...');
        try {
          await AuthService.linkWordPressAccount(
            status.portalData!.id,
            status.storeData!.wp_user_id
          );
          console.log('✅ [resolveConflictsAndLink] Accounts linked successfully');
        } catch (linkError) {
          console.error('⚠️ [resolveConflictsAndLink] Linking failed (non-blocking):', linkError);
        }
      }

      // Step 6: Build success message
      const updatedFields: string[] = [];
      if (status.conflictData?.field === 'fullName') {
        updatedFields.push('name');
      }
      if (request.organization) {
        updatedFields.push('organization');
      }

      let message = 'Conflicts resolved successfully! ';
      if (updatedFields.length > 0) {
        message += `Updated: ${updatedFields.join(', ')}. `;
      }
      if (storeUpdateSuccess) {
        message += 'Both Portal and Store accounts have been updated.';
      } else {
        message += 'Portal account updated. Store sync will be completed later.';
      }

      return {
        success: true,
        action: 'linked',
        portalAccount: portalUpdateResult.profile,
        storeAccount: status.storeData,
        message,
        nextStep: 'login'
      };

    } catch (error) {
      console.error('❌ [resolveConflictsAndLink] Unexpected error:', error);
      return {
        success: false,
        action: 'requires_confirmation',
        message: 'An error occurred while resolving conflicts. Please try again.',
        nextStep: 'confirm_data'
      };
    }
  }
}

type SignupStrategy =
  | 'create_new_accounts'
  | 'create_portal_link_existing_store'
  | 'create_store_link_existing_portal'
  | 'confirm_existing_portal'
  | 'confirm_existing_store'
  | 'confirm_existing_linked'
  | 'link_existing_accounts'
  | 'resolve_conflicts_and_link'
  | 'requires_manual_review';