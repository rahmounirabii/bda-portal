# 🚀 Guide de Démarrage Rapide - Système de Leçons BDA

**Date**: 2025-10-20
**Version**: 1.0

---

## 📋 Vue d'Ensemble

Le système de gestion des leçons BDA permet de créer et gérer les **42 sous-compétences** (3 leçons par module) du framework BDA BoK.

**Architecture**:
- **14 Modules** (Compétences principales) → Existants
- **42 Leçons** (Sous-compétences, 3 par module) → ✨ NOUVEAU
- **Quiz par leçon** → Lien vers système Quiz existant
- **Déverrouillage séquentiel** → Leçon 1 → 2 → 3

---

## ✅ Ce qui a été fait

### Phase 1: Base de Données ✅
- [x] Table `curriculum_lessons` (42 leçons)
- [x] Table `user_lesson_progress` (suivi utilisateur)
- [x] Fonctions PostgreSQL (unlock, summary, init)
- [x] Migrations appliquées avec succès

### Phase 2: Service Layer ✅
- [x] Types TypeScript complets
- [x] Services CRUD (LessonService, LessonProgressService)
- [x] Hooks React Query (28 hooks)
- [x] Gestion du cache et invalidation

### Phase 3: Interface Admin ✅
- [x] Page LessonManager
- [x] Composant LessonTable
- [x] Composant LessonEditor (formulaire complet)
- [x] Composant LessonFilters
- [x] Compilation TypeScript OK

---

## 🎯 Comment Utiliser

### 1. Accéder à la Page de Gestion

**Option A**: Ajouter une route dans votre système de routing

```typescript
// Dans votre fichier de routes (à déterminer selon votre structure)
import { LessonManager } from '@/features/curriculum/admin';

// Ajouter la route
<Route path="/admin/curriculum/lessons" element={<LessonManager />} />
```

**Option B**: Créer un lien de navigation

```typescript
import { Link } from 'react-router-dom';

<Link to="/admin/curriculum/lessons">
  <Button>
    <BookOpen className="mr-2" />
    Gérer les Leçons
  </Button>
</Link>
```

### 2. Créer Votre Première Leçon

1. **Aller sur la page** `/admin/curriculum/lessons`
2. **Cliquer** sur le bouton "Nouvelle Leçon" (en haut à droite)
3. **Remplir les 3 onglets**:

   **Onglet Informations**:
   - Module: Sélectionner une des 14 compétences
   - Ordre: Choisir 1, 2 ou 3 (première/deuxième/troisième leçon)
   - Titre FR: Ex: "Introduction à l'analyse de données"
   - Description FR: Court paragraphe explicatif
   - Durée estimée: Ex: 2 heures
   - Publier: Toggle ON pour publier immédiatement

   **Onglet Contenu**:
   - Contenu JSON: Pour l'instant, entrer un JSON simple comme:
   ```json
   {
     "type": "doc",
     "content": [
       {
         "type": "paragraph",
         "content": [
           {
             "type": "text",
             "text": "Contenu de votre leçon ici..."
           }
         ]
       }
     ]
   }
   ```

   **Onglet Quiz**:
   - ID du Quiz: Laisser vide pour l'instant (ou entrer un UUID si quiz existe)
   - Quiz obligatoire: ON
   - Score de passage: 70%

4. **Cliquer** "Créer"
5. **Vérifier** que la leçon apparaît dans le tableau

### 3. Gérer les Leçons

**Filtrer les leçons**:
- Par module (compétence)
- Par ordre (1, 2, 3)
- Par statut quiz (avec/sans)
- Recherche texte en temps réel

**Actions disponibles**:
- ✏️ **Éditer** - Modifier les informations
- 👁️ **Publier/Dépublier** - Toggle visibilité
- 🗑️ **Supprimer** - Avec confirmation

**Statistiques**:
- Total leçons créées (objectif: 42)
- Leçons publiées vs brouillons
- Leçons avec/sans quiz

---

## 📊 Structure des Données

### Table: curriculum_lessons

