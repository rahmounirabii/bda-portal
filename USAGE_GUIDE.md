# 📖 Guide d'utilisation - BDA Portal

## 🚀 Démarrage rapide

### 1. Import et utilisation de l'auth
```typescript
// ✅ Import centralisé depuis shared
import { useAuth, ROUTES, hasPermission } from '@/shared'

// Dans un composant
function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <div>Veuillez vous connecter</div>
  }

  return <div>Bonjour {user?.profile?.first_name}</div>
}
```

### 2. Protection des routes
```typescript
// Route simple protégée
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

// Route avec permissions spécifiques
<ProtectedRoute allowedRoles={['admin', 'super_admin']}>
  <AdminPanel />
</ProtectedRoute>

// Route publique
<ProtectedRoute requireAuth={false}>
  <LoginPage />
</ProtectedRoute>
```

### 3. Vérification des permissions
```typescript
import { hasPermission, isAdminRole } from '@/shared'

function AdminButton() {
  const { user } = useAuth()

  // Vérifier une permission spécifique
  if (!hasPermission(user?.profile?.role, 'manage_users')) {
    return null
  }

  // Vérifier si c'est un admin
  if (!isAdminRole(user?.profile?.role)) {
    return null
  }

  return <Button>Actions Admin</Button>
}
```

## 🏗️ Création de nouvelles features

### 1. Structure d'une feature
```
features/ma-feature/
├── components/           # Composants spécifiques à la feature
│   ├── FeatureForm.tsx
│   └── FeatureList.tsx
├── hooks/               # Hooks spécifiques
│   └── useFeature.ts
├── pages/               # Pages de la feature
│   ├── FeaturePage.tsx
│   └── FeatureDetailPage.tsx
├── services/            # Services métier (si nécessaire)
│   └── feature.service.ts
└── index.ts            # Export de la feature
```

### 2. Exemple de création d'une feature "Examens"
```typescript
// features/exams/hooks/useExams.ts
export function useExams() {
  const [exams, setExams] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchExams = useCallback(async () => {
    setIsLoading(true)
    // Logique de récupération
    setIsLoading(false)
  }, [])

  return { exams, isLoading, fetchExams }
}

// features/exams/pages/ExamsPage.tsx
export function ExamsPage() {
  const { exams, isLoading } = useExams()

  if (isLoading) {
    return <LoadingSpinner message="Chargement des examens..." />
  }

  return <ExamsList exams={exams} />
}

// features/exams/index.ts
export { ExamsPage } from './pages/ExamsPage'
export { useExams } from './hooks/useExams'
```

### 3. Ajout dans les routes
```typescript
// shared/constants/routes.ts
export const ROUTES = {
  // ... routes existantes
  EXAMS: '/exams',
  EXAM_DETAIL: '/exams/:id',
} as const

// App.tsx
import { ExamsPage } from '@/features/exams'

<Route path={ROUTES.EXAMS} element={<ExamsPage />} />
```

## 🎨 Composants UI réutilisables

### 1. Utilisation des composants de base
```typescript
import { LoadingSpinner, ProtectedRoute } from '@/shared'

// Spinner avec options
<LoadingSpinner
  size="lg"
  message="Traitement en cours..."
  fullScreen={false}
/>

// Protection avec fallback personnalisé
<ProtectedRoute
  allowedRoles={['admin']}
  fallbackPath="/unauthorized"
>
  <AdminContent />
</ProtectedRoute>
```

### 2. Création d'un nouveau composant UI
```typescript
// shared/ui/CustomButton.tsx
interface CustomButtonProps {
  variant: 'primary' | 'secondary'
  size: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  onClick?: () => void
}

export function CustomButton({ variant, size, children, ...props }: CustomButtonProps) {
  return (
    <button
      className={cn(
        'rounded-md font-medium',
        variant === 'primary' && 'bg-blue-600 text-white',
        size === 'md' && 'px-4 py-2'
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// shared/index.ts - N'oubliez pas d'exporter !
export { CustomButton } from './ui/CustomButton'
```

## 🔧 Services et logique métier

