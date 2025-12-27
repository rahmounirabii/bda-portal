# 🚀 BDA Competency Framework - Migration Instructions

## 📋 Migrations Créées

Les migrations suivantes ont été créées pour implémenter le BDA Competency Framework:

| Migration | Fichier | Description |
|-----------|---------|-------------|
| **1** | `20251010000001_create_curriculum_lessons.sql` | Crée la table `curriculum_lessons` (42 sub-competencies) |
| **2** | `20251010000002_extend_mock_exams_for_bda_competency.sql` | Étend `mock_exams` avec nouvelles catégories et liens curriculum |
| **3** | `20251010000003_add_competency_tagging_to_questions.sql` | Ajoute tagging de compétences aux questions |
| **4** | `20251010000004_create_lesson_progress_tracking.sql` | Crée `user_lesson_progress` pour tracking |

---

## ⚠️ AVANT D'EXÉCUTER

### 1. Vérifier Supabase CLI
```bash
supabase --version
```
Si pas installé: https://supabase.com/docs/guides/cli

### 2. Se Connecter au Projet
```bash
cd /home/rr/Projets/FL/MSTQL/bda-association/bda-portal

# Si pas encore lié
supabase link --project-ref dfsbzsxuursvqwnzruqt
```

---

## 🚀 EXÉCUTION DES MIGRATIONS

### Option A: Appliquer TOUTES les migrations (Recommandé)

```bash
cd /home/rr/Projets/FL/MSTQL/bda-association/bda-portal

# Push toutes les nouvelles migrations vers Supabase
supabase db push
```

Cette commande:
- ✅ Détecte automatiquement les nouvelles migrations
- ✅ Les applique dans l'ordre chronologique
- ✅ Met à jour la base de données distante

---

### Option B: Appliquer migration par migration (Debug)

Si tu veux vérifier chaque migration individuellement:

```bash
cd /home/rr/Projets/FL/MSTQL/bda-association/bda-portal

# Migration 1: Curriculum Lessons
supabase db execute --file supabase/migrations/20251010000001_create_curriculum_lessons.sql

# Migration 2: Extend Mock Exams
supabase db execute --file supabase/migrations/20251010000002_extend_mock_exams_for_bda_competency.sql

# Migration 3: Competency Tagging
supabase db execute --file supabase/migrations/20251010000003_add_competency_tagging_to_questions.sql

# Migration 4: Lesson Progress Tracking
supabase db execute --file supabase/migrations/20251010000004_create_lesson_progress_tracking.sql
```

---

## 🔄 GÉNÉRER LES TYPES TYPESCRIPT

Après avoir appliqué les migrations, génère les types TypeScript mis à jour:

```bash
cd /home/rr/Projets/FL/MSTQL/bda-association/bda-portal

# Générer les types depuis Supabase
npm run supabase:generate
```

Ou directement:
```bash
supabase gen types typescript --project-id dfsbzsxuursvqwnzruqt > shared/database.types.ts
```

Ceci va mettre à jour:
- ✅ `shared/database.types.ts` avec les nouvelles tables
- ✅ Types pour `curriculum_lessons`
- ✅ Types pour `user_lesson_progress`
- ✅ Nouvelles colonnes dans `mock_exams`
- ✅ Nouvelles colonnes dans `quiz_questions` et `mock_exam_questions`

---

## ✅ VÉRIFICATION

### 1. Vérifier les tables créées

```bash
# Se connecter à Supabase Studio
# URL: https://supabase.com/dashboard/project/dfsbzsxuursvqwnzruqt

# Ou via CLI
supabase db diff
```

### 2. Vérifier dans Supabase Studio

Navigate to: **Table Editor**

Tu devrais voir:
- ✅ `curriculum_lessons` (nouvelle table)
- ✅ `user_lesson_progress` (nouvelle table)
- ✅ `mock_exams` (colonne `competency_module_id` ajoutée)
- ✅ `curriculum_modules` (colonne `competency_assessment_exam_id` ajoutée)
- ✅ `quiz_questions` (colonnes `competency_section`, `competency_name`, etc.)
- ✅ `mock_exam_questions` (colonnes `competency_section`, `competency_name`, etc.)

### 3. Vérifier les nouvelles enum values

```sql
-- Exécuter dans SQL Editor
SELECT enum_range(NULL::exam_category);
```

Tu devrais voir:
```
{cp,scp,general,pre_assessment,post_assessment,competency_assessment}
```

---

## 📊 CE QUI A ÉTÉ CRÉÉ

### Nouvelles Tables

#### 1. `curriculum_lessons` (42 rows attendues)
```
Colonnes principales:
├─ module_id → curriculum_modules(id)
├─ title, title_ar
├─ content, content_ar (JSONB)
├─ order_index (1, 2, 3)
├─ lesson_quiz_id → quizzes(id)  [QUIZ SYSTEM]
└─ is_published
```

#### 2. `user_lesson_progress`
```
Colonnes principales:
├─ user_id → users(id)
├─ lesson_id → curriculum_lessons(id)
├─ status ('locked', 'in_progress', 'quiz_pending', 'completed')
├─ progress_percentage (0-100)
├─ best_quiz_score (0-100)
└─ completed_at
```

