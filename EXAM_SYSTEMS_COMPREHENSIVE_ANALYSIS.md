# 📋 Analyse Complète des Systèmes d'Examen - Portail BDA
**Date**: 2025-10-10
**Version**: 1.0
**Statut**: ✅ Complet et Production-Ready

---

## 📑 Table des Matières

1. [Vue d'ensemble](#-vue-densemble)
2. [Système Quiz](#-système-quiz)
3. [Système Mock Exams](#-système-mock-exams)
4. [Système Certifications](#-système-certifications)
5. [Relations et Intégrations](#-relations-et-intégrations)
6. [Architecture Technique](#-architecture-technique)
7. [Permissions et Sécurité](#-permissions-et-sécurité)
8. [Prochaines Étapes](#-prochaines-étapes)

---

## 🎯 Vue d'ensemble

Le portail BDA implémente **3 systèmes d'examen distincts mais interconnectés** :

| Système | But Principal | Scoring | Audience |
|---------|---------------|---------|----------|
| **Quizzes** | Évaluation de modules curriculum | ❌ Pas de score stocké | Étudiants individuels |
| **Mock Exams** | Pratique avant certification | ✅ Score + historique complet | Candidats CP/SCP |
| **Certifications** | Certification officielle | ✅ Credential ID + certificat PDF | Professionnels certifiés |

### Flux Utilisateur Typique

```
1. Curriculum Module
   ↓
2. Quiz (validation de compréhension)
   ↓
3. Mock Exams (pratique intensive)
   ↓
4. Certification Exam (examen officiel)
   ↓
5. Certificat CP™ ou SCP™ délivré
```

---

## 📝 Système Quiz

### 🎯 Objectif
Évaluer la compréhension des modules du curriculum **sans enregistrer de score** (analytics anonymes seulement).

### 📊 Tables Database

#### `quizzes`
```sql
CREATE TABLE public.quizzes (
    id UUID PRIMARY KEY,

    -- Contenu
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT,
    description_ar TEXT,

    -- Configuration
    certification_type certification_type NOT NULL, -- 'CP' | 'SCP'
    difficulty_level difficulty_level DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
    time_limit_minutes INTEGER DEFAULT 60,
    passing_score_percentage INTEGER DEFAULT 70,

    -- État
    is_active BOOLEAN DEFAULT true,

    -- Audit
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Index**:
- `idx_quizzes_certification` sur `certification_type`
- `idx_quizzes_active` sur `is_active`
- `idx_quizzes_created_at` sur `created_at`

#### `quiz_questions`
```sql
CREATE TABLE public.quiz_questions (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,

    -- Contenu
    question_text TEXT NOT NULL,
    question_text_ar TEXT,
    question_type question_type DEFAULT 'multiple_choice', -- 'multiple_choice' | 'true_false' | 'multi_select'

    -- Métadonnées
    bock_domain TEXT, -- Domaine BoCK™ (ex: "Leadership", "Ethics")
    difficulty difficulty_level DEFAULT 'medium',
    points INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Index**:
- `idx_quiz_questions_quiz` sur `quiz_id`
- `idx_quiz_questions_order` sur `(quiz_id, order_index)`

#### `quiz_answers`
```sql
CREATE TABLE public.quiz_answers (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,

    -- Contenu
    answer_text TEXT NOT NULL,
    answer_text_ar TEXT,
    is_correct BOOLEAN DEFAULT false,

    -- Feedback optionnel
    explanation TEXT,
    explanation_ar TEXT,

    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Index**:
- `idx_quiz_answers_question` sur `question_id`
- `idx_quiz_answers_order` sur `(question_id, order_index)`

#### `quiz_attempts`
```sql
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    -- ⚠️ PAS DE SCORE - Analytics anonymes seulement
);
```

**Index**:
- `idx_quiz_attempts_user` sur `user_id`
- `idx_quiz_attempts_quiz` sur `quiz_id`
- `idx_quiz_attempts_completed` sur `completed_at`

### 🔧 Service API (`QuizService`)

**Fichier**: `client/src/entities/quiz/quiz.service.ts`

#### Opérations Publiques (Utilisateurs)

| Méthode | Description | Retour |
|---------|-------------|--------|
| `getActiveQuizzes(filters, options)` | Liste des quizzes actifs avec stats | `QuizWithStats[]` |
| `getQuizById(id)` | Détails complet avec questions/réponses | `QuizWithQuestions` |
| `getQuizStats(quizId)` | Nombre de questions et points totaux | `{ question_count, total_points }` |
| `startQuizAttempt(quizId)` | Enregistrer début de tentative (analytics) | `QuizAttempt` |
| `completeQuizAttempt(attemptId)` | Marquer tentative comme terminée | `QuizAttempt` |
| `getUserAttempts()` | Historique des tentatives de l'utilisateur | `QuizAttempt[]` |

#### Opérations Admin

| Méthode | Description |
|---------|-------------|
| `getAllQuizzes(filters, options)` | Tous les quizzes (actifs + inactifs) |
| `createQuiz(dto)` | Créer un nouveau quiz |
| `updateQuiz(id, dto)` | Modifier un quiz existant |
| `deleteQuiz(id)` | Supprimer un quiz |
| `toggleQuizActive(id, isActive)` | Activer/désactiver |
| `createQuestion(dto)` | Ajouter question avec réponses |
| `updateQuestion(id, dto)` | Modifier une question |
| `deleteQuestion(id)` | Supprimer une question |
| `getQuizQuestions(quizId)` | Toutes les questions d'un quiz |
| `createAnswer(questionId, dto)` | Ajouter une réponse |
| `updateAnswer(id, dto)` | Modifier une réponse |
| `deleteAnswer(id)` | Supprimer une réponse |

### 🔐 Row Level Security (RLS)

**Quizzes**:
- ✅ Utilisateurs authentifiés : Voir quiz actifs uniquement
- ✅ Admins : Gestion complète (CRUD)

**Questions & Answers**:
- ✅ Utilisateurs : Voir questions/réponses des quiz actifs
- ✅ Admins : Gestion complète

**Attempts**:
- ✅ Utilisateurs : Voir/créer/modifier leurs propres tentatives
- ✅ Admins : Voir toutes les tentatives

### 🎨 Caractéristiques Clés

1. **Bilinguisme**: EN + AR pour tous les textes
2. **Pas de scoring persisté**: Score calculé côté client seulement
3. **Analytics anonymes**: Tentatives enregistrées sans résultats
4. **Lié au curriculum**: Via `quiz_id` dans `curriculum_modules`
5. **Domaines BoCK™**: Classification par domaine de compétence

---

## 🎓 Système Mock Exams

### 🎯 Objectif
Permettre aux candidats de **s'entraîner intensivement** avant les examens officiels de certification avec scoring complet et historique.

### 📊 Tables Database

#### `mock_exams`
```sql
CREATE TABLE public.mock_exams (
    id UUID PRIMARY KEY,

    -- Contenu
    title TEXT NOT NULL,
    title_ar TEXT,
    description TEXT NOT NULL,
    description_ar TEXT,

    -- Configuration
    category exam_category NOT NULL, -- 'cp' | 'scp' | 'general'
    difficulty exam_difficulty DEFAULT 'medium', -- 'easy' | 'medium' | 'hard'
    duration_minutes INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    passing_score INTEGER DEFAULT 70, -- Score de passage en %

    -- État
    is_active BOOLEAN DEFAULT true,

    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);
```

**Index**:
- `idx_mock_exams_category` sur `category`
- `idx_mock_exams_is_active` sur `is_active`

#### `mock_exam_questions`
```sql
CREATE TABLE public.mock_exam_questions (
    id UUID PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,

    -- Contenu
    question_text TEXT NOT NULL,
    question_text_ar TEXT,
    explanation TEXT, -- Explication de la réponse correcte
    explanation_ar TEXT,

    -- Configuration
    question_type exam_question_type DEFAULT 'single_choice', -- 'single_choice' | 'multiple_choice'
    points INTEGER DEFAULT 1,
    order_index INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Index**:
- `idx_mock_exam_questions_exam_id` sur `exam_id`
- `idx_mock_exam_questions_order` sur `(exam_id, order_index)`

#### `mock_exam_answers`
```sql
CREATE TABLE public.mock_exam_answers (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES mock_exam_questions(id) ON DELETE CASCADE,

    -- Contenu
    answer_text TEXT NOT NULL,
    answer_text_ar TEXT,
    is_correct BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Index**:
- `idx_mock_exam_answers_question_id` sur `question_id`

#### `mock_exam_attempts` ⭐ (SCORING COMPLET)
```sql
CREATE TABLE public.mock_exam_attempts (
    id UUID PRIMARY KEY,
    exam_id UUID NOT NULL REFERENCES mock_exams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- ✅ RÉSULTATS COMPLETS
    score INTEGER NOT NULL, -- Score sur 100
    total_points_earned INTEGER NOT NULL,
    total_points_possible INTEGER NOT NULL,
    passed BOOLEAN NOT NULL,

    -- Temps
    time_spent_minutes INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Index**:
- `idx_mock_exam_attempts_user_id` sur `user_id`
- `idx_mock_exam_attempts_exam_id` sur `exam_id`
- `idx_mock_exam_attempts_created_at` sur `created_at DESC`

#### `mock_exam_attempt_answers`
```sql
CREATE TABLE public.mock_exam_attempt_answers (
    id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES mock_exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES mock_exam_questions(id) ON DELETE CASCADE,

    -- Réponse utilisateur
    selected_answer_ids UUID[] NOT NULL, -- Array pour choix multiples

    -- Correction
    is_correct BOOLEAN NOT NULL,
    points_earned INTEGER NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Index**:
- `idx_mock_exam_attempt_answers_attempt_id` sur `attempt_id`

### 🔧 Service API (`MockExamService`)

**Fichier**: `client/src/entities/mock-exam/mock-exam.service.ts`

#### Opérations Publiques (Utilisateurs)

| Méthode | Description | Retour |
|---------|-------------|--------|
| `getActiveExams(filters)` | Liste des examens actifs avec stats utilisateur | `MockExamWithStats[]` |
| `getExamWithQuestions(examId)` | Examen complet (questions + réponses) | `ExamWithQuestions` |
| `getExamStatsForUser(examId)` | Stats perso : tentatives, meilleur score, taux de réussite | `ExamStats` |
| `startExam(dto)` | Démarrer une nouvelle tentative | `ExamSession` |
| `submitAnswer(dto)` | Soumettre/modifier une réponse | `boolean` |
| `completeExam(attemptId)` | Terminer et calculer les résultats | `ExamResults` |
| `getMyAttempts(filters)` | Historique des tentatives | `MockExamAttempt[]` |
| `getAttemptResults(attemptId)` | Résultats détaillés d'une tentative | `ExamResults` |

#### Opérations Admin

| Méthode | Description |
|---------|-------------|
| `getExamsAdmin(filters)` | Tous les examens avec statistiques globales |
| `getAllAttempts(filters)` | Toutes les tentatives (tous utilisateurs) |
| `getExamStatistics(examId)` | Stats globales : taux réussite, score moyen, etc. |
| `createExam(dto)` | Créer un nouvel examen |
| `updateExam(id, dto)` | Modifier un examen |
| `deleteExam(id)` | Supprimer un examen |
| `toggleExamActive(id, isActive)` | Activer/désactiver |
| `createQuestion(dto)` | Ajouter question avec réponses |
| `updateQuestion(dto)` | Modifier une question |
| `deleteQuestion(id)` | Supprimer une question |
| `createAnswer(questionId, dto)` | Ajouter une réponse |
| `updateAnswer(dto)` | Modifier une réponse |
| `deleteAnswer(id)` | Supprimer une réponse |
| `updateExamQuestionCount(examId)` | Mettre à jour le compteur de questions |

### 🎯 Logique de Correction (Algorithme)

**Fichier**: `mock-exam.service.ts:324-489` (`completeExam`)

```typescript
// Pour chaque question :
if (question_type === 'single_choice') {
  isCorrect = (selectedIds.length === 1) && correctAnswerIds.includes(selectedIds[0]);
} else { // 'multiple_choice'
  isCorrect = (selectedIds.length === correctAnswerIds.length) &&
              selectedIds.every(id => correctAnswerIds.includes(id));
}

pointsEarned = isCorrect ? question.points : 0;

// Score final
scorePercentage = Math.round((totalPointsEarned / totalPointsPossible) * 100);
passed = scorePercentage >= exam.passing_score;
```

### 🔐 Row Level Security (RLS)

**Exams**:
- ✅ Utilisateurs : Voir examens actifs
- ✅ Admins : Voir tous + gérer

**Questions & Answers**:
- ✅ Utilisateurs : Voir questions des examens actifs
- ✅ Admins : Gestion complète

**Attempts**:
- ✅ Utilisateurs : Voir/créer leurs propres tentatives
- ✅ Admins : Voir toutes les tentatives + stats

**Attempt Answers**:
- ✅ Utilisateurs : Voir/créer réponses de leurs tentatives
- ✅ Admins : Voir toutes les réponses

### 🎨 Caractéristiques Clés

1. **Scoring complet persisté**: Contrairement aux quizzes
2. **Historique détaillé**: Toutes les tentatives + réponses sauvegardées
3. **Correction automatique**: Algorithme différentié single/multiple choice
4. **Analytics riches**: Stats globales + stats personnelles
5. **Temps de passage**: Enregistré avec chaque tentative
6. **Réponses modifiables**: Avant soumission finale

---

## 🏆 Système Certifications

### 🎯 Objectif
Gérer les **certifications officielles CP™ et SCP™** délivrées après réussite d'examen, avec credential ID unique et certificat PDF.

### 📊 Table Database

#### `user_certifications`
```sql
CREATE TABLE public.user_certifications (
    id UUID PRIMARY KEY,

    -- Utilisateur
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Détails certification
    certification_type certification_type NOT NULL, -- 'CP' | 'SCP'
    credential_id TEXT NOT NULL UNIQUE, -- Ex: "CP-2024-0001"

    -- Référence examen
    quiz_attempt_id UUID REFERENCES quiz_attempts(id) ON DELETE SET NULL,

    -- Dates
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,

    -- Statut
    status TEXT DEFAULT 'active', -- 'active' | 'expired' | 'revoked' | 'suspended'

    -- Certificat
    certificate_url TEXT, -- URL vers PDF dans Supabase Storage

    -- Renouvellement
    renewal_count INTEGER DEFAULT 0,
    last_renewed_at TIMESTAMPTZ,
    pdc_credits_earned INTEGER DEFAULT 0, -- PDC = Professional Development Credits

    -- Admin
    notes TEXT,
    revocation_reason TEXT,

    -- Métadonnées
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);
```

**Contraintes**:
- ✅ `valid_dates`: `expiry_date > issued_date`
- ✅ `valid_renewal_count`: `renewal_count >= 0`
- ✅ `valid_pdc_credits`: `pdc_credits_earned >= 0`

**Index**:
- `idx_user_certifications_user` sur `user_id`
- `idx_user_certifications_type` sur `certification_type`
- `idx_user_certifications_credential` sur `credential_id` (UNIQUE)
- `idx_user_certifications_status` sur `status`
- `idx_user_certifications_expiry` sur `expiry_date`
- `idx_user_certifications_issued` sur `issued_date`

### 🔧 Fonctions Database

#### `generate_credential_id(cert_type)`
```sql
CREATE OR REPLACE FUNCTION generate_credential_id(cert_type certification_type)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    year TEXT;
    sequence_num INTEGER;
BEGIN
    prefix := CASE
        WHEN cert_type = 'CP' THEN 'CP'
        WHEN cert_type = 'SCP' THEN 'SCP'
    END;

    year := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(credential_id FROM '\d{4}$') AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM user_certifications
    WHERE credential_id LIKE prefix || '-' || year || '-%';

    RETURN prefix || '-' || year || '-' || LPAD(sequence_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;
```

**Exemple**:
- Premier CP de 2024 → `CP-2024-0001`
- Dixième SCP de 2024 → `SCP-2024-0010`

#### `is_certification_expiring_soon(cert_id)`
```sql
CREATE OR REPLACE FUNCTION is_certification_expiring_soon(cert_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    days_until_expiry INTEGER;
BEGIN
    SELECT DATE_PART('day', expiry_date - CURRENT_DATE)::INTEGER
    INTO days_until_expiry
    FROM user_certifications
    WHERE id = cert_id;

    RETURN days_until_expiry IS NOT NULL
           AND days_until_expiry <= 60
           AND days_until_expiry > 0;
END;
$$ LANGUAGE plpgsql;
```

**Usage**: Alertes de renouvellement dans les 60 jours

### 🔧 Service API (`CertificationsService`)

**Fichier**: `client/src/entities/certifications/certifications.service.ts`

#### Opérations Principales

| Méthode | Description | Retour |
|---------|-------------|--------|
| `getUserCertifications(userId)` | Certifications d'un utilisateur | `Certification[]` |
| `getCertificationById(id)` | Détails d'une certification | `Certification` |
| `verifyCertification(credentialId)` | Vérification publique par credential ID | `Certification \| null` |
| `createCertification(dto)` | Émettre une nouvelle certification (admin) | `Certification` |
| `updateCertification(id, dto)` | Modifier statut/notes (admin) | `Certification` |
| `revokeCertification(id, reason)` | Révoquer une certification | `void` |
| `renewCertification(id)` | Renouveler une certification expirée | `Certification` |
| `getCertificationStats(userId)` | Stats : nombre actives, expirées, PDC | `CertStats` |

### 🔐 Row Level Security (RLS)

**Lecture**:
- ✅ Utilisateurs : Voir leurs propres certifications
- ✅ Admins : Voir toutes les certifications
- ✅ **Public** : Vérification par `credential_id` (via fonction spéciale)

**Écriture**:
- ✅ Admins uniquement : INSERT, UPDATE, DELETE

### 🎨 Caractéristiques Clés

1. **Credential ID unique**: Format standardisé `{TYPE}-{YEAR}-{SEQ}`
2. **Certificat PDF**: Stocké dans Supabase Storage
3. **Gestion du lifecycle**: active → expired → renewed
4. **PDC tracking**: Crédits de formation continue
5. **Révocation traçable**: Avec raison obligatoire
6. **Vérification publique**: API pour vérifier authenticité

### 📄 Workflow Certification

```
1. Candidat réussit Mock Exam avec score >= passing_score
   ↓
2. Admin vérifie tentative et éligibilité
   ↓
3. Admin crée certification via createCertification()
   ↓ (génère credential_id automatiquement)
4. Système génère PDF certificat
   ↓ (stocké dans Supabase Storage)
5. certificate_url ajouté à la certification
   ↓
6. Utilisateur peut télécharger son certificat
   ↓
7. Certification visible dans son profil
   ↓
8. Vérification publique possible via credential_id
```

---

## 🔗 Relations et Intégrations

### Schéma de Relations

```
users
  ├─→ quiz_attempts
  │     └─→ quizzes
  │           └─→ quiz_questions
  │                 └─→ quiz_answers
  │
  ├─→ mock_exam_attempts
  │     ├─→ mock_exams
  │     │     └─→ mock_exam_questions
  │     │           └─→ mock_exam_answers
  │     └─→ mock_exam_attempt_answers
  │
  ├─→ user_certifications
  │     └─→ quiz_attempts (optionnel)
  │
  └─→ curriculum_modules
        └─→ quizzes (via quiz_id)
```

### Intégration Curriculum ↔ Quiz

**Table `curriculum_modules`**:
```sql
CREATE TABLE curriculum_modules (
    ...
    quiz_id UUID REFERENCES quizzes(id),
    quiz_required BOOLEAN DEFAULT false,
    quiz_passing_score INTEGER DEFAULT 70,
    ...
);
```

**Workflow**:
1. Étudiant termine module curriculum
2. Si `quiz_required = true` → doit passer quiz
3. Score >= `quiz_passing_score` → module marqué "completed"
4. Module suivant déverrouillé

### Intégration Mock Exam ↔ Certification

**Lien indirect** via `quiz_attempt_id` dans `user_certifications`:
```sql
user_certifications.quiz_attempt_id → quiz_attempts.id
```

**⚠️ Note**: Actuellement le lien pointe vers `quiz_attempts` mais devrait probablement pointer vers `mock_exam_attempts` pour les certifications officielles.

**Suggestion d'amélioration**:
```sql
ALTER TABLE user_certifications
ADD COLUMN mock_exam_attempt_id UUID REFERENCES mock_exam_attempts(id);
```

---

## 🏗️ Architecture Technique

### Structure des Services

```
client/src/entities/
├── quiz/
│   ├── quiz.service.ts         # API Quiz
│   ├── quiz.types.ts           # Types TypeScript
│   └── quiz.hooks.ts           # React Query hooks
│
├── mock-exam/
│   ├── mock-exam.service.ts    # API Mock Exams
│   ├── mock-exam.types.ts      # Types TypeScript
│   └── mock-exam.hooks.ts      # React Query hooks
│
└── certifications/
    ├── certifications.service.ts  # API Certifications
    └── certifications.types.ts    # Types TypeScript
```

### Pattern de Service

Tous les services suivent le même pattern:

```typescript
export class ServiceName {
  // Opérations publiques (utilisateurs)
  static async getPublic...(): Promise<Result<T>> {}
  static async create...(): Promise<Result<T>> {}

  // Opérations admin
  static async getAll...(): Promise<Result<T[]>> {}
  static async update...(): Promise<Result<T>> {}
  static async delete...(): Promise<Result<void>> {}
}

// Type de retour unifié
interface Result<T> {
  data: T | null;
  error: Error | null;
}
```

### React Query Integration

**Exemple avec Mock Exams**:
```typescript
// Hook personnalisé
export function useMockExams(filters?: ExamFilters) {
  return useQuery({
    queryKey: ['mock-exams', filters],
    queryFn: () => MockExamService.getActiveExams(filters),
  });
}

// Utilisation dans composant
function ExamsList() {
  const { data: exams, isLoading } = useMockExams({ category: 'cp' });

  if (isLoading) return <Spinner />;
  return <ExamCards exams={exams?.data || []} />;
}
```

---

## 🔐 Permissions et Sécurité

### Matrice de Permissions

| Entité | Voir | Créer | Modifier | Supprimer |
|--------|------|-------|----------|-----------|
| **Quizzes** | Tous (actifs) | Admin | Admin | Admin |
| **Questions** | Tous (actifs) | Admin | Admin | Admin |
| **Answers** | Tous (actifs) | Admin | Admin | Admin |
| **Quiz Attempts** | User (own) | User | User (own) | Admin |
| **Mock Exams** | Tous (actifs) | Admin | Admin | Admin |
| **Mock Questions** | Tous (actifs) | Admin | Admin | Admin |
| **Mock Answers** | Tous (actifs) | Admin | Admin | Admin |
| **Mock Attempts** | User (own) | User | Admin | Admin |
| **Attempt Answers** | User (own) | User (own) | - | Admin |
| **Certifications** | User (own) + Public (verify) | Admin | Admin | Admin |

### Vérification Publique

**Endpoint spécial** pour vérifier authenticité d'un certificat:
```typescript
// Accessible sans authentification
GET /api/certifications/verify/:credentialId

Response:
{
  valid: boolean,
  certification: {
    credential_id: "CP-2024-0001",
    holder_name: "John Doe",
    issued_date: "2024-01-15",
    expiry_date: "2027-01-15",
    status: "active"
  }
}
```

### Protection des Données Sensibles

1. **Réponses correctes**: Visibles seulement après soumission
2. **Scores**: Quiz (non stockés), Mock Exams (stockés mais privés)
3. **Historique**: Chaque utilisateur voit uniquement ses données
4. **Certifications**: Info publique limitée (pas de notes admin)

---

## 🚀 Prochaines Étapes Suggérées

### 1. Lien Mock Exam → Certification
**Problème**: `user_certifications.quiz_attempt_id` pointe vers `quiz_attempts` au lieu de `mock_exam_attempts`

**Solution**:
```sql
ALTER TABLE user_certifications
ADD COLUMN mock_exam_attempt_id UUID REFERENCES mock_exam_attempts(id),
ADD CONSTRAINT one_exam_type CHECK (
  (quiz_attempt_id IS NOT NULL AND mock_exam_attempt_id IS NULL) OR
  (quiz_attempt_id IS NULL AND mock_exam_attempt_id IS NOT NULL)
);
```

### 2. Automatisation Certification
Créer un trigger ou fonction pour auto-émettre certificat après réussite:

```sql
CREATE OR REPLACE FUNCTION auto_issue_certification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.passed = true AND NEW.score >= 80 THEN
    -- Vérifier si pas déjà certifié
    IF NOT EXISTS (
      SELECT 1 FROM user_certifications
      WHERE user_id = NEW.user_id
      AND certification_type = (SELECT category FROM mock_exams WHERE id = NEW.exam_id)::text::certification_type
      AND status = 'active'
    ) THEN
      -- Émettre certification automatiquement
      INSERT INTO user_certifications (
        user_id,
        certification_type,
        credential_id,
        mock_exam_attempt_id,
        issued_date,
        expiry_date,
        status
      ) VALUES (
        NEW.user_id,
        (SELECT category FROM mock_exams WHERE id = NEW.exam_id)::text::certification_type,
        generate_credential_id((SELECT category FROM mock_exams WHERE id = NEW.exam_id)::text::certification_type),
        NEW.id,
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '3 years',
        'active'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_certification
AFTER INSERT ON mock_exam_attempts
FOR EACH ROW
EXECUTE FUNCTION auto_issue_certification();
```

### 3. Génération PDF Certificat
Intégrer service de génération PDF:

**Options**:
- **PDFKit** (Node.js)
- **Puppeteer** (HTML → PDF)
- **Edge Function Supabase** + template

**Workflow**:
```typescript
async function generateCertificatePDF(certificationId: string) {
  const cert = await getCertificationById(certificationId);

  // Générer PDF avec template
  const pdfBuffer = await generatePDF({
    template: 'certification-cp',
    data: {
      name: cert.user.full_name,
      credential_id: cert.credential_id,
      issued_date: cert.issued_date,
      expiry_date: cert.expiry_date,
    }
  });

  // Upload vers Supabase Storage
  const { data: upload } = await supabase.storage
    .from('certificates')
    .upload(`${cert.credential_id}.pdf`, pdfBuffer);

  // Mettre à jour certification avec URL
  await supabase
    .from('user_certifications')
    .update({ certificate_url: upload.path })
    .eq('id', certificationId);
}
```

### 4. Alerts de Renouvellement
Email automatique 60 jours avant expiration:

```typescript
// Cron job quotidien
async function checkExpiringCertifications() {
  const { data: expiring } = await supabase
    .from('user_certifications')
    .select('*, user:users(email, first_name)')
    .eq('status', 'active')
    .lte('expiry_date', addDays(new Date(), 60))
    .gte('expiry_date', new Date());

  for (const cert of expiring) {
    await sendEmail({
      to: cert.user.email,
      subject: `Your ${cert.certification_type} certification expires soon`,
      template: 'certification-renewal-reminder',
      data: {
        name: cert.user.first_name,
        credential_id: cert.credential_id,
        expiry_date: cert.expiry_date,
        days_left: differenceInDays(cert.expiry_date, new Date())
      }
    });
  }
}
```

### 5. Dashboard Analytics
Créer vues matérialisées pour analytics performantes:

```sql
CREATE MATERIALIZED VIEW exam_analytics AS
SELECT
  e.id as exam_id,
  e.title,
  e.category,
  COUNT(DISTINCT a.user_id) as unique_users,
  COUNT(a.id) as total_attempts,
  AVG(a.score)::numeric(5,2) as avg_score,
  COUNT(CASE WHEN a.passed THEN 1 END)::float / NULLIF(COUNT(a.id), 0) * 100 as pass_rate,
  AVG(a.time_spent_minutes)::numeric(5,1) as avg_time_minutes
FROM mock_exams e
LEFT JOIN mock_exam_attempts a ON e.id = a.exam_id
GROUP BY e.id, e.title, e.category;

CREATE UNIQUE INDEX ON exam_analytics (exam_id);
REFRESH MATERIALIZED VIEW CONCURRENTLY exam_analytics;
```

---

## 📊 Résumé Exécutif

### Ce qui existe déjà ✅

1. **Quizzes**: Système complet pour évaluation curriculum (sans scoring)
2. **Mock Exams**: Système complet avec scoring, historique, correction automatique
3. **Certifications**: Table + fonctions pour gestion credentials
4. **Services TypeScript**: API complètes pour les 3 systèmes
5. **RLS Policies**: Sécurité au niveau database
6. **Bilinguisme**: Support EN + AR partout

### Ce qui manque ⚠️

1. **Lien Mock Exam → Certification**: Référence incorrecte dans schema
2. **Génération PDF**: Pas encore implémentée
3. **Auto-émission certificat**: Processus manuel actuellement
4. **Alerts renouvellement**: Pas de cron job configuré
5. **Analytics avancées**: Vues matérialisées à créer

### Prochaine Priorité 🎯

**Option A - Finir l'intégration Certifications**:
1. Corriger lien `mock_exam_attempt_id`
2. Implémenter génération PDF
3. Auto-émission après réussite Mock Exam

**Option B - Améliorer UX Examens**:
1. Timer visuel pendant examens
2. Sauvegarde automatique réponses
3. Mode révision avec explications

**Votre choix ?** 👉 Je suis prêt à implémenter ce que vous voulez!

---

**Document créé par**: Claude Code
**Dernière mise à jour**: 2025-10-10
**Statut**: ✅ Complet et validé
