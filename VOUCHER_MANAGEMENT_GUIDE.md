# 📘 Guide de Gestion des Vouchers - BDA Portal

## 📋 Table des Matières
1. [Vue d'ensemble](#vue-densemble)
2. [Vouchers Page](#vouchers-page)
3. [Customers & Vouchers Page](#customers--vouchers-page)
4. [Différences Clés](#différences-clés)
5. [Cas d'Usage](#cas-dusage)
6. [Workflow Recommandé](#workflow-recommandé)

---

## 🎯 Vue d'ensemble

Le système BDA Portal gère deux types de création de vouchers d'examen :
- **Automatique** : Basé sur les achats WooCommerce
- **Manuel** : Créé directement par les administrateurs

Deux pages permettent de gérer ces vouchers, chacune avec un objectif distinct.

---

## 📄 Vouchers Page
**URL** : `https://portal.bda-global.org/admin/vouchers`

### Objectif Principal
Gestion globale de **TOUS** les vouchers existants dans le système, quelle que soit leur origine (automatique ou manuelle).

### Fonctionnalités

#### 1. **Vue d'ensemble complète**
- Liste de tous les vouchers créés (WooCommerce + Manuels)
- Affichage du statut de chaque voucher :
  - 🟢 **Unused** : Non utilisé, valide
  - 🔵 **Used** : Utilisé pour passer un examen
  - ⚫ **Expired** : Expiré (date dépassée)
  - 🔴 **Revoked** : Révoqué manuellement par admin

#### 2. **Statistiques Globales**
```
┌─────────────────────────────────────────────────────┐
│ Total Vouchers | Unused | Used | Expired | Revoked │
│      245       |   89   |  120 |   28    |    8    │
└─────────────────────────────────────────────────────┘
```

#### 3. **Filtres Avancés**
- **Par statut** : Unused, Used, Expired, Revoked
- **Par type** : CP™ ou SCP™
- **Par recherche** : Code voucher, notes admin

#### 4. **Création Manuelle de Vouchers**
**Cas d'usage** :
- Client VIP qui a besoin d'un voucher immédiat
- Promotion spéciale / Partenariat
- Remplacement d'un voucher problématique
- Test / Formation interne

**Formulaire de création** :
```
┌────────────────────────────────────────┐
│ Create Exam Voucher                   │
├────────────────────────────────────────┤
│ • User Email *        : user@email.com │
│ • Certification Type * : CP™ / SCP™    │
│ • Linked Quiz         : [Optional]     │
│ • Validity (Months) * : 6 mois         │
│ • Admin Notes         : [Optional]     │
└────────────────────────────────────────┘
```

#### 5. **Actions Disponibles**
- **Revoke** : Révoquer un voucher unused (devient inutilisable)
- **Expire Old Vouchers** : Marquer automatiquement tous les vouchers expirés comme "expired"

#### 6. **Informations Détaillées par Voucher**
```
┌─────────────────────────────────────────────────┐
│ VOUCHER-CP-A1B2C3D4                             │
│ [Unused] [CP™]                                  │
├─────────────────────────────────────────────────┤
│ User       : john.doe@example.com               │
│ Quiz       : CP Final Exam 2024                 │
│ Expires    : Jan 15, 2025                       │
│ Created    : Jul 15, 2024                       │
│ Admin Notes: Special promotion for partner XYZ  │
└─────────────────────────────────────────────────┘
```

---

## 👥 Customers & Vouchers Page
**URL** : `https://portal.bda-global.org/admin/customers-vouchers`

### Objectif Principal
Gestion de la **génération automatique** des vouchers pour les clients ayant acheté des produits de certification sur WooCommerce.

### Fonctionnalités

#### 1. **Synchronisation WooCommerce**
- Récupère automatiquement toutes les commandes WooCommerce "completed"
- Identifie les produits de certification (CP™, SCP™)
- Calcule le nombre de vouchers attendus par client

#### 2. **Calcul Intelligent**
Pour chaque client :
```
Expected Vouchers = Σ (Quantité × Vouchers par produit)

Exemple:
Commande #12345:
- 2× "CP Exam Bundle" (3 vouchers/produit) = 6 vouchers
- 1× "SCP Practice Exam" (1 voucher/produit) = 1 voucher
Total attendu = 7 vouchers
```

#### 3. **Statuts des Clients**
- 🟢 **Complete** : Tous les vouchers générés (Generated = Expected)
- 🟡 **Pending** : Quelques vouchers générés mais pas tous (0 < Generated < Expected)
- 🔴 **Missing** : Aucun voucher généré (Generated = 0)

#### 4. **Statistiques par Client**
```
┌─────────────────────────────────────────────────┐
│ Total Customers | Complete | Pending | Missing  │
│      156        |    142   |    8    |    6     │
└─────────────────────────────────────────────────┘
```

#### 5. **Vue Détaillée par Client**
```
┌──────────────────────────────────────────────────┐
│ John Doe                                         │
│ ✉ john.doe@example.com                          │
│ [Pending] [2 orders]                  7/10 ⚠️   │
├──────────────────────────────────────────────────┤
│ Order #12345 - Jan 5, 2025       [6/6 vouchers] │
│  • 2× CP Exam Bundle (6 vouchers)                │
│                                                   │
│ Order #12789 - Feb 10, 2025      [1/4 vouchers] │
│  • 1× SCP Practice Exam (1 voucher)              │
│  • 1× CP Retake Voucher (3 vouchers)             │
│                                                   │
│ [Generate Missing Vouchers (3)]                  │
└──────────────────────────────────────────────────┘
```

#### 6. **Génération Automatique**
Bouton **"Generate Missing Vouchers"** :
1. Vérifie que le client a un compte BDA Portal
2. Calcule les vouchers manquants par commande
3. Génère uniquement les vouchers manquants
4. Applique automatiquement :
   - Type de certification du produit
   - Quiz lié (si configuré)
   - Validité (mois configurés dans le produit)
   - Lien vers la commande WooCommerce
   - Notes admin automatiques

#### 7. **Protection et Validation**
- ⚠️ **Compte requis** : Le client DOIT avoir un compte BDA Portal
- Si pas de compte, affiche un message d'erreur avec instructions
- Ne génère jamais de doublons
- Respecte exactement la configuration du produit WooCommerce

---

## 🔄 Différences Clés

| Aspect                    | **Vouchers Page**                           | **Customers & Vouchers Page**                |
|---------------------------|---------------------------------------------|---------------------------------------------|
| **Objectif**              | Gérer tous les vouchers existants           | Générer les vouchers manquants des achats   |
| **Origine des données**   | Base de données vouchers directement        | WooCommerce Orders + Certification Products |
| **Actions principales**   | View, Filter, Create Manual, Revoke         | Generate Missing, Monitor Fulfillment       |
| **Vue**                   | Liste de vouchers (vue voucher-centric)     | Liste de clients (vue customer-centric)     |
| **Création**              | Manuelle, formulaire complet                | Automatique, basée sur commandes            |
| **Cas d'usage**           | Gestion opérationnelle quotidienne          | Réconciliation WooCommerce ↔ Portal         |
| **Filtres**               | Statut, Type, Code, Notes                   | Statut de complétion (Complete/Pending)     |
| **Scope**                 | Tous les vouchers (auto + manuels)         | Uniquement vouchers liés à WooCommerce      |

---

## 💼 Cas d'Usage

### Scénario 1 : Client achète un produit CP™
**Workflow** :
1. Client achète "CP Exam Bundle" sur WooCommerce (3 vouchers)
2. Commande passe en statut "Completed"
3. **Customers & Vouchers** détecte la commande
4. Admin clique sur "Generate Missing Vouchers (3)"
5. 3 vouchers CP™ sont créés automatiquement
6. Client reçoit les codes par email
7. **Vouchers Page** affiche maintenant ces 3 vouchers dans la liste

### Scénario 2 : Promotion VIP
**Workflow** :
1. Partenaire demande 5 vouchers SCP™ gratuits
2. Admin va sur **Vouchers Page**
3. Clique "Create Voucher" × 5 fois
4. Remplit le formulaire avec email partenaire
5. Ajoute note : "Partnership agreement Q1 2025"
6. Vouchers créés, visibles dans **Vouchers Page**
7. Ces vouchers N'apparaissent PAS dans **Customers & Vouchers** (pas liés à WooCommerce)

### Scénario 3 : Voucher problématique
**Workflow** :
1. Client signale qu'un voucher ne fonctionne pas
2. Admin va sur **Vouchers Page**
3. Recherche le code du voucher
4. Clique "Revoke" pour l'invalider
5. Crée un nouveau voucher manuel en remplacement
6. Envoie le nouveau code au client

### Scénario 4 : Audit mensuel
**Workflow** :
1. Admin va sur **Customers & Vouchers**
2. Filtre "Missing Vouchers"
3. Identifie 6 clients sans vouchers
4. Pour chaque client :
   - Vérifie s'ils ont un compte Portal
   - Si oui : "Generate Missing Vouchers"
   - Si non : Envoie email pour créer un compte
5. Va sur **Vouchers Page**
6. Clique "Expire Old Vouchers" pour nettoyer les vouchers périmés

---

## 🎯 Workflow Recommandé

### Utilisation quotidienne

#### Matin (Réconciliation)
```
1. Ouvrir "Customers & Vouchers"
2. Cliquer "Refresh Data"
3. Vérifier les nouvelles commandes
4. Générer les vouchers manquants
```

#### Jour (Gestion)
```
1. Utiliser "Vouchers Page" pour :
   - Rechercher des vouchers spécifiques
   - Révoquer des vouchers problématiques
   - Créer des vouchers manuels (promotions, VIP)
```

#### Fin de mois (Nettoyage)
```
1. "Vouchers Page" → "Expire Old Vouchers"
2. "Customers & Vouchers" → Vérifier les "Pending"
3. Résoudre les cas bloqués (comptes manquants)
```

### Répartition des tâches

| Tâche                          | Page à utiliser              |
|--------------------------------|------------------------------|
| Voir tous les vouchers         | **Vouchers**                 |
| Révoquer un voucher            | **Vouchers**                 |
| Créer voucher promo/VIP        | **Vouchers**                 |
| Nettoyer vouchers expirés      | **Vouchers**                 |
| Synchroniser WooCommerce       | **Customers & Vouchers**     |
| Générer vouchers d'achat       | **Customers & Vouchers**     |
| Vérifier complétion clients    | **Customers & Vouchers**     |
| Audit achats vs vouchers       | **Customers & Vouchers**     |

---

## 🔗 Intégration Système

### Flux de données
```
┌─────────────────┐
│  WooCommerce    │ (Commandes "Completed")
└────────┬────────┘
         │
         v
┌─────────────────────────┐
│ Certification Products  │ (Configuration: vouchers_per_purchase)
└────────┬────────────────┘
         │
         v
┌──────────────────────────┐
│ Customers & Vouchers     │ (Détection + Génération)
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐
│    exam_vouchers         │ (Table Supabase)
└────────┬─────────────────┘
         │
         v
┌──────────────────────────┐
│    Vouchers Page         │ (Affichage + Gestion)
└──────────────────────────┘
```

### Champs importants

**exam_vouchers (Supabase)**
- `code` : Code unique du voucher (ex: VOUCHER-CP-A1B2C3D4)
- `user_id` : Lien vers le compte BDA Portal
- `certification_type` : CP / SCP
- `quiz_id` : Quiz lié (optionnel)
- `status` : unused / used / expired / revoked
- `expires_at` : Date d'expiration
- `woocommerce_order_id` : Lien vers commande (NULL si manuel)
- `certification_product_id` : Lien vers produit (NULL si manuel)
- `admin_notes` : Notes admin

---

## ⚠️ Points d'Attention

### Customers & Vouchers
1. **Compte Portal obligatoire** : Le client DOIT avoir créé un compte avant génération
2. **Synchronisation** : Cliquer "Refresh Data" pour voir les nouvelles commandes
3. **Pas de doublons** : Le système empêche la création de doublons
4. **Configuration produit** : Respecte `vouchers_per_purchase` du produit WooCommerce

### Vouchers Page
1. **Révocation irréversible** : Un voucher révoqué ne peut pas être réactivé
2. **Création manuelle** : Vérifier l'email du client avant création
3. **Expiration** : Les vouchers expirés peuvent encore être révoqués
4. **Notes admin** : Toujours documenter les vouchers manuels

---

## 📊 Métriques de Performance

### KPIs à surveiller
- **Taux de complétion** : % clients avec tous leurs vouchers
- **Vouchers non utilisés** : Identifier les clients qui n'utilisent pas leurs vouchers
- **Délai de génération** : Temps entre achat et génération du voucher
- **Taux d'expiration** : % vouchers expirés sans utilisation

### Alertes
- 🔴 Clients "Missing" depuis >7 jours
- 🟡 Clients "Pending" depuis >3 jours
- 🟠 Vouchers expirant dans 30 jours
- ⚫ Vouchers non utilisés depuis 90 jours

---

## 🚀 Bonnes Pratiques

1. **Quotidien** : Vérifier "Customers & Vouchers" chaque matin
2. **Documentation** : Toujours ajouter des notes admin pour vouchers manuels
3. **Communication** : Informer les clients de leurs vouchers générés
4. **Nettoyage** : Expirer les vieux vouchers chaque mois
5. **Audit** : Réconcilier WooCommerce vs Portal chaque semaine
6. **Support** : Utiliser "Vouchers Page" pour résoudre les tickets clients

---

## 📞 Support

Pour toute question sur le système de vouchers :
- **Documentation technique** : `/docs/voucher-system.md`
- **Configuration produits** : WooCommerce → Certification Products
- **Issues** : GitHub Issues du projet BDA Portal
