# WordPress Integration Guide

## 🔄 Portal-Store Transparent Authentication

Cette intégration permet une expérience utilisateur **totalement transparente** entre le Portal BDA (Supabase) et le Store WordPress (WooCommerce).

## 🚀 Setup Rapide

### 1. **Configuration Portal**

```bash
# Générer les clés API et configurer l'environnement
npm run wordpress:setup

# Tester la connexion
npm run wordpress:test
```

### 2. **Configuration WordPress**

1. **Activer l'API BDA Portal** dans WordPress Admin
2. **Copier les clés** générées dans Settings > BDA Portal
3. **Configurer les URLs** :
   - Portal Base URL: `http://localhost:8082`
   - Portal Webhook URL: `http://localhost:8082/api/webhooks/wordpress`

### 3. **Variables d'Environnement**

```env
# WordPress BDA Portal API
VITE_WORDPRESS_API_URL=http://localhost/wp-json/bda-portal/v1
VITE_WORDPRESS_API_KEY=your-generated-key
VITE_WORDPRESS_ADMIN_KEY=your-admin-key
VITE_WORDPRESS_WEBHOOK_KEY=your-webhook-key

# Portal Configuration
VITE_PORTAL_BASE_URL=http://localhost:8082
VITE_ENABLE_STORE_SYNC=true
```

## 🎯 Expérience Utilisateur

### **Scenario A: User Store → Portal**
```
1. User a compte WordPress/WooCommerce
2. Se connecte sur Portal avec identifiants store
3. ✨ Compte Supabase créé automatiquement
4. Login portal réussi - User ne voit rien !
```

### **Scenario B: User Portal → Store**
```
1. User signup portal comme "individual"
2. ✨ Compte WordPress créé automatiquement
3. Access store immédiat avec mêmes identifiants
4. Expérience unifiée parfaite !
```

### **Scenario C: Nouveau User**
```
1. User va sur Portal signup
2. Choisit: Portal-only | Store-only | Both
3. ✨ Comptes créés dans systèmes appropriés
4. Navigation seamless Portal ↔ Store
```

## 🔧 Architecture Technique

### **Services**
- `UnifiedAuthService` - Gestion auth transparente
- `WordPressAPIService` - Communication avec WP
- `useUnifiedAuth` - Hook React unifié

### **Endpoints WordPress** (`/wp-json/bda-portal/v1/`)
- `POST /auth/verify` - Vérifier credentials WP
- `POST /auth/create-portal-user` - Créer user portal
- `POST /users/create-store-user` - Créer user WP
- `POST /users/sync-profile` - Sync profils
- `POST /webhooks/user-updated` - Webhooks sync

### **Sécurité**
- **3 niveaux** de clés API (API, Admin, Webhook)
- **Validation complète** des inputs
- **Rate limiting** protection
- **CORS** headers appropriés

## 📝 Code Examples

### **Login Transparent**
```typescript
// User ne sait pas qu'il y a 2 systèmes !
const { login } = useUnifiedAuth();

await login(email, password);
// → Vérifie WP, crée Supabase si besoin, login réussi
```

### **Signup Flexible**
```typescript
await signup({
  email, password,
  first_name, last_name,
  bda_role: 'individual',
  signup_type: 'both' // portal-only | store-only | both
});
// → Créé comptes dans systèmes appropriés
```

### **Sync Automatique**
```typescript
// Toute modification sync automatiquement
updateProfile({ first_name: 'John' });
// → Update Supabase + WordPress en parallèle
```

## 🔍 Debugging

### **Logs Portal**
```bash
# Voir les actions d'auth
console.log('Login Action:', result.action_taken);
// → 'login' | 'created_portal' | 'created_store' | 'linked_accounts'
```

### **Logs WordPress**
```php
// Voir les événements sync dans WP Admin
// Settings > BDA Portal > Logs
```

### **Test API**
```bash
# Tester endpoint WordPress
curl -X GET "http://localhost/wp-json/bda-portal/v1/webhooks/test" \
  -H "X-BDA-Webhook-Key: your-key"
```

## 🔄 Sync Status

### **États de Synchronisation**
- `synced` - Tout à jour
- `pending` - Sync en cours
- `failed` - Nécessite intervention

### **Gestion des Erreurs**
- **Rollback automatique** si échec partiel
- **Retry intelligent** avec backoff
- **Messages unifiés** pour l'utilisateur

## 🚀 Next Steps

1. **Tester les flows** : Login/Signup dans tous les cas
2. **Vérifier sync** : Modifications profil Portal → Store
3. **Monitoring** : Surveiller logs et métriques
4. **Production** : Configurer URLs et clés prod

## 📞 Support

- **Logs Portal** : Console browser + Network tab
- **Logs WordPress** : WP Admin > BDA Portal Settings
- **API Test** : `npm run wordpress:test`
- **Debug Mode** : `VITE_ENABLE_LOGGING=true`

---

🎉 **L'intégration Portal-Store est maintenant transparente !**

User ne sait jamais qu'il utilise 2 systèmes différents.