import { supabase } from '@/shared/config/supabase.config';

export interface UserCertification {
  id: string;
  user_id: string;
  certification_type: 'CP' | 'SCP';
  quiz_attempt_id?: string;
  issued_date: string;
  expiry_date: string;
  credential_id: string;
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  certificate_url?: string;
  renewal_count: number;
  last_renewed_at?: string;
  pdc_credits_earned?: number;
  notes?: string;
  revocation_reason?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * Service pour gérer les certifications utilisateurs
 */
export class CertificationService {
  /**
   * Créer automatiquement une certification après réussite d'examen
   */
  static async issueCertification(dto: {
    user_id: string;
    certification_type: 'CP' | 'SCP';
    quiz_attempt_id: string;
    score: number;
  }): Promise<{ data: UserCertification | null; error: any }> {
    try {
      // Vérifier si l'utilisateur n'a pas déjà cette certification active
      const { data: existing } = await supabase
        .from('user_certifications')
        .select('id')
        .eq('user_id', dto.user_id)
        .eq('certification_type', dto.certification_type)
        .eq('status', 'active')
        .maybeSingle();

      if (existing) {
        return {
          data: null,
          error: new Error('User already has an active certification of this type'),
        };
      }

      // Générer un credential_id unique
      const credentialId = await this.generateCredentialId(dto.certification_type);

      // Calculer la date d'expiration (3 ans pour CP, 5 ans pour SCP)
      const yearsValid = dto.certification_type === 'CP' ? 3 : 5;
      const issuedDate = new Date();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + yearsValid);

      // Use database function to issue certification (bypasses RLS)
      const { data, error } = await supabase.rpc('issue_certification', {
        p_user_id: dto.user_id,
        p_certification_type: dto.certification_type,
        p_quiz_attempt_id: dto.quiz_attempt_id,
        p_credential_id: credentialId,
        p_issued_date: issuedDate.toISOString().split('T')[0], // Date only (YYYY-MM-DD)
        p_expiry_date: expiryDate.toISOString().split('T')[0], // Date only (YYYY-MM-DD)
      });

      if (error) {
        console.error('Error issuing certification:', error);
        return { data: null, error };
      }

      return { data: data as UserCertification, error: null };
    } catch (error) {
      console.error('Error in issueCertification:', error);
      return { data: null, error };
    }
  }

  /**
   * Générer un credential_id unique
   * Format: CP-2024-001234 ou SCP-2024-001234
   */
  private static async generateCredentialId(type: 'CP' | 'SCP'): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${type}-${year}`;

    // Compter les certifications de ce type cette année
    const { count } = await supabase
      .from('user_certifications')
      .select('*', { count: 'exact', head: true })
      .eq('certification_type', type)
      .gte('issued_date', `${year}-01-01`)
      .lt('issued_date', `${year + 1}-01-01`);

    const nextNumber = (count || 0) + 1;
    return `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
  }

  /**
   * Obtenir les certifications d'un utilisateur
   */
  static async getUserCertifications(
    userId: string
  ): Promise<{ data: UserCertification[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_certifications')
        .select('*')
        .eq('user_id', userId)
        .order('issued_date', { ascending: false });

      if (error) {
        console.error('Error fetching user certifications:', error);
        return { data: null, error };
      }

      return { data: data as UserCertification[], error: null };
    } catch (error) {
      console.error('Error in getUserCertifications:', error);
      return { data: null, error };
    }
  }

  /**
   * Vérifier une certification par son credential_id
   */
  static async verifyCertification(
    credentialId: string
  ): Promise<{ data: UserCertification | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_certifications')
        .select('*')
        .eq('credential_id', credentialId)
        .maybeSingle();

      if (error) {
        console.error('Error verifying certification:', error);
        return { data: null, error };
      }

      return { data: data as UserCertification | null, error: null };
    } catch (error) {
      console.error('Error in verifyCertification:', error);
      return { data: null, error };
    }
  }

  /**
   * Révoquer une certification (admin uniquement)
   */
  static async revokeCertification(
    certificationId: string
  ): Promise<{ data: UserCertification | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('user_certifications')
        .update({ status: 'revoked' })
        .eq('id', certificationId)
        .select()
        .single();

      if (error) {
        console.error('Error revoking certification:', error);
        return { data: null, error };
      }

      return { data: data as UserCertification, error: null };
    } catch (error) {
      console.error('Error in revokeCertification:', error);
      return { data: null, error };
    }
  }
}
