# 🎯 Plan de Développement - Quiz & Support Tickets

## 📋 Vue d'ensemble

Développement de **2 fonctionnalités majeures** du BDA Portal :
1. **Système de Quiz (Mock Exams)** - Examens pratiques pour auto-évaluation
2. **Système de Tickets Support** - Gestion des demandes d'assistance

**Stack Technique** : React + TypeScript + Supabase (pas de backend PHP)

---

## 🎓 Feature 1: Système de Quiz (Mock Exams)

### **Fonctionnalités Clés**

#### 📝 Pour les Utilisateurs (Individuels)
- **Examens pratiques gratuits** bilingues (EN/AR)
- Interface simulant l'**examen officiel**
- Résultats **non enregistrés** (auto-évaluation)
- Types de questions :
  - QCM (Multiple Choice)
  - Vrai/Faux
  - Questions à réponses multiples
- Timer intégré (similaire examen réel)
- Feedback immédiat à la fin
- Pas de sauvegarde de progression

#### 🎨 Pour les Admins (Content Manager)
- **Création/édition de quiz**
- Gestion de la banque de questions
- Organisation par **certification** (CP™, SCP™)
- **Catégorisation** par domaine BoCK™
- Traduction bilingue des questions
- Difficulté des questions (Easy, Medium, Hard)
- Activation/désactivation de quiz
- **Pas de scoring** - juste auto-évaluation

### **Architecture Base de Données - Quiz**

```sql
-- Table: quizzes
- id (uuid, PK)
- title (text)
- title_ar (text, nullable) -- Titre arabe
- description (text)
- description_ar (text, nullable)
- certification_type (enum: 'CP', 'SCP')
- difficulty_level (enum: 'easy', 'medium', 'hard')
- time_limit_minutes (integer)
- passing_score_percentage (integer) -- Pour affichage seulement
- is_active (boolean)
- created_by (uuid, FK → users)
- created_at (timestamp)
- updated_at (timestamp)

-- Table: quiz_questions
- id (uuid, PK)
- quiz_id (uuid, FK → quizzes)
- question_text (text)
- question_text_ar (text, nullable)
- question_type (enum: 'multiple_choice', 'true_false', 'multi_select')
- bock_domain (text) -- Domaine BoCK™ (ex: Strategic Thinking)
- difficulty (enum: 'easy', 'medium', 'hard')
- points (integer, default: 1)
- order_index (integer) -- Ordre d'affichage
- created_at (timestamp)
- updated_at (timestamp)

-- Table: quiz_answers
- id (uuid, PK)
- question_id (uuid, FK → quiz_questions)
- answer_text (text)
- answer_text_ar (text, nullable)
- is_correct (boolean)
- explanation (text, nullable) -- Explication pour feedback
- explanation_ar (text, nullable)
- order_index (integer)
- created_at (timestamp)

-- Table: quiz_attempts (optionnel - si on veut tracker sans stocker)
- id (uuid, PK)
- quiz_id (uuid, FK → quizzes)
- user_id (uuid, FK → users)
- started_at (timestamp)
- completed_at (timestamp, nullable)
-- Pas de score enregistré - juste pour analytics
```

### **RLS Policies - Quiz**
```sql
-- quizzes: Lecture publique pour users authentifiés
- SELECT: auth.role() = 'authenticated' AND is_active = true
- INSERT/UPDATE/DELETE: role IN ('admin', 'super_admin', 'content_manager')

-- quiz_questions: Lecture publique
- SELECT: auth.role() = 'authenticated'
- INSERT/UPDATE/DELETE: role IN ('admin', 'super_admin', 'content_manager')

-- quiz_answers: Lecture publique (avec is_correct masqué avant soumission)
- SELECT: auth.role() = 'authenticated'
- INSERT/UPDATE/DELETE: role IN ('admin', 'super_admin', 'content_manager')
```

---

## 🎫 Feature 2: Système de Support Tickets

### **Fonctionnalités Clés**

#### 📬 Pour les Utilisateurs
- **Créer un ticket** support
- Catégories :
  - Certification Questions
  - Exam Issues
  - PDC Management
  - Account/Login Issues
  - Partnership Application
  - Technical Problems
  - Other
- Priorité : Low, Normal, High
- Attachements (screenshots, documents)
- **Suivi de l'état** :
  - New → In Progress → Resolved → Closed
- Historique des tickets
- Notifications par email
- Chat/Réponses intégrées

#### 🛠️ Pour les Admins (Technical Support)
- **Dashboard tickets**
- Filtres : Statut, priorité, catégorie, utilisateur
- Attribution à un agent
- Réponses avec templates
- Notes internes (non visibles par user)
- Historique complet
- SLA tracking
- Métriques : Temps de réponse moyen, taux de résolution

