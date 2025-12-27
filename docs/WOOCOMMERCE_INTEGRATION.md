# WooCommerce Integration Documentation

## Overview

The BDA Portal integrates with WooCommerce to enable seamless certification exam voucher generation based on store purchases. This integration allows admins to:

1. Sync WooCommerce products and link them to certification exams
2. View orders containing certification products
3. Automatically generate exam vouchers for customers who purchased certification products

## Architecture

### Components

```
WordPress Backend (WooCommerce)
    ↓
WordPress REST API Endpoints
    ↓
React Frontend (Client)
    ↓
Admin Pages → Service Layer → React Query Hooks
    ↓
Supabase Database (exam_vouchers, certification_products)
```

## WordPress REST API Endpoints

All endpoints are registered under the `bda-portal/v1/woocommerce` namespace.

### 1. GET Products

**Endpoint:** `GET /wp-json/bda-portal/v1/woocommerce/products`

**Description:** Fetches all WooCommerce products from the store.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 14982,
      "name": "BDA-SCP Certification - English Track",
      "sku": "BDA-SCP-EN",
      "price": "395",
      "regular_price": "395",
      "sale_price": "",
      "status": "publish",
      "type": "simple",
      "description": "Certification exam for SCP",
      "image": "https://...",
      "permalink": "https://...",
      "created_at": "2025-01-15 10:30:00"
    }
  ],
  "count": 26
}
```

### 2. GET Orders

**Endpoint:** `GET /wp-json/bda-portal/v1/woocommerce/orders`

**Query Parameters:**
- `status` (optional): Filter by order status (pending, processing, completed, etc.)
- `product_id` (optional): Filter orders containing specific product
- `customer_email` (optional): Filter by customer email
- `limit` (optional): Number of results per page
- `page` (optional): Page number

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 19307,
      "order_number": "19307",
      "status": "completed",
      "total": "395.00",
      "currency": "EUR",
      "date_created": "2025-09-18 11:06:39",
      "date_completed": "2025-09-18 11:06:39",
      "customer": {
        "email": "customer@example.com",
        "first_name": "John",
        "last_name": "Doe"
      },
      "billing": {
        "address_1": "123 Main St",
        "city": "Paris",
        "postcode": "75001",
        "country": "FR"
      },
      "items": [
        {
          "product_id": 14982,
          "product_name": "BDA-SCP Certification",
          "quantity": 2,
          "subtotal": "790.00",
          "total": "790.00"
        }
      ],
      "vouchers_generated": false
    }
  ],
  "count": 15,
  "total_pages": 2
}
```

### 3. GET Single Order

**Endpoint:** `GET /wp-json/bda-portal/v1/woocommerce/orders/{order_id}`

**Response:** Same as single order in GET Orders

### 4. POST Mark Vouchers Generated

**Endpoint:** `POST /wp-json/bda-portal/v1/woocommerce/orders/{order_id}/mark-vouchers-generated`

**Description:** Marks an order as having vouchers generated and adds order note.

**Response:**
```json
{
  "success": true,
  "message": "Order marked as vouchers generated",
  "data": {
    "order_id": 19307,
    "vouchers_generated": true,
    "vouchers_generated_at": "2025-10-01 14:30:00"
  }
}
```

## Client-Side Implementation

### File Structure

```
client/src/entities/woocommerce/
├── index.ts                    # Barrel export
├── woocommerce.types.ts        # TypeScript types
├── woocommerce.service.ts      # API service layer
└── woocommerce.hooks.ts        # React Query hooks
```

### Types

Key TypeScript interfaces:

- `WooCommerceProduct`: Product data from WooCommerce
- `WooCommerceOrder`: Order with customer and items
- `WooCommerceOrderItem`: Individual product in order
- `WooCommerceCustomer`: Customer information
- `WooCommerceOrderFilters`: Query filters for orders

### Service Layer

`WooCommerceService` provides static methods:

- `getProducts()`: Fetch all products
- `getOrders(filters?)`: Fetch orders with optional filters
- `getOrder(orderId)`: Fetch single order
- `markOrderVouchersGenerated(orderId)`: Mark order as processed
- `getCertificationOrders(productIds)`: Get orders for specific products
- `isError(response)`: Type guard for error responses

### React Query Hooks

Available hooks:

- `useWooCommerceProducts()`: Fetch all products (5min cache)
- `useWooCommerceOrders(filters?)`: Fetch orders with filters (2min cache)
- `useWooCommerceOrder(orderId, enabled?)`: Fetch single order
- `useMarkOrderVouchersGenerated()`: Mutation to mark order
- `useCertificationOrders(productIds)`: Fetch certification orders
- `usePrefetchWooCommerceProducts()`: Prefetch products utility

