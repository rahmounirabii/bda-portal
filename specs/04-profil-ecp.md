# BDA Portal - Profil ECP (Endorsed Certification Partner)

## Définition
Partenaires officiellement autorisés à délivrer les certifications professionnelles BDA (CP™ et SCP™) avec droits de licence exclusifs par pays/région.

## Objectifs Clés
- Enregistrer et gérer les candidats à la certification
- Lier les candidats aux achats de vouchers d'examen
- Documenter les formations délivrées
- Gérer les formateurs certifiés
- Suivre les taux de succès
- Synchroniser les données publiques vers le site web

## Dashboard Principal
### KPIs Essentiels
- Candidats actifs
- Formations délivrées
- Taux de réussite
- Vouchers utilisés
- Alertes (renouvellement licence, échéances reporting)

## Modules Fonctionnels

### 👨‍🎓 Candidate Management
- **Ajout candidats** : Manuel ou import en lot
- **Profils complets** : Nom, email, programme, statut voucher, résultat examen
- **Workflow statut** :
  ```
  Registered → Voucher Activated → Exam Scheduled → Passed/Failed
  ```
- Auto-liaison avec portail personnel de chaque candidat

### 🎫 Exam Voucher Requests
- Commande de vouchers via API ou requête manuelle
- **Workflow** : Facture WooCommerce → Paiement → Génération automatique
- Attribution vouchers aux candidats dans le portail
- **Validité** : 1 an à partir de l'activation

### 📋 Training Deliveries
- Enregistrement des cohortes de formation CP/SCP
- **Détails requis** :
  - Titre, dates, durée
  - Mode (Présentiel/Online)
  - Langue
  - Formateur certifié assigné
  - Nombre de participants
- Upload photos, feedback, évaluations

### 👨‍🏫 Certified Trainers
- **Prérequis formateur** :
  - Certification SCP passée
  - Candidature via formulaire officiel
  - Approbation BDA Admin
- Association exclusive aux programmes du partenaire

### 📊 Performance Reports
- **Filtres** : Programme (CP/SCP), période, formateur, localisation
- **Exports** : PDF/Excel avec taux de succès, heures formation, suivi candidats

### 📄 License & Agreement
- Téléchargement licence signée
- Dates d'expiration et renouvellement
- Options d'extension de scope

### 🎨 Promotional Toolkit
- Logos officiels BDA & ECP
- Guidelines d'usage (certificats, web, banners)
- Templates réseaux sociaux bilingues

## Intégrations

### 🛒 Store Integration
- Achat vouchers via BDA Store
- Webhook activation après paiement
- Vérification email obligatoire
- Certificats automatiques après réussite examen

### 🌐 Website Sync
- Listing partenaire automatique sur `/authorized-certification-partners`
- **Données synchro** : Logo, pays, site web, langues, programmes certifiés

## Workflow Certification Complet
```
1. Partenaire enregistre candidat
2. Achat voucher + curriculum
3. Formation dispensée (CP ou SCP)
4. Examen passé dans BDA Portal
5. Résultat immédiat
6. Certificat délivré sous 2 semaines
7. Validité : 3 ans
```

## Gestion des Rôles
- **Main Admin** : Accès complet
- **Coordinator** : Ajout candidats, gestion vouchers
- **Trainer View** : Consultation formations uniquement
- Contrôle d'accès depuis Super Admin BDA

## Compliance & Reminders
- Rappels automatiques :
  - Rapports d'activité annuels
  - Expiration licence
  - Données manquantes candidats
  - Approbations formateurs en attente