### **Architecture Base de Données - Support**

```sql
-- Table: support_tickets
- id (uuid, PK)
- ticket_number (text, unique) -- Auto-généré: TICK-2025-0001
- user_id (uuid, FK → users)
- category (enum: 'certification', 'exam', 'pdc', 'account', 'partnership', 'technical', 'other')
- subject (text)
- description (text)
- priority (enum: 'low', 'normal', 'high')
- status (enum: 'new', 'in_progress', 'waiting_user', 'resolved', 'closed')
- assigned_to (uuid, FK → users, nullable) -- Agent assigné
- created_at (timestamp)
- updated_at (timestamp)
- resolved_at (timestamp, nullable)
- closed_at (timestamp, nullable)

-- Table: ticket_messages
- id (uuid, PK)
- ticket_id (uuid, FK → support_tickets)
- user_id (uuid, FK → users)
- message (text)
- is_internal_note (boolean) -- Note interne admin
- created_at (timestamp)
- updated_at (timestamp)

-- Table: ticket_attachments
- id (uuid, PK)
- ticket_id (uuid, FK → support_tickets)
- message_id (uuid, FK → ticket_messages, nullable)
- file_name (text)
- file_path (text) -- Supabase Storage path
- file_size (bigint)
- mime_type (text)
- uploaded_by (uuid, FK → users)
- created_at (timestamp)

-- Table: ticket_status_history
- id (uuid, PK)
- ticket_id (uuid, FK → support_tickets)
- old_status (text)
- new_status (text)
- changed_by (uuid, FK → users)
- change_reason (text, nullable)
- created_at (timestamp)

-- Table: ticket_templates (pour admins)
- id (uuid, PK)
- title (text)
- category (text)
- content (text)
- created_by (uuid, FK → users)
- is_active (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### **RLS Policies - Support**
```sql
-- support_tickets
- SELECT: user_id = auth.uid() OR role IN ('admin', 'super_admin', 'technical_support')
- INSERT: auth.role() = 'authenticated'
- UPDATE: user_id = auth.uid() (pour fermer) OR role IN ('admin', 'super_admin', 'technical_support')
- DELETE: role IN ('super_admin')

-- ticket_messages
- SELECT: ticket.user_id = auth.uid() AND NOT is_internal_note
         OR role IN ('admin', 'super_admin', 'technical_support')
- INSERT: auth.role() = 'authenticated'
- UPDATE/DELETE: user_id = auth.uid() OR role IN ('admin', 'super_admin')

-- ticket_attachments
- SELECT: Via ticket permissions
- INSERT: auth.role() = 'authenticated'
- DELETE: uploaded_by = auth.uid() OR role IN ('admin', 'super_admin')
```

---

## 📐 Architecture Frontend

### **Structure des Dossiers**

```
client/src/
├── entities/
│   ├── quiz/
│   │   ├── quiz.types.ts
│   │   ├── quiz.service.ts
│   │   └── quiz.hooks.ts
│   └── support/
│       ├── ticket.types.ts
│       ├── ticket.service.ts
│       └── ticket.hooks.ts
│
├── features/
│   ├── quiz/
│   │   ├── components/
│   │   │   ├── QuizList.tsx
│   │   │   ├── QuizCard.tsx
│   │   │   ├── QuizPlayer.tsx
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── QuizResults.tsx
│   │   │   └── QuizTimer.tsx
│   │   ├── admin/
│   │   │   ├── QuizManager.tsx
│   │   │   ├── QuizEditor.tsx
│   │   │   ├── QuestionEditor.tsx
│   │   │   └── QuestionBank.tsx
│   │   └── index.ts
│   │
│   └── support/
│       ├── components/
│       │   ├── TicketList.tsx
│       │   ├── TicketCard.tsx
│       │   ├── TicketDetail.tsx
│       │   ├── CreateTicketForm.tsx
│       │   ├── TicketChat.tsx
│       │   └── FileUpload.tsx
│       ├── admin/
│       │   ├── TicketDashboard.tsx
│       │   ├── TicketQueue.tsx
│       │   ├── TicketAssignment.tsx
│       │   └── TemplateManager.tsx
│       └── index.ts
│
└── shared/
    ├── constants/
    │   ├── quiz.constants.ts
    │   └── ticket.constants.ts
    └── ui/
        ├── Timer.tsx
        ├── FileUploader.tsx
        └── StatusBadge.tsx
```

---

## 🔧 Services & Hooks

### **Quiz Services**

```typescript
// entities/quiz/quiz.service.ts
export class QuizService {
  static async getActiveQuizzes(certificationType?: string)
  static async getQuizById(id: string)
  static async getQuizQuestions(quizId: string)
  static async submitQuizAttempt(quizId: string, startTime: Date)