```sql
CREATE TABLE curriculum_lessons (
    id UUID PRIMARY KEY,
    module_id UUID REFERENCES curriculum_modules(id),  -- 1 des 14 modules
    title TEXT NOT NULL,                                -- Titre FR
    title_ar TEXT,                                      -- Titre AR
    description TEXT,                                   -- Description FR
    description_ar TEXT,                                -- Description AR
    content JSONB NOT NULL,                             -- Contenu riche FR (TipTap)
    content_ar JSONB,                                   -- Contenu riche AR
    learning_objectives TEXT[],                         -- Objectifs pédagogiques
    learning_objectives_ar TEXT[],                      -- Objectifs AR
    estimated_duration_hours DECIMAL,                   -- Durée estimée
    order_index INTEGER CHECK (order_index BETWEEN 1 AND 3),  -- 1, 2 ou 3
    lesson_quiz_id UUID REFERENCES quizzes(id),        -- Quiz lié (optionnel)
    quiz_required BOOLEAN DEFAULT true,                 -- Quiz obligatoire?
    quiz_passing_score INTEGER DEFAULT 70,              -- Score minimum
    is_published BOOLEAN DEFAULT false,                 -- Publié?
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (module_id, order_index)                     -- 1 seule leçon par ordre/module
);
```

### Contraintes Importantes

1. **Unicité de l'ordre**: Un module ne peut avoir qu'une seule leçon avec `order_index = 1`, une avec `order_index = 2`, etc.
2. **Ordre de 1 à 3**: Chaque module a exactement 3 leçons
3. **Total de 42 leçons**: 14 modules × 3 leçons = 42 leçons

---

## 🔗 Intégrations

### Avec les Modules Existants

Chaque leçon appartient à 1 des 14 modules (compétences):

```typescript
const modules = [
  // 7 Compétences "Savoir" (Knowledge-Based)
  { id: '...', competency_name: 'Data Governance & Ethics', section_type: 'knowledge_based' },
  { id: '...', competency_name: 'Data Literacy', section_type: 'knowledge_based' },
  // ... 5 autres

  // 7 Compétences "Comportemental" (Behavioral)
  { id: '...', competency_name: 'Leadership & Strategy', section_type: 'behavioral' },
  // ... 6 autres
];
```

Chaque module aura donc:
- **Leçon 1** (order_index = 1)
- **Leçon 2** (order_index = 2)
- **Leçon 3** (order_index = 3)

### Avec le Système Quiz

Les leçons peuvent être liées à un quiz via `lesson_quiz_id`:

```typescript
// Dans LessonEditor
<FormField name="lesson_quiz_id">
  <Input placeholder="UUID du quiz" />
</FormField>
```

**À faire prochainement**:
- Dropdown de sélection de quiz existants
- Bouton "Créer nouveau quiz" qui ouvre QuizEditor
- Prévisualisation du quiz lié

---

## 🎨 Personnalisation

### Modifier les Couleurs des Badges

Dans [LessonTable.tsx](client/src/features/curriculum/admin/components/LessonTable.tsx:47-56):

```typescript
const getOrderBadgeColor = (order: number) => {
  switch (order) {
    case 1:
      return 'bg-blue-100 text-blue-800'; // Modifier ici
    case 2:
      return 'bg-purple-100 text-purple-800'; // Modifier ici
    case 3:
      return 'bg-pink-100 text-pink-800'; // Modifier ici
  }
};
```

### Ajouter des Champs Personnalisés

1. **Ajouter dans le schéma DB** (nouvelle migration)
2. **Mettre à jour les types** dans [lesson.types.ts](client/src/entities/curriculum/lesson.types.ts)
3. **Ajouter au formulaire** dans [LessonEditor.tsx](client/src/features/curriculum/admin/components/LessonEditor.tsx)
4. **Afficher dans le tableau** dans [LessonTable.tsx](client/src/features/curriculum/admin/components/LessonTable.tsx)

---

## 🐛 Résolution de Problèmes

### Erreur: "Ordre déjà utilisé"

**Cause**: Vous tentez de créer une leçon avec un `order_index` déjà utilisé dans ce module.

**Solution**:
- Choisir un autre ordre (1, 2 ou 3)
- OU éditer/supprimer la leçon existante avec cet ordre

**Validation**: Le formulaire vous empêche de soumettre si l'ordre n'est pas disponible.

### Erreur: "JSON invalide"

**Cause**: Le contenu entré n'est pas du JSON valide.

**Solution**:
- Vérifier les accolades, guillemets, virgules
- Utiliser un validateur JSON en ligne
- Exemple minimal valide:
  ```json
  {"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"Hello"}]}]}
  ```

### Les leçons ne s'affichent pas

**Vérifications**:
1. Vérifier que les migrations sont appliquées: `npx supabase migration list`
2. Vérifier qu'il y a des données: Aller dans Supabase Table Editor → `curriculum_lessons`
3. Vérifier les filtres: Cliquer "Réinitialiser" dans la page
4. Vérifier la console: Erreurs réseau ou permissions?

