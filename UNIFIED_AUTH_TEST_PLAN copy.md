# 🧪 Cas de Test - Authentification Unifiée BDA Portal

## 🎯 Objectif
L'utilisateur doit percevoir UN SEUL système d'authentification, transparent.

---

## 📝 Cas de Test à Valider

### **SIGNUP - Nouveaux Utilisateurs**

**Cas 1:** Utilisateur complètement nouveau fait signup
→ Doit créer compte Portal + Store automatiquement, user connecté immédiatement

**Cas 2:** Utilisateur existe SEULEMENT dans Store, fait signup Portal
→ Modal demande mot de passe Store, puis création Portal + liaison transparente

**Cas 3:** Utilisateur existe SEULEMENT dans Portal, fait signup avec accès Store
→ Vérification mot de passe Portal, puis création Store + liaison transparente

**Cas 4:** Utilisateur existe dans les DEUX systèmes mais pas liés
→ Vérification des deux mots de passe, puis liaison automatique

**Cas 5:** Utilisateur existe et est DÉJÀ lié
→ Message "Vous avez déjà un compte, connectez-vous" + redirection login

---

### **LOGIN - Connexions**

**Cas 6:** Login avec compte Portal seulement
→ Connexion normale au Portal

**Cas 7:** Login avec compte Store seulement
→ Création Portal automatique en arrière-plan + connexion seamless

**Cas 8:** Login avec comptes liés
→ Connexion immédiate avec accès complet Portal + Store

**Cas 9:** Login avec email inexistant
→ Message "Email ou mot de passe incorrect" (pas de distinction)

**Cas 10:** Login avec mauvais mot de passe
→ Message "Email ou mot de passe incorrect" (pas de détail système)

---

### **EXPÉRIENCE UTILISATEUR**

**Cas 11:** Navigation après connexion
→ Aller Portal, aller Store, refresh page = session maintenue partout

**Cas 12:** Logout complet
→ Déconnexion des deux systèmes + redirection login

**Cas 13:** Session qui expire
→ Refresh token auto OU logout graceful avec message

---

### **GESTION D'ERREURS**

**Cas 14:** Réseau coupé pendant signup/login
→ Message "Problème de connexion" + bouton retry + données conservées

**Cas 15:** WordPress API down
→ Fallback Portal seulement + message "Store temporairement indisponible"

**Cas 16:** Données différentes Portal vs Store (ex: nom différent)
→ Interface résolution conflit + choix utilisateur respecté

---

## ✅ Critères de Réussite

- User ne sait JAMAIS qu'il y a Portal + Store
- Tous messages en français, user-friendly
- Aucun terme technique visible
- Aucun crash sur tous les cas
- Login/signup sous 3 secondes
- Messages d'erreur clairs et utiles

## 🏁 Validation Finale

**✅ Utilisateur dit:** *"Je me connecte sur BDA Portal, c'est simple et ça marche"*

**❌ Utilisateur ne dit JAMAIS:** *"Pourquoi il me demande un autre mot de passe?" ou "C'est quoi Portal vs Store?"*