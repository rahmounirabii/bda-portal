# Test Guide - Existing Store Account Modal

## 🎯 Implemented Feature

A professional modal to handle cases where a user tries to sign up with an email that already exists in the WordPress Store.

## 🔧 Composants Créés

1. **ExistingAccountModal** (`/client/components/ui/existing-account-modal.tsx`)
   - Modal responsive et professionnel
   - Interface pour saisir le mot de passe Store
   - Lien vers la page de connexion
   - Gestion des erreurs et états de chargement

2. **Intégration dans Signup** (`/client/pages/Signup.tsx`)
   - Détection automatique des comptes Store existants
   - Ouverture automatique du modal
   - Liaison transparente des comptes après vérification

## 🧪 Test Manual

### Compte de Test Créé
- **Email**: `modal.test@example.com`
- **Mot de passe**: `testpassword123`
- **Prénom**: Modal
- **Nom**: Test

### Étapes de Test

1. **Aller sur la page d'inscription**: http://localhost:8082/signup

2. **Saisir les informations** :
   - Email: `modal.test@example.com`
   - Mot de passe: `newpassword123` (différent de celui du Store)
   - Prénom: `John`
   - Nom: `Doe`
   - Type d'utilisateur: `Individual`

3. **Cliquer sur "Créer le compte"**

4. **Vérifier que le modal s'ouvre** avec :
   - ⚠️ Icône d'alerte amber
   - Message expliquant qu'un compte Store existe
   - Champ pour saisir le mot de passe Store
   - Bouton "Continuer"
   - Section avec lien vers la page de connexion

5. **Tester les scénarios** :

   **Scenario A - Mot de passe correct** :
   - Saisir: `testpassword123`
   - Cliquer "Continuer"
   - Vérifier que les comptes sont liés et redirection vers login

   **Scenario B - Mot de passe incorrect** :
   - Saisir: `wrongpassword`
   - Cliquer "Continuer"
   - Vérifier l'affichage de l'erreur en rouge

   **Scenario C - Navigation vers login** :
   - Cliquer "Aller à la connexion"
   - Vérifier la redirection vers `/login` avec l'email pré-rempli

## 🎨 Design & UX

### Couleurs & Icônes
- **Alerte**: Amber (⚠️ AlertCircle)
- **Mot de passe**: Icône clé (🗝️ Key)
- **Navigation**: Icône login (🔑 LogIn)
- **Action**: Icône flèche (➡️ ArrowRight)

### États
- **Loading**: Spinner avec texte "Vérification..."
- **Erreur**: Background rouge avec bordure
- **Success**: Toast vert + redirection

### Responsive
- Modal adaptatif (`sm:max-w-md`)
- Layout flexible
- Boutons responsive

## 🔄 Flux Technique

1. **Détection**: Service `UnifiedSignupService` détecte compte Store existant
2. **Signal**: Retourne action `requires_store_password`
3. **Modal**: Composant Signup ouvre `ExistingAccountModal`
4. **Vérification**: API WordPress vérifie credentials
5. **Liaison**: Service unifié lie les comptes
6. **Redirection**: Vers login avec message de succès

## ✅ Checklist de Test

- [ ] Modal s'ouvre automatiquement
- [ ] Interface responsive et professionnelle
- [ ] Vérification mot de passe correct ✅
- [ ] Gestion erreur mot de passe incorrect ❌
- [ ] Navigation vers login 🔗
- [ ] Liaison de comptes réussie 🔗
- [ ] Messages d'état appropriés 💬
- [ ] Redirection après succès ➡️

## 🎯 Résultat Attendu

L'utilisateur peut facilement gérer le cas où son email existe déjà dans le Store, avec une expérience fluide et professionnelle, sans frustration ni confusion.