### 1. Création d'un service
```typescript
// entities/exams/exam.service.ts
export class ExamService {
  static async getExams(): Promise<{ data: Exam[] | null; error: Error | null }> {
    try {
      const { data, error } = await supabase
        .from('exams')
        .select('*')
        .order('created_at', { ascending: false })

      return { data, error }
    } catch (err) {
      return { data: null, error: err as Error }
    }
  }

  static async createExam(examData: CreateExamData): Promise<{ data: Exam | null; error: Error | null }> {
    // Logique de création
  }
}
```

### 2. Utilisation dans un hook
```typescript
// features/exams/hooks/useExams.ts
import { ExamService } from '@/entities/exams/exam.service'

export function useExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExams = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    const { data, error } = await ExamService.getExams()

    if (error) {
      setError(error.message)
    } else {
      setExams(data || [])
    }

    setIsLoading(false)
  }, [])

  return { exams, isLoading, error, fetchExams }
}
```

## 🔒 Gestion des permissions avancée

### 1. Hook de permissions personnalisé
```typescript
// shared/hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth()

  const can = useCallback((permission: Permission) => {
    return hasPermission(user?.profile?.role, permission)
  }, [user?.profile?.role])

  const canAny = useCallback((permissions: Permission[]) => {
    return hasAnyPermission(user?.profile?.role, permissions)
  }, [user?.profile?.role])

  const isAdmin = useMemo(() => {
    return isAdminRole(user?.profile?.role)
  }, [user?.profile?.role])

  return { can, canAny, isAdmin }
}

// Utilisation
function AdminFeature() {
  const { can, isAdmin } = usePermissions()

  if (!isAdmin) return <AccessDenied />

  return (
    <div>
      {can('manage_users') && <UserManagement />}
      {can('view_reports') && <Reports />}
    </div>
  )
}
```

### 2. Composant de protection par permission
```typescript
// shared/ui/PermissionGate.tsx
interface PermissionGateProps {
  permission: Permission
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGate({ permission, fallback, children }: PermissionGateProps) {
  const { can } = usePermissions()

  if (!can(permission)) {
    return fallback || null
  }

  return <>{children}</>
}

// Utilisation
<PermissionGate
  permission="delete_user"
  fallback={<div>Accès refusé</div>}
>
  <DeleteButton />
</PermissionGate>
```

## 🐛 Gestion des erreurs

### 1. Hook de gestion d'erreur
```typescript
// shared/hooks/useError.ts
export function useError() {
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error.message)
    } else {
      setError('Une erreur inattendue s\'est produite')
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return { error, handleError, clearError }
}
```

### 2. Boundary d'erreur
```typescript
// shared/ui/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }

    return this.props.children
  }
}
```

## 🧪 Tests (Recommandations)

### 1. Test d'un hook
```typescript
// __tests__/hooks/useAuth.test.ts
import { renderHook, act } from '@testing-library/react-hooks'
import { useAuth } from '@/shared'

test('should login successfully', async () => {
  const { result } = renderHook(() => useAuth())

  await act(async () => {
    await result.current.login('test@example.com', 'password')
  })

  expect(result.current.isAuthenticated).toBe(true)
})
```

### 2. Test d'un composant
```typescript
// __tests__/components/ProtectedRoute.test.tsx
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from '@/shared'

test('should redirect when not authenticated', () => {
  render(
    <ProtectedRoute>
      <div>Protected Content</div>
    </ProtectedRoute>
  )

  expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
})
```

## 💡 Bonnes pratiques

### ✅ À faire
- Utiliser les imports centralisés depuis `@/shared`
- Séparer la logique métier dans les services
- Créer des hooks réutilisables
- Typer toutes les interfaces
- Utiliser les constantes pour les routes
- Valider les données côté client

### ❌ À éviter
- Imports directs profonds (`../../../`)
- Logique métier dans les composants
- État global non nécessaire
- Types `any`
- Routes en dur dans le code
- Données non validées

Cette architecture permet de développer rapidement tout en maintenant la qualité du code ! 🚀