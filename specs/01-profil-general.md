# BDA Portal - Profil Général

## Vue d'ensemble
Plateforme digitale centralisée pour la Business Development Association (BDA), intégrant la gestion des certifications, développement professionnel et partenariats.

## Architecture
- **Frontend**: React + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI
- **Backend**: Express.js minimal + WordPress JWT
- **Intégrations**: WooCommerce (store) + WordPress (site principal)

## Fonctionnalités Core
- **SSO unifié** : Un seul login pour store/site/portail
- **Gestion des certifications** : CP™ et SCP™ avec validité 3 ans
- **PDCs** : 60 crédits requis sur 3 ans pour renouvellement
- **Support bilingue** : Anglais/Arabe avec RTL
- **Vérification des credentials** : Système sécurisé interne

## Types d'utilisateurs
1. **Professionnels individuels** - Certification et développement
2. **Partenaires ECP** - Formation et examens officiels
3. **Partenaires PDP** - Programmes de développement professionnel
4. **Administrateurs BDA** - Gestion globale du système

## Workflow Principal
```
Achat voucher → Formation → Examen → Certification → PDCs → Renouvellement
```

## Sécurité
- JWT tokens avec expiration automatique
- Validation côté serveur
- Logs d'audit complets
- Accès basé sur les rôles

## ID Format des Certifications
```
BDA-[Type]-[CountryCode]-[Year]-[SerialNumber]
Exemple: BDA-CP-EG-2025-0147
```