### Impossible de supprimer une leçon

**Causes possibles**:
- Leçon liée à des progressions utilisateurs (foreign key)
- Permissions RLS insuffisantes

**Solution temporaire**: Dépublier plutôt que supprimer

---

## 📚 Prochaines Étapes

### 1. Créer les 42 Leçons

**Plan recommandé**:
1. Créer d'abord la **Leçon 1** de chaque module (14 leçons)
2. Puis créer toutes les **Leçon 2** (14 leçons)
3. Enfin créer toutes les **Leçon 3** (14 leçons)
4. **Total**: 42 leçons

**Contenu minimal pour commencer**:
- Titre descriptif
- Description courte
- Contenu JSON simple (à enrichir plus tard)
- Laisser quiz_id vide (à ajouter plus tard)

### 2. Intégrer l'Éditeur WYSIWYG

**Option 1: TipTap**
```bash
npm install @tiptap/react @tiptap/starter-kit
```

**Option 2: Lexical**
```bash
npm install lexical @lexical/react
```

Ensuite, remplacer le `<Textarea>` JSON par l'éditeur dans [LessonEditor.tsx](client/src/features/curriculum/admin/components/LessonEditor.tsx:441-456).

### 3. Créer l'Interface Utilisateur

**Fichiers à créer**:
- `client/src/features/curriculum/user/pages/LessonViewer.tsx`
- `client/src/features/curriculum/user/components/LessonContent.tsx`
- `client/src/features/curriculum/user/components/LessonProgress.tsx`
- `client/src/features/curriculum/user/components/LessonQuiz.tsx`

**Fonctionnalités**:
- Affichage du contenu riche
- Barre de progression
- Bouton "Marquer comme lu"
- Déverrouillage séquentiel (🔒 leçons suivantes)
- Quiz intégré en fin de leçon

### 4. Créer les Quiz pour les Leçons

**Workflow**:
1. Aller dans le système Quiz existant
2. Créer un quiz pour chaque leçon
3. Copier l'UUID du quiz
4. Éditer la leçon et coller l'UUID dans `lesson_quiz_id`

**Optimisation future**:
- Dropdown de sélection dans LessonEditor
- Bouton "Créer quiz" qui ouvre QuizEditor

---

## 🎯 Checklist de Déploiement

Avant de déployer en production:

- [ ] **Migrations appliquées** sur la DB de production
- [ ] **Types générés** et compilés
- [ ] **42 leçons créées** (ou nombre suffisant)
- [ ] **Quiz créés et liés** aux leçons
- [ ] **Permissions RLS configurées** (qui peut voir/éditer?)
- [ ] **Route ajoutée** dans le système de navigation admin
- [ ] **Tests manuels** effectués (créer, éditer, supprimer, filtrer)
- [ ] **Traductions AR** complétées (titres, descriptions)
- [ ] **Contenu validé** par l'équipe pédagogique
- [ ] **Documentation utilisateur** créée

---

## 📞 Support

### Ressources

- **Documentation Phase 1**: [BDA_COMPETENCY_FRAMEWORK_COMPLETE_ANALYSIS.md](BDA_COMPETENCY_FRAMEWORK_COMPLETE_ANALYSIS.md)
- **Documentation Phase 2**: [LESSON_SERVICE_LAYER_COMPLETE.md](LESSON_SERVICE_LAYER_COMPLETE.md)
- **Documentation Phase 3**: [PHASE_3_UI_ADMIN_COMPLETE.md](PHASE_3_UI_ADMIN_COMPLETE.md)
- **Ce guide**: [GUIDE_DEMARRAGE_RAPIDE_LESSONS.md](GUIDE_DEMARRAGE_RAPIDE_LESSONS.md)

### Commandes Utiles

```bash
# Vérifier migrations
npx supabase migration list

# Générer types TypeScript
npm run supabase:generate

# Vérifier compilation
npm run typecheck

# Lancer dev
npm run dev

# Voir les tables Supabase
# → Aller dans Supabase Dashboard → Table Editor → curriculum_lessons
```

---

## 🎉 Félicitations !

Vous avez maintenant un système complet de gestion des leçons pour le framework BDA BoK. Les 3 phases (DB, Service, UI Admin) sont terminées et fonctionnelles.

**Prochaine grande étape**: Créer l'interface utilisateur pour que les apprenants puissent consommer les leçons et suivre leur progression !

---

**Créé**: 2025-10-20
**Version**: 1.0
**Status**: ✅ Système Admin Opérationnel