## Admin Pages

### 1. WooCommerce Products (`/admin/woocommerce-products`)

**Purpose:** Sync products from WooCommerce and link them to certification exams.

**Features:**
- Display all WooCommerce products in grid layout
- Product cards show image, name, SKU, price, status
- "Link to Cert" button opens dialog
- Link dialog configures:
  - Certification type (CP™/SCP™)
  - Linked quiz (optional)
  - Vouchers per purchase (default: 1)
  - Validity period in months (default: 6)
- "Refresh from Store" button to sync latest products
- External link to view product in store

**Database:** Creates record in `certification_products` table with:
```sql
{
  woocommerce_product_id: integer,
  woocommerce_product_name: text,
  woocommerce_product_sku: text,
  certification_type: 'CP' | 'SCP',
  quiz_id: uuid (nullable),
  vouchers_per_purchase: integer,
  voucher_validity_months: integer
}
```

### 2. WooCommerce Orders (`/admin/woocommerce-orders`)

**Purpose:** View orders and generate certification vouchers for customers.

**Features:**
- Filter by order status (completed, processing, pending, etc.)
- Filter by certification product
- Display only orders containing certification products
- Order cards show:
  - Order number and status
  - Customer name and email
  - Order date and completion date
  - All order items with quantities and prices
  - Total amount
  - "Vouchers Generated" badge if processed
- "Generate Vouchers" button for completed orders
- Confirmation dialog before voucher generation
- Automatic voucher creation based on product configuration

**Voucher Generation Logic:**
```typescript
For each certification product in order:
  vouchersToCreate = vouchers_per_purchase × quantity
  expiresAt = current_date + voucher_validity_months

  For i = 1 to vouchersToCreate:
    Create voucher:
      - user_id: resolved from customer email
      - certification_type: from product
      - quiz_id: from product (if linked)
      - expires_at: calculated expiration
      - woocommerce_order_id: order ID
      - certification_product_id: product ID
      - admin_notes: "Auto-generated from WooCommerce order #..."
```

## Workflow Example

### Complete Voucher Generation Flow

1. **Admin links products to certifications**
   - Navigate to `/admin/woocommerce-products`
   - Click "Refresh from Store" to sync products
   - Find certification product (e.g., "BDA-SCP Certification")
   - Click "Link to Cert"
   - Select certification type: SCP™
   - Configure: 1 voucher per purchase, 6 months validity
   - Click "Link Product"

2. **Customer purchases certification**
   - Customer visits WooCommerce store
   - Adds "BDA-SCP Certification" to cart (quantity: 2)
   - Completes purchase
   - Order #19307 created with status "completed"

3. **Admin generates vouchers**
   - Navigate to `/admin/woocommerce-orders`
   - Filter: Status = "Completed"
   - See order #19307 with 2× BDA-SCP Certification
   - Click "Generate Vouchers"
   - Confirm dialog
   - System creates 2 vouchers (1 per purchase × 2 quantity)
   - Vouchers valid for 6 months
   - Order marked with "Vouchers Generated" badge

4. **Customer uses voucher**
   - Customer logs into BDA Portal
   - Sees 2 available exam vouchers in `/exam-applications`
   - Selects exam and uses voucher
   - Takes certification exam

## Environment Configuration

Add to `.env`:
```env
VITE_WP_API_BASE_URL=http://localhost:8080/wp-json
```

For production:
```env
VITE_WP_API_BASE_URL=https://yourdomain.com/wp-json
```

## Database Schema

### certification_products