  // Admin only
  static async createQuiz(data: CreateQuizDTO)
  static async updateQuiz(id: string, data: UpdateQuizDTO)
  static async deleteQuiz(id: string)
  static async createQuestion(quizId: string, data: QuestionDTO)
  static async updateQuestion(id: string, data: QuestionDTO)
  static async deleteQuestion(id: string)
}

// entities/quiz/quiz.hooks.ts
export const useQuizzes = ()
export const useQuiz = (id: string)
export const useQuizAttempt = ()
```

### **Support Services**

```typescript
// entities/support/ticket.service.ts
export class TicketService {
  static async createTicket(data: CreateTicketDTO)
  static async getMyTickets(filters?: TicketFilters)
  static async getTicketById(id: string)
  static async addMessage(ticketId: string, message: string)
  static async uploadAttachment(ticketId: string, file: File)
  static async closeTicket(id: string)

  // Admin only
  static async getAllTickets(filters?: AdminTicketFilters)
  static async assignTicket(ticketId: string, agentId: string)
  static async updateTicketStatus(id: string, status: TicketStatus)
  static async addInternalNote(ticketId: string, note: string)
}

// entities/support/ticket.hooks.ts
export const useTickets = (filters?: TicketFilters)
export const useTicket = (id: string)
export const useTicketMessages = (ticketId: string)
export const useCreateTicket = ()
```

---

## 🚀 Plan de Développement

### **Phase 1 : Base de Données (Jour 1-2)**
- ✅ Créer migrations Supabase
- ✅ Configurer RLS policies
- ✅ Tester les permissions
- ✅ Créer fonctions SQL helper si nécessaire

### **Phase 2 : Quiz System (Jour 3-6)**
- ✅ Entities : Types, Services, Hooks
- ✅ Admin : QuizManager, QuizEditor, QuestionBank
- ✅ User : QuizList, QuizPlayer, Results
- ✅ Tests et validation

### **Phase 3 : Support Tickets (Jour 7-10)**
- ✅ Entities : Types, Services, Hooks
- ✅ User : CreateTicket, TicketList, TicketDetail
- ✅ Admin : Dashboard, Queue, Assignment
- ✅ File upload integration (Supabase Storage)

### **Phase 4 : Polish & Integration (Jour 11-12)**
- ✅ RTL pour Arabe
- ✅ Notifications
- ✅ Error handling
- ✅ Loading states
- ✅ Tests E2E

---

## 📊 Priorisation

### **Must Have (MVP)**
- [x] Quiz: Create, List, Play, Results
- [x] Tickets: Create, List, Reply, Close
- [x] Admin: Quiz CRUD, Ticket Management
- [x] RLS correct sur toutes les tables

### **Should Have**
- [ ] Templates de réponses support
- [ ] Métriques support dashboard
- [ ] Quiz attempt analytics (anonyme)

### **Nice to Have**
- [ ] Quiz randomisation questions
- [ ] Ticket SLA tracking
- [ ] Email notifications
- [ ] Rich text editor pour tickets

---

## 🎨 Design System

### **Composants Réutilisables Nécessaires**
- `<Timer />` - Compte à rebours quiz
- `<FileUploader />` - Upload attachements tickets
- `<StatusBadge />` - Statut ticket/quiz
- `<ProgressBar />` - Progression quiz
- `<ChatMessage />` - Messages ticket
- `<RichTextEditor />` - Édition contenu (admin)

### **Couleurs par Statut**
```typescript
// Tickets
- new: blue-500
- in_progress: yellow-500
- waiting_user: orange-500
- resolved: green-500
- closed: gray-500

// Priorité
- low: gray-400
- normal: blue-400
- high: red-500

// Quiz Difficulty
- easy: green-400
- medium: yellow-400
- hard: red-400
```

---

## 🔐 Sécurité

### **Validation**
- ✅ Input sanitization (XSS protection)
- ✅ File upload validation (type, size)
- ✅ Rate limiting sur création tickets
- ✅ RLS strict sur toutes les tables

### **Storage Supabase**
- Bucket: `support-attachments`
- Max file size: 10MB
- Types autorisés: images, PDF, documents
- Policies: User peut upload, admins full access

---

## 📝 Notes Importantes

1. **Pas de backend PHP** - Tout en Supabase + React
2. **RLS est critique** - Les users ne doivent voir que leurs données
3. **Bilinguisme** - Prévoir colonnes `_ar` pour tout le contenu
4. **Performance** - Pagination sur listes (20 items/page)
5. **Offline** - Pas de support offline pour MVP
6. **Real-time** - Optionnel pour tickets (Supabase Realtime)

---

Prêt à démarrer le développement ! 🚀
