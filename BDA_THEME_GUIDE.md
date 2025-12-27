# BDA Portal - Corporate Theme Guide

## 📋 Vue d'ensemble

Ce guide documente le thème corporate BDA appliqué à l'ensemble du portail. Le design est basé sur les couleurs du logo BDA pour assurer une cohérence visuelle professionnelle.

---

## 🎨 Palette de Couleurs

### Couleurs Principales (du logo BDA)

| Couleur | Hex Code | Usage | Lettre Logo |
|---------|----------|-------|-------------|
| **Sky Blue** | `#1E9BF5` | Accents, boutons secondaires | B |
| **Royal Blue** | `#2C5282` | Couleur primaire, boutons principaux | D |
| **Navy** | `#1E3A5F` | Arrière-plans sombres, footer | A |

### Dégradés BDA

```css
/* Gradient principal (utilisé dans les headers) */
from-sky-500 via-royal-600 to-navy-800

/* Autres variantes */
from-sky-500 to-royal-600    /* Sky vers Royal */
from-royal-600 to-navy-800   /* Royal vers Navy */
```

---

## 🗂️ Fichiers de Configuration

### 1. Configuration Tailwind (`tailwind.config.ts`)

Contient les définitions de couleurs étendues :
- `primary`: Royal Blue (#2C5282)
- `secondary`: Sky Blue (#1E9BF5)
- `navy`: Navy (#1E3A5F)
- `sky`: Sky Blue (alias)
- `royal`: Royal Blue (alias)

### 2. Variables CSS (`client/global.css`)

Variables HSL pour compatibilité avec le système de design :
```css
--bda-sky: 199 95% 54%;
--bda-royal: 209 50% 33%;
--bda-navy: 210 52% 25%;
```

### 3. Configuration Thème (`client/src/config/theme.config.ts`)

Helpers et utilitaires pour utiliser le thème BDA :
- `getBdaGradient()`: Retourne les classes de gradient
- `getBdaButtonClass()`: Retourne les classes pour les boutons

---

## 🎯 Applications du Thème

### Pages Individuelles

| Page | Gradient Header | Accents |
|------|----------------|---------|
| Dashboard | ✅ Sky→Royal→Navy | Royal Blue |
| Resources | ✅ Sky→Royal→Navy | Royal Blue |
| My Certifications | ✅ Sky→Royal→Navy | Royal Blue |
| PDCs | ✅ Sky→Royal→Navy | Green (conservé) |
| Exam Applications | ✅ Sky→Royal→Navy | Royal Blue |
| Mock Exams | ✅ Sky→Royal→Navy | Sky Blue |
| My Books | ✅ Sky→Royal→Navy | Navy |

### Pages Admin

| Page | Gradient Header | Spinners |
|------|----------------|----------|
| Dashboard | ✅ Sky→Royal→Navy | Royal Blue |
| Content Management | ✅ Sky→Royal→Navy | Royal Blue |
| User Management | ✅ Sky→Royal→Navy | Royal Blue |
| Exam Management | ✅ Sky→Royal→Navy | Royal Blue |
| Vouchers | ✅ Sky→Royal→Navy | Royal Blue |
| PDC Validation | ✅ Sky→Royal→Navy | Royal Blue |
| All Admin Pages | ✅ Unified | Royal Blue |

### Composants UI

#### Sidebar/Navigation
- **Logo**: Gradient BDA avec badge de rôle
- **Navigation active**: Gradient Sky→Royal
- **Hover states**: Sky-50 background + Royal-700 text

#### Buttons
- **Primary**: `bg-royal-600 hover:bg-royal-700`
- **Secondary**: `bg-sky-500 hover:bg-sky-600`
- **Accent**: `bg-navy-800 hover:bg-navy-900`

#### Cards & Metrics
- **Certifications**: Royal Blue
- **Mock Exams**: Sky Blue
- **Books**: Navy
- **PDCs**: Green (conservé pour différenciation)

---

## 📐 Utilisation

### Dans les composants React

```tsx
// Gradient header
<div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
  <h1>Page Title</h1>
</div>

// Button primaire
<Button className="bg-royal-600 hover:bg-royal-700">
  Action
</Button>

// Button secondaire
<Button className="bg-sky-500 hover:bg-sky-600">
  Secondary Action
</Button>

// Spinner/Loader
<Loader2 className="h-8 w-8 animate-spin text-royal-600" />

// Badge/Badge
<Badge className="bg-sky-100 text-sky-700">New</Badge>
```

### Avec les helpers

```tsx
import { getBdaGradient, getBdaButtonClass } from '@/config/theme.config';

// Utiliser un gradient
<div className={getBdaGradient('primary')}>...</div>

// Utiliser un bouton stylisé
<button className={getBdaButtonClass('royal')}>Click me</button>
```

---

## ✅ Checklist d'implémentation

- [x] Analyse des couleurs du logo BDA
- [x] Configuration Tailwind avec couleurs BDA
- [x] Variables CSS globales
- [x] Fichier de configuration thème
- [x] Mise à jour de toutes les pages individuelles
- [x] Mise à jour de toutes les pages admin
- [x] Mise à jour du PortalLayout (sidebar + header)
- [x] Uniformisation des gradients
- [x] Uniformisation des spinners/loaders
- [x] Uniformisation des boutons

---

## 🔄 Maintenance

### Ajouter une nouvelle page

Lors de l'ajout d'une nouvelle page, utilisez ce template :

```tsx
export default function NewPage() {
  return (
    <div className="space-y-6">
      {/* Header avec gradient BDA */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold">Page Title</h1>
        <p className="mt-2 opacity-90">Description</p>
      </div>

      {/* Contenu */}
      <Card>
        <CardContent>
          {/* Votre contenu ici */}
        </CardContent>
      </Card>
    </div>
  );
}
```

### Modifier les couleurs

Si les couleurs BDA changent à l'avenir, mettez à jour uniquement :
1. `tailwind.config.ts` (lignes 22-95)
2. `client/global.css` (lignes 15-18)
3. `client/src/config/theme.config.ts` (lignes 8-31)

Toutes les pages utiliseront automatiquement les nouvelles couleurs grâce aux classes Tailwind.

---

## 📝 Notes

- **Conservé le vert** pour les PDC Credits afin de différencier visuellement
- **Conservé le rouge** pour les états d'erreur/danger
- **Logo BDA**: Utilise un gradient text sur fond blanc dans le sidebar
- **Cohérence**: Tous les headers de pages utilisent le même gradient
- **Accessibilité**: Ratio de contraste respecté (texte blanc sur gradients foncés)

---

**Dernière mise à jour**: 2025-10-02
**Version du thème**: 1.0.0
