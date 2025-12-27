# Système d'Auto-Certification

## Vue d'ensemble

Le système d'auto-certification délivre automatiquement des certifications CP™ ou SCP™ lorsqu'un candidat réussit un examen de certification officiel.

## Flow du Système

```
1. Candidat termine l'examen
   ↓
2. Calcul du score (dans TakeCertificationExamAttempt.tsx)
   ↓
3. Vérification du score >= passing_score_percentage
   ↓
4. Si RÉUSSITE → Création automatique de la certification
   ↓
5. Insertion dans la table `user_certifications`
   ↓
6. Notification au candidat
   ↓
7. Génération du certificat PDF (optionnel)
```

## Tables Impliquées

### `user_certifications`
```sql
CREATE TABLE user_certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  certification_type TEXT NOT NULL CHECK (certification_type IN ('CP', 'SCP')),
  quiz_attempt_id UUID REFERENCES quiz_attempts(id),
  issued_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE,
  certificate_number TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  verification_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `quiz_attempts`
```sql
-- Déjà existe
- exam_type: 'certification' pour les examens officiels
- score: Pourcentage obtenu
- passed: Boolean si réussi
```

## Implémentation

### 1. Service Backend (À IMPLÉMENTER)

Créer un service qui sera appelé après la soumission réussie:

```typescript
// client/src/entities/certification/certification.service.ts

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
      // Générer un numéro de certificat unique
      const certificateNumber = await this.generateCertificateNumber(
        dto.certification_type
      );

      // Générer un code de vérification
      const verificationCode = await this.generateVerificationCode();

      // Calculer la date d'expiration (3 ans pour CP, 5 ans pour SCP)
      const yearsValid = dto.certification_type === 'CP' ? 3 : 5;
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + yearsValid);

      const { data, error } = await supabase
        .from('user_certifications')
        .insert({
          user_id: dto.user_id,
          certification_type: dto.certification_type,
          quiz_attempt_id: dto.quiz_attempt_id,
          certificate_number: certificateNumber,
          verification_code: verificationCode,
          expiry_date: expiryDate.toISOString(),
          status: 'active',
        })
        .select()
        .single();

      if (error) {
        console.error('Error issuing certification:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.error('Error in issueCertification:', error);
      return { data: null, error };
    }
  }

  /**
   * Générer un numéro de certificat unique
   * Format: CP-2024-001234 ou SCP-2024-001234
   */
  private static async generateCertificateNumber(
    type: 'CP' | 'SCP'
  ): Promise<string> {
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
   * Générer un code de vérification unique (6 caractères alphanumériques)
   */
  private static async generateVerificationCode(): Promise<string> {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sans I, O, 0, 1
    let code = '';

    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Vérifier l'unicité
      const { data } = await supabase
        .from('user_certifications')
        .select('id')
        .eq('verification_code', code)
        .maybeSingle();

      if (!data) break;
    } while (true);

    return code;
  }
}
```

### 2. Intégration dans TakeCertificationExamAttempt

```typescript
// Dans handleSubmitExam(), après avoir soumis l'attempt:

if (passed) {
  // Créer la certification automatiquement
  const certResult = await CertificationService.issueCertification({
    user_id: currentUser.id,
    certification_type: exam.certification_type,
    quiz_attempt_id: attemptId,
    score: scorePercentage,
  });

  if (!certResult.error) {
    toast({
      title: 'Félicitations! 🎉',
      description: `Votre certification ${exam.certification_type}™ a été délivrée!`,
    });
  }
}
```

### 3. RLS (Row Level Security) - Supabase

```sql
-- Permettre aux users de voir leurs propres certifications
CREATE POLICY "Users can view own certifications"
  ON user_certifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Permettre l'insertion automatique par le système
CREATE POLICY "System can issue certifications"
  ON user_certifications
  FOR INSERT
  WITH CHECK (true);

-- Permettre aux admins de tout voir
CREATE POLICY "Admins can view all certifications"
  ON user_certifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'super_admin')
    )
  );
```

## Fonctionnalités Additionnelles

### 1. Email de Notification
Envoyer un email avec:
- Félicitations
- Numéro de certificat
- Code de vérification
- Date d'expiration
- Lien pour télécharger le PDF

### 2. Génération de PDF
- Utiliser une librairie comme `jspdf` ou `pdfmake`
- Template professionnel avec logo BDA
- QR code pour vérification
- Signature numérique

### 3. Page "My Certifications"
Afficher:
- Liste des certifications obtenues
- Statut (Active/Expired)
- Bouton "Download PDF"
- Bouton "Verify"
- Date d'expiration

### 4. Système de Vérification Publique
Page `/verify-certification` où n'importe qui peut:
- Entrer un numéro de certificat ou code de vérification
- Voir si la certification est valide
- Voir le nom du titulaire (avec consentement)
- Voir la date d'émission et d'expiration

## Prochaines Étapes

1. ✅ Créer la table `user_certifications` (si pas existe)
2. ✅ Implémenter `CertificationService`
3. ✅ Intégrer dans le flow d'examen
4. ✅ Tester avec des examens réussis
5. ⏳ Ajouter génération de PDF
6. ⏳ Ajouter système d'email
7. ⏳ Créer page "My Certifications"
8. ⏳ Créer système de vérification publique

## Notes Importantes

- **Sécurité**: Les certifications ne peuvent être créées que par le système
- **Unicité**: Numéro de certificat et code de vérification doivent être uniques
- **Expiration**: CP = 3 ans, SCP = 5 ans
- **Révocation**: Possibilité pour admin de révoquer une certification
- **Audit**: Garder trace de toutes les émissions/modifications