```sql
CREATE TABLE certification_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  woocommerce_product_id INTEGER NOT NULL UNIQUE,
  woocommerce_product_name TEXT NOT NULL,
  woocommerce_product_sku TEXT,
  certification_type TEXT NOT NULL CHECK (certification_type IN ('CP', 'SCP')),
  quiz_id UUID REFERENCES quizzes(id),
  vouchers_per_purchase INTEGER NOT NULL DEFAULT 1,
  voucher_validity_months INTEGER NOT NULL DEFAULT 6,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### exam_vouchers

```sql
CREATE TABLE exam_vouchers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  certification_type TEXT NOT NULL CHECK (certification_type IN ('CP', 'SCP')),
  quiz_id UUID REFERENCES quizzes(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  exam_attempt_id UUID REFERENCES exam_attempts(id),
  woocommerce_order_id INTEGER,
  certification_product_id UUID REFERENCES certification_products(id),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### WooCommerce Order Meta

Stored in `wp_postmeta` table:

- `_bda_vouchers_generated`: 'yes' | null
- `_bda_vouchers_generated_at`: timestamp

## Security & Permissions

### WordPress Endpoints

Currently using `'permission_callback' => '__return_true'` for testing.

**TODO for Production:**
```php
'permission_callback' => function() {
    return current_user_can('manage_woocommerce');
}
```

### Supabase RLS Policies

Certification products:
- Admin can read/write
- Users can read

Exam vouchers:
- Admin can read/write all
- Users can read only their own vouchers

## Known Issues & TODOs

### 1. User Lookup Endpoint

**Issue:** When generating vouchers, need to resolve customer email to Supabase user_id.

**Current:** Using placeholder `'USER_ID_PLACEHOLDER'`

**Location:** `client/pages/admin/WooCommerceOrders.tsx:132`

**Solution needed:**
```typescript
// Create endpoint or service to lookup user by email
const user = await getUserByEmail(order.customer.email);
const user_id = user?.id || throw error;
```

**Options:**
1. Create WordPress endpoint: `GET /bda-portal/v1/users/by-email?email=...`
2. Create Supabase edge function
3. Add to existing auth service

### 2. CORS Configuration

If React app and WordPress are on different domains, configure CORS in `functions.php`:

```php
add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://yourdomain.com');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
});
```

### 3. Error Handling

Add better error handling for:
- Network failures
- Invalid order states
- Duplicate voucher generation
- Expired products

### 4. Logging & Audit Trail

Add logging for:
- Voucher generation events
- Failed voucher creations
- Admin actions on orders

## Testing

### Manual Testing Checklist

#### Products Page
- [ ] Navigate to `/admin/woocommerce-products`
- [ ] Click "Refresh from Store" - verify products load
- [ ] Open "Link to Cert" dialog
- [ ] Select certification type
- [ ] Configure voucher settings
- [ ] Submit and verify success toast
- [ ] Check `certification_products` table for new record

#### Orders Page
- [ ] Navigate to `/admin/woocommerce-orders`
- [ ] Verify only orders with certification products shown
- [ ] Test status filter (completed, processing, etc.)
- [ ] Test product filter
- [ ] Click "Generate Vouchers" on completed order
- [ ] Confirm dialog
- [ ] Verify success toast with correct voucher count
- [ ] Check order now has "Vouchers Generated" badge
- [ ] Verify vouchers created in `exam_vouchers` table

#### API Endpoints
```bash
# Test products endpoint
curl http://localhost:8080/wp-json/bda-portal/v1/woocommerce/products

# Test orders endpoint
curl http://localhost:8080/wp-json/bda-portal/v1/woocommerce/orders?status=completed

# Test single order
curl http://localhost:8080/wp-json/bda-portal/v1/woocommerce/orders/19307

# Test mark vouchers generated
curl -X POST http://localhost:8080/wp-json/bda-portal/v1/woocommerce/orders/19307/mark-vouchers-generated
```

## Troubleshooting

### Products not loading

1. Check WordPress is running: `curl http://localhost:8080`
2. Check WooCommerce is active in WordPress admin
3. Verify `.env` has correct `VITE_WP_API_BASE_URL`
4. Check browser console for CORS errors

### Orders not showing

1. Verify orders exist in WooCommerce admin
2. Check orders contain linked certification products
3. Verify product is linked in `/admin/woocommerce-products`
4. Check filter settings (status, product)

### Voucher generation fails

1. Check console for error messages
2. Verify certification product exists in database
3. Check user_id placeholder issue (see Known Issues #1)
4. Verify `exam_vouchers` table has correct schema
5. Check Supabase RLS policies allow insert

## Maintenance

### Regular Tasks

1. **Monitor voucher expiration**: Set up cron job to notify admins of expiring vouchers
2. **Archive old orders**: Move processed orders older than 1 year to archive
3. **Sync product changes**: If product details change in WooCommerce, re-sync
4. **Review unprocessed orders**: Weekly check for completed orders without vouchers

### Backup Procedures

1. Backup `certification_products` table before bulk updates
2. Backup `exam_vouchers` table before data migrations
3. Keep WooCommerce order backup in case of voucher issues

## Support

For issues or questions:
1. Check this documentation
2. Review browser console errors
3. Check WordPress error logs: `wp-content/debug.log`
4. Check Supabase logs in dashboard
5. Contact development team

---

**Last Updated:** 2025-10-01
**Version:** 1.0.0
