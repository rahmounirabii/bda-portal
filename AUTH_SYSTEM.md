# BDA Portal - Système d'Authentification Supabase

## Vue d'ensemble

Le portail BDA utilise maintenant **Supabase** pour l'authentification au lieu de WordPress JWT.

## Configuration

### Variables d'environnement (.env)
```
VITE_SUPABASE_URL=https://dfsbzsxuursvqwnzruqt.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Base de données

#### Tables principales :
- `auth.users` - Utilisateurs Supabase (géré automatiquement)
- `public.users` - Profils utilisateurs avec rôles et informations
- `public.roles` - Définitions des rôles (metadata)
- `public.roles_mapping` - Mapping Supabase ↔ WordPress pour intégration future

#### Rôles disponibles :
- `individual` - Utilisateur standard
- `admin` - Administrateur
- `ecp` - Educational Content Provider
- `pdp` - Professional Development Provider
- `super_admin` - Super administrateur

## Utilisation

### Connexion de test
Email: `rahmounirabii.me@gmail.com`
Rôle: `super_admin`

### Pages importantes

- `/login` - Page de connexion
- `/dashboard` - Dashboard principal (protégé)
- `/auth-debug` - Page de debug pour tester l'auth (temporaire)

### Flux d'authentification

1. **Non connecté** → Redirection automatique vers `/login`
2. **Connexion** → Vérification Supabase + chargement du profil
3. **Navigation** → Routes protégées par `ProtectedRoute`
4. **Déconnexion** → Logout Supabase + redirection `/login`

### Architecture du code

```
client/
├── contexts/
│   └── AuthContext.tsx          # Context principal d'auth
├── lib/
│   └── supabase.ts             # Client Supabase + helpers
├── components/
│   ├── ProtectedRoute.tsx      # Protection des routes
│   └── PortalLayout.tsx        # Layout avec infos user
└── pages/
    ├── Login.tsx               # Page de connexion
    └── AuthDebug.tsx           # Debug temporaire
```

## Fonctionnalités

✅ **Connexion/Déconnexion**
✅ **Protection des routes**
✅ **Persistance de session**
✅ **Chargement du profil utilisateur**
✅ **Gestion des rôles**
✅ **Redirection automatique**
✅ **Gestion d'erreurs**

## Sécurité

- **RLS (Row Level Security)** activé sur toutes les tables
- **Politiques d'accès** basées sur les rôles
- **Session persistante** avec auto-refresh
- **Validation côté client et serveur**

## Intégration future

Le système de mapping `roles_mapping` permet de lier les rôles Supabase aux rôles WordPress pour une intégration future avec le site principal.