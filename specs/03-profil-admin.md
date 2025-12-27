# BDA Portal - Profil Administrateur

## Vue d'ensemble
Interface de contrôle central pour toutes les opérations de la plateforme BDA, avec gestion multi-rôles et permissions granulaires.

## Rôles Administratifs

| Rôle | Permissions |
|------|-------------|
| **Super Admin** | Contrôle total de toutes les fonctionnalités |
| **Certification Manager** | Examens, résultats, vouchers, données candidats |
| **Partnerships Admin** | Applications partenaires, statuts, licences |
| **PDC Reviewer** | Validation des soumissions PDCs |
| **Finance Admin** | Paiements, factures, transactions |
| **Content Manager** | Ressources, modules de formation |
| **Technical Support** | Tickets support, problèmes système |
| **Read-only Viewer** | Consultation pour board members/auditeurs |

## Dashboard Central
### Métriques Temps Réel
- Total utilisateurs (individuels + partenaires)
- Certifications actives (CP, SCP)
- Taux de réussite aux examens
- Partenaires actifs par type (ECP, PDP, AKP, SAP)
- PDCs enregistrés
- Applications en attente

## Modules Fonctionnels

### 👥 User Management
- Gestion complète des profils utilisateurs
- Filtrage par certification, statut voucher, heures PDC
- Réinitialisation mots de passe
- Attribution manuelle de certifications
- Fusion de comptes dupliqués

### 🤝 Partner Management
- Révision des candidatures partenaires
- Workflow : Accepter/Rejeter/Reporter
- Upload lettres de licence et kits d'accueil
- Gestion des dates d'expiration
- Liaison avec dashboards partenaires

### 🎓 Exam Management
- Attribution et validation des vouchers
- Upload des scores d'examens
- Génération de certificats
- Contrôle d'accès curriculum/examens
- Logique de ré-examen (après 3 ans ou échec)

### ✅ PDC Validation
- Révision des soumissions utilisateurs
- Validation croisée avec partenaires PDP
- Détection des entrées suspectes
- Override manuel pour cas spéciaux

### 👨‍🏫 Trainer Management
- Approbation des formateurs
- Vérification statut certification SCP
- Association avec partenaires ECP
- Métriques de performance
- Génération badges/lettres de reconnaissance

### 📚 Content & Resources
- Upload matériels d'étude (BoCK, templates)
- Gestion structure curriculum par certification
- Support multilingue
- Programmation visibilité basée sur achats

### 💰 Finance & Transactions
- Suivi paiements (vouchers, frais licence)
- Validation transactions WooCommerce
- Rapports périodiques comptabilité

### 📈 Reporting & Analytics
- Rapports filtrables : Certifications, examens, performances partenaires, PDCs, engagement régional
- Export : CSV, PDF, rapports programmés

## Intégrations

### 🛒 Store & Website
- Synchronisation statuts produits WooCommerce
- Mise à jour listes partenaires vers website
- Codes de réduction et conditions
- Posts blog/annonces directs

### 🔒 Sécurité & Logs
- Journaux d'activité par utilisateur
- Firewall basé sur les rôles
- Authentification deux facteurs
- Logs des overrides manuels

## Architecture Technique
- **API Gateway** : Store ↔ Portal ↔ Admin Panel
- **Backend** : Laravel/Node.js modulaire sécurisé
- **Encryption** : Données utilisateur chiffrées au repos
- **Backup** : Protocoles de sauvegarde quotidienne