### Tables Modifiées

#### 1. `mock_exams`
```
Nouvelles colonnes:
└─ competency_module_id → curriculum_modules(id)

Nouvelles enum values:
├─ pre_assessment
├─ post_assessment
└─ competency_assessment
```

#### 2. `curriculum_modules`
```
Nouvelle colonne:
└─ competency_assessment_exam_id → mock_exams(id)
```

#### 3. `quiz_questions`
```
Nouvelles colonnes:
├─ competency_section ('knowledge_based' | 'behavioral')
├─ competency_name (TEXT)
├─ sub_competency_name (TEXT)
├─ tags (TEXT[])
└─ is_shared (BOOLEAN)
```

#### 4. `mock_exam_questions`
```
Nouvelles colonnes:
├─ competency_section ('knowledge_based' | 'behavioral')
├─ competency_name (TEXT)
├─ sub_competency_name (TEXT)
├─ difficulty ('easy' | 'medium' | 'hard')
└─ tags (TEXT[])
```

### Nouvelles Fonctions

1. **`is_lesson_unlocked(user_id, lesson_id)`**
   - Vérifie si une lesson est déverrouillée pour un user

2. **`get_lesson_progress_summary(user_id)`**
   - Retourne un résumé de progression (total, completed, locked, etc.)

3. **`initialize_lesson_progress(user_id, certification_type)`**
   - Initialise les records de progression pour toutes les lessons

4. **`get_questions_by_competency(section, name, sub_name, include_shared)`**
   - Récupère les questions filtrées par taxonomie de compétences

---

## 🎯 PROCHAINES ÉTAPES

### 1. Après Migration Réussie

#### A. Créer les 14 Compétences (si pas déjà fait)
Les 14 modules curriculum doivent être créés dans `curriculum_modules`:
- 7 Knowledge-Based (order_index 1-7)
- 7 Behavioral (order_index 8-14)

#### B. Créer les 42 Lessons
Pour chaque compétence, créer 3 lessons dans `curriculum_lessons`:
```sql
-- Exemple pour Competency 1
INSERT INTO curriculum_lessons (module_id, title, order_index, is_published)
VALUES
  ('module-1-uuid', 'Lesson 1: Communication Basics', 1, true),
  ('module-1-uuid', 'Lesson 2: Strategic Communication', 2, true),
  ('module-1-uuid', 'Lesson 3: Advanced Communication', 3, true);
```

#### C. Créer les Assessments

**Pre-Assessment:**
```sql
INSERT INTO mock_exams (title, category, duration_minutes, total_questions, passing_score)
VALUES ('BDA BoCK Pre-Assessment', 'pre_assessment', 180, 120, 70);
```

**Competency Assessments (14):**
```sql
INSERT INTO mock_exams (title, category, competency_module_id, duration_minutes, total_questions)
VALUES ('Competency 1 Assessment', 'competency_assessment', 'module-1-uuid', 60, 30);
-- Repeat for 14 competencies
```

**Post-Assessment:**
```sql
INSERT INTO mock_exams (title, category, duration_minutes, total_questions, passing_score)
VALUES ('BDA BoCK Post-Assessment', 'post_assessment', 180, 120, 70);
```

### 2. Update Services & Types (Phase suivante)

Après génération des types, il faudra créer/mettre à jour:
- [ ] `lesson.service.ts`
- [ ] `lesson-progress.service.ts`
- [ ] Mettre à jour `mock-exam.service.ts`
- [ ] Mettre à jour `quiz.service.ts`

### 3. Admin UI (Phase suivante)

Créer/mettre à jour les interfaces admin:
- [ ] `LessonManager.tsx`
- [ ] `QuestionBankManager.tsx`
- [ ] Update `QuizEditor.tsx`
- [ ] Update `MockExamManager.tsx`

---

## 🆘 EN CAS DE PROBLÈME

### Rollback d'une Migration

Si une migration échoue:

```bash
# Voir l'historique des migrations
supabase migration list

# Rollback la dernière migration
supabase db reset
```

### Erreurs Communes

#### 1. "Enum value already exists"
Si `exam_category` enum values existent déjà:
- C'est OK, `ADD VALUE IF NOT EXISTS` les ignore

#### 2. "Column already exists"
Si colonnes existent déjà:
- C'est OK, `ADD COLUMN IF NOT EXISTS` les ignore

#### 3. "Function already exists"
Les fonctions utilisent `CREATE OR REPLACE`, donc pas de conflit

---

## 📞 Support

En cas de problème:
1. Vérifier les logs: `supabase db logs`
2. Consulter Supabase Studio SQL Editor
3. Checker l'historique: `supabase migration list`

---

## ✅ COMMANDES FINALES RÉSUMÉES

```bash
# 1. Se placer dans le projet
cd /home/rr/Projets/FL/MSTQL/bda-association/bda-portal

# 2. Appliquer les migrations
supabase db push

# 3. Générer les types TypeScript
npm run supabase:generate

# 4. Vérifier dans Supabase Studio
# https://supabase.com/dashboard/project/dfsbzsxuursvqwnzruqt
```

**C'est tout! 🎉**
