# 🔐 Système de Permissions Professionnel - BDA Portal

## 🎯 Architecture du système

### **Niveaux de sécurité**

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│ 1. PermissionGate Components  │ 2. usePermissions Hook      │
│    - UI-level protection      │    - Business logic         │
│    - Role-based rendering     │    - Permission checks       │
├─────────────────────────────────────────────────────────────┤
│                    BACKEND (Supabase)                       │
├─────────────────────────────────────────────────────────────┤
│ 3. RLS Policies              │ 4. Security Functions        │
│    - Database-level security │    - Server-side validation  │
│    - Row-level filtering     │    - Business rules          │
└─────────────────────────────────────────────────────────────┘
```

## 🛠️ Fonctions de sécurité Supabase

### **Fonctions disponibles**

```sql
-- Obtenir le rôle de l'utilisateur actuel
SELECT auth.get_user_role();

-- Vérifier si l'utilisateur est admin
SELECT auth.is_admin();

-- Vérifier si l'utilisateur est super admin
SELECT auth.is_super_admin();

-- Vérifier une permission spécifique
SELECT auth.has_permission('manage_users');

-- Promouvoir un utilisateur (fonction sécurisée)
SELECT public.promote_user('user-uuid', 'admin');
```

### **Permissions définies**

| Permission | Admin | Super Admin | ECP | PDP | Individual |
|------------|-------|-------------|-----|-----|------------|
| `view_profile` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `edit_profile` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `manage_users` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `view_all_users` | ✅ | ✅ | ❌ | ❌ | ❌ |
| `manage_roles` | ❌ | ✅ | ❌ | ❌ | ❌ |
| `view_analytics` | ✅ | ✅ | ✅ | ✅ | ❌ |
| `manage_content` | ✅ | ✅ | ✅ | ❌ | ❌ |

## 🎨 Utilisation Frontend

### **1. Hook de permissions avancé**

```typescript
import { usePermissions } from '@/shared'

function AdminPanel() {
  const {
    can,
    canSync,
    isAdmin,
    isSuperAdmin,
    promoteUser
  } = usePermissions()

  // Vérification asynchrone (recommandée pour actions importantes)
  const handleDeleteUser = async () => {
    if (await can('manage_users')) {
      // Action autorisée
    }
  }

  // Vérification synchrone (pour l'affichage UI)
  if (!canSync('view_all_users')) {
    return <AccessDenied />
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      {isSuperAdmin && <SuperAdminTools />}
    </div>
  )
}
```

### **2. Composants de protection**

```typescript
import { PermissionGate, RoleGate, RoleSwitch } from '@/shared'

// Protection par permission
<PermissionGate
  permission="manage_users"
  fallback={<div>Accès refusé</div>}
>
  <UserManagement />
</PermissionGate>

// Protection par permissions multiples
<PermissionGate
  permissions={['view_analytics', 'manage_content']}
  requireAll={false} // OU logique (au moins une)
  fallback={<AccessDenied />}
>
  <AnalyticsPanel />
</PermissionGate>

// Protection par rôle (plus rapide)
<RoleGate roles={['admin', 'super_admin']}>
  <AdminTools />
</RoleGate>

// Affichage conditionnel par rôle
<RoleSwitch
  adminComponent={<AdminDashboard />}
  ecpComponent={<ECPDashboard />}
  pdpComponent={<PDPDashboard />}
  individualComponent={<UserDashboard />}
/>
```

### **3. Protection des routes**

```typescript
import { ProtectedRoute } from '@/shared'

// Route avec permissions
<ProtectedRoute
  allowedRoles={['admin', 'super_admin']}
  fallbackPath="/unauthorized"
>
  <AdminPage />
</ProtectedRoute>

// Route avec permissions spécifiques
<ProtectedRoute
  requiredPermissions={['manage_users']}
>
  <UserManagementPage />
</ProtectedRoute>
```

## 🔧 Services et API

### **AuthService étendu**

```typescript
import { AuthService } from '@/entities/auth/auth.service'

// Vérifier une permission côté serveur
const { hasPermission } = await AuthService.checkPermission('manage_users')

// Promouvoir un utilisateur
const { success } = await AuthService.promoteUser(userId, 'admin')

// Charger le profil avec informations enrichies
const { profile } = await AuthService.loadUserProfile(userId)
```

### **Gestion des erreurs**

```typescript
try {
  await AuthService.promoteUser(userId, 'admin')
} catch (error) {
  if (error.message.includes('Insufficient permissions')) {
    toast.error('Vous n\'avez pas les permissions nécessaires')
  } else if (error.message.includes('last super admin')) {
    toast.error('Impossible de rétrograder le dernier super admin')
  }
}
```

## 🔒 Sécurité et bonnes pratiques

### **✅ Sécurité multicouche**

1. **Frontend** : UX/UI et feedback utilisateur
2. **RLS Policies** : Sécurité base de données
3. **Security Functions** : Logique métier serveur
4. **Triggers** : Validation automatique

### **✅ Principe du moindre privilège**

- Chaque rôle a uniquement les permissions nécessaires
- Vérifications à chaque niveau (UI + DB)
- Permissions granulaires par action

### **✅ Résilience**

- Fallbacks en cas d'erreur réseau
- Cache des permissions pour performance
- Validation côté serveur obligatoire

## 🧪 Tests de sécurité

### **Tests à effectuer**

```typescript
// Test des permissions
describe('Permissions System', () => {
  it('should deny access to non-admin users', async () => {
    const { hasPermission } = await AuthService.checkPermission('manage_users')
    expect(hasPermission).toBe(false)
  })

  it('should prevent last super admin demotion', async () => {
    await expect(
      AuthService.promoteUser(lastSuperAdminId, 'individual')
    ).rejects.toThrow('Cannot demote the last super admin')
  })
})
```

## 📊 Monitoring et logs

### **Événements de sécurité surveillés**

- Tentatives d'accès non autorisées
- Changements de rôles
- Échecs de vérification de permissions
- Activité des super admins

### **Métriques importantes**

```sql
-- Utilisateurs par rôle
SELECT role, COUNT(*) FROM public.users GROUP BY role;

-- Activité récente des admins
SELECT * FROM public.users
WHERE role IN ('admin', 'super_admin')
AND last_login_at > NOW() - INTERVAL '7 days';
```

## 🚀 Migration et mise à jour

### **Pour appliquer le nouveau système**

```bash
# 1. Appliquer les migrations
npx supabase db push

# 2. Régénérer les types
npm run supabase:generate

# 3. Redémarrer l'application
npm run dev
```

### **Vérification du fonctionnement**

1. **Test de connexion** : Aucune erreur 500
2. **Test des permissions** : UI adaptive selon le rôle
3. **Test admin** : Accès aux fonctions de gestion
4. **Test sécurité** : Tentatives d'accès non autorisées bloquées

Ce système de permissions est **production-ready** et **évolutif** ! 🔐✨