# BDA Portal API - Refactored Structure

## 📁 Structure

```
inc/api/
├── api-init.php              # Main entry point - loads all components
├── config/
│   └── cors.php              # CORS configuration
├── controllers/
│   ├── AuthController.php    # Authentication endpoints
│   ├── UsersController.php   # User management endpoints
│   └── WooCommerceController.php # WooCommerce integration endpoints
└── routes/
    └── routes.php            # API route registration
```

## 🎯 Objectif

Refactoriser l'API BDA Portal pour :
- ✅ Séparation des responsabilités (config, controllers, routes)
- ✅ Code maintenable et testable
- ✅ Structure MVC-like pour l'API REST
- ✅ Faciliter l'ajout de nouveaux endpoints
- ✅ `functions.php` ne contient que des includes

## 📋 Utilisation

### functions.php (simplifié)
```php
<?php
require_once dirname(__FILE__) . '/lib/init.php';
require_once dirname(__FILE__) . '/inc/api/api-init.php';
```

### api-init.php (chargeur principal)
```php
<?php
// Load configuration
require_once BDA_API_DIR . '/config/cors.php';

// Load controllers
require_once BDA_API_DIR . '/controllers/AuthController.php';
require_once BDA_API_DIR . '/controllers/UsersController.php';
require_once BDA_API_DIR . '/controllers/WooCommerceController.php';

// Load routes
require_once BDA_API_DIR . '/routes/routes.php';
```

## 🔌 Endpoints Disponibles

### Test
- `GET /bda-portal/v1/test` - Test de connectivité API

### Authentication
- `POST /bda-portal/v1/auth/verify` - Vérifier les credentials

### Users
- `GET /bda-portal/v1/users/check-user` - Vérifier l'existence d'un utilisateur
- `POST /bda-portal/v1/users/create` - Créer un nouvel utilisateur

### WooCommerce Products
- `GET /bda-portal/v1/woocommerce/products` - Liste des produits

### WooCommerce Orders
- `GET /bda-portal/v1/woocommerce/orders` - Liste des commandes
- `GET /bda-portal/v1/woocommerce/orders/{id}` - Détails d'une commande
- `POST /bda-portal/v1/woocommerce/orders/{id}/mark-vouchers-generated` - Marquer les vouchers comme générés

### WooCommerce Books
- `GET /bda-portal/v1/woocommerce/user-books` - Livres achetés par un utilisateur
- `POST /bda-portal/v1/woocommerce/book-download` - Obtenir l'URL de téléchargement

## ➕ Ajouter un Nouveau Endpoint

### 1. Créer le Controller
```php
// inc/api/controllers/MyController.php
<?php
class BDA_My_Controller {
    public static function my_method(WP_REST_Request $request) {
        return new WP_REST_Response(array(
            'success' => true,
            'data' => 'Hello World'
        ), 200);
    }
}
```

### 2. Enregistrer la Route
```php
// inc/api/routes/routes.php
register_rest_route($namespace, '/my-endpoint', array(
    'methods' => 'GET',
    'callback' => array('BDA_My_Controller', 'my_method'),
    'permission_callback' => '__return_true'
));
```

### 3. Charger le Controller
```php
// inc/api/api-init.php
require_once BDA_API_DIR . '/controllers/MyController.php';
```

## 🔒 Sécurité

- CORS configuré pour `http://localhost:8082`
- Authentification WooCommerce pour certains endpoints
- Sanitization des entrées utilisateur
- Permission callbacks sur chaque route

## 📝 Notes

- Aucune logique métier modifiée - seulement refactorisation
- Toutes les fonctionnalités existantes préservées
- Compatible avec l'ancien code si nécessaire
- Structure extensible pour futurs endpoints

## 🧪 Tests

```bash
# Test endpoint
curl http://localhost:8080/wp-json/bda-portal/v1/test

# Auth verify
curl -X POST http://localhost:8080/wp-json/bda-portal/v1/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## 🔄 Migration depuis l'ancien functions.php

Avant (588 lignes dans functions.php) :
```php
// Tout le code API dans functions.php
add_action('rest_api_init', function() {
    // 500+ lignes de code...
});
```

Après (27 lignes dans functions.php) :
```php
require_once dirname(__FILE__) . '/lib/init.php';
require_once dirname(__FILE__) . '/inc/api/api-init.php';
```

**Réduction** : 561 lignes → Structure modulaire

---

**Version**: 1.0.0
**Date**: 2025-10-02
**Auteur**: BDA Development Team
