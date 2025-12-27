# 🏗️ BDA Portal - Architecture Technique

## 📋 Vue d'ensemble

Le BDA Portal suit une **architecture modulaire et scalable** basée sur les principes de **Clean Architecture** et **Feature-Driven Development**.

## 🗂️ Structure des dossiers

```
client/src/
├── app/                          # 🚀 Configuration globale de l'app
│   ├── providers/                # Context providers (Auth, Theme, etc.)
│   ├── router/                   # Configuration des routes
│   └── store/                    # State management global
│
├── shared/                       # 🔧 Code partagé entre features
│   ├── types/                    # Types TypeScript globaux
│   ├── constants/                # Constantes (routes, config)
│   ├── config/                   # Configuration (Supabase, app)
│   ├── utils/                    # Utilitaires réutilisables
│   ├── hooks/                    # Hooks personnalisés
│   └── ui/                       # Composants UI de base
│
├── entities/                     # 🎯 Logique métier par entité
│   ├── auth/                     # Authentification
│   ├── user/                     # Gestion utilisateur
│   ├── roles/                    # Gestion des rôles
│   └── [entity]/                 # Autres entités métier
│
├── features/                     # 🧩 Fonctionnalités par module
│   ├── authentication/           # Login, logout, register
│   ├── dashboard/                # Tableaux de bord
│   ├── profile/                  # Profil utilisateur
│   ├── admin/                    # Interface administrateur
│   └── [feature]/                # Autres features
│
└── widgets/                      # 🎨 Composants de haut niveau
    ├── header/                   # En-tête global
    ├── sidebar/                  # Navigation latérale
    └── [widget]/                 # Autres widgets
```

## 🔥 Principes d'architecture

### 1. **Séparation des responsabilités**
- **Entities** : Logique métier pure (services, models)
- **Features** : Fonctionnalités utilisateur (UI + logique)
- **Shared** : Code réutilisable entre features
- **Widgets** : Composants composites réutilisables

### 2. **Dependency Injection**
- Les services sont injectés via les hooks
- Les providers gèrent l'état global
- Pas de dépendances circulaires

### 3. **Type Safety**
- Types TypeScript stricts partout
- Interfaces claires pour chaque layer
- Validation à l'exécution quand nécessaire

### 4. **Performance**
- Code splitting par feature
- Lazy loading des routes
- Optimisation des re-renders

## 🔐 Gestion de l'authentification

### Architecture Auth
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   AuthProvider  │───▶│   useAuth Hook  │───▶│  AuthService    │
│   (Context)     │    │   (Business)    │    │  (Data Layer)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  UI Components  │    │  State Manager  │    │   Supabase      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Flux d'authentification
1. **AuthProvider** : Gère l'état global
2. **useAuth Hook** : Expose la logique d'auth
3. **AuthService** : Communique avec Supabase
4. **ProtectedRoute** : Protège les routes

## 🛠️ Services et Utilitaires

### AuthService
```typescript
// Services purs - pas de React
export class AuthService {
  static async signIn(email: string, password: string) { }
  static async signOut() { }
  static async loadUserProfile(userId: string) { }
}
```

### Hooks personnalisés
```typescript
// Logique réutilisable avec React
export function useAuth() {
  // Gère l'état local + appels au service
  return { user, login, logout, isLoading }
}
```

### Utilitaires
```typescript
// Fonctions pures sans dépendances
export function hasPermission(role: string, permission: string) { }
export function isValidEmail(email: string) { }
```

## 🎨 Composants UI

### Hiérarchie des composants
```
Pages (features/*/pages/)
  ├── Widgets (widgets/)
  │   ├── UI Components (shared/ui/)
  │   └── Primitives (@/components/ui/)
  └── Layouts (widgets/layout/)
```

### Conventions de nommage
- **PascalCase** : Composants React
- **camelCase** : Functions, variables
- **UPPER_CASE** : Constantes
- **kebab-case** : Fichiers, dossiers

## 🔧 Configuration centralisée

### app.config.ts
```typescript
export const APP_CONFIG = {
  name: 'BDA Portal',
  features: { enableDebugMode: ENV.DEV },
  limits: { maxFileSize: 10 * 1024 * 1024 },
  // ...
}
```

### Gestion des rôles
```typescript
export const ROLE_CONFIG = {
  individual: { permissions: ['view_profile'] },
  admin: { permissions: ['*'] },
  // ...
}
```

## 📦 Gestion des imports

### Import centralisé
```typescript
// ✅ Bon - Import depuis l'index
import { useAuth, ROUTES, hasPermission } from '@/shared'

// ❌ Éviter - Imports directs profonds
import { useAuth } from '@/shared/hooks/useAuth'
```

### Alias configurés
```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './client'),
    '@/shared': path.resolve(__dirname, './client/src/shared'),
  }
}
```

## 🚦 Gestion des routes

### Routes typées
```typescript
export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  ADMIN: {
    USERS: '/admin/users',
  }
} as const
```

### Protection par rôle
```typescript
<ProtectedRoute
  allowedRoles={['admin', 'super_admin']}
  fallbackPath={ROUTES.DASHBOARD}
>
  <AdminPanel />
</ProtectedRoute>
```

## 🔍 Gestion des erreurs

### Stratégie d'erreur
1. **Services** : Retournent `{ data, error }`
2. **Hooks** : Gèrent les erreurs et l'état
3. **UI** : Affiche les erreurs utilisateur

### Types d'erreur
```typescript
interface AuthError {
  code: string
  message: string  // Message utilisateur
  details?: any    // Détails techniques
}
```

## 📈 Scalabilité

### Ajout d'une nouvelle feature
1. Créer `/features/nouvelle-feature/`
2. Ajouter les routes dans `constants/routes.ts`
3. Créer les services dans `/entities/`
4. Exporter depuis `/shared/index.ts`

### Ajout d'un nouveau rôle
1. Modifier `database.types.ts` (enum)
2. Ajouter dans `ROLE_CONFIG`
3. Mettre à jour les permissions
4. Tester avec `ProtectedRoute`

## 🧪 Tests (Future)

### Structure de tests
```
__tests__/
├── unit/                 # Tests unitaires
├── integration/          # Tests d'intégration
└── e2e/                  # Tests end-to-end
```

### Convention
- **Services** : Tests unitaires purs
- **Hooks** : Tests avec `@testing-library/react-hooks`
- **Components** : Tests avec `@testing-library/react`

## 🚀 Déploiement

### Build optimisé
- **Code splitting** automatique par route
- **Tree shaking** des dépendances
- **Minification** et compression
- **Service Worker** pour le cache

Cette architecture garantit :
✅ **Maintenabilité** à long terme
✅ **Scalabilité** du code
✅ **Testabilité** complète
✅ **Performance** optimisée
✅ **Developer Experience** excellente