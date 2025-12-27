# WooCommerce Integration - Quick Start Guide

## For Administrators

### Setup (One-time)

1. **Verify WordPress is running**
   ```bash
   curl http://localhost:8080/wp-json/bda-portal/v1/woocommerce/products
   ```
   Should return JSON with products.

2. **Check environment variable**
   In `.env`:
   ```
   VITE_WP_API_BASE_URL=http://localhost:8080/wp-json
   ```

3. **Start React app**
   ```bash
   npm run dev
   ```

### Daily Workflow

#### Step 1: Link Products to Certifications

1. Navigate to **Admin → WooCommerce Products** (`/admin/woocommerce-products`)
2. Click **"Refresh from Store"** to sync latest products
3. Find certification products (e.g., "BDA-SCP Certification")
4. Click **"Link to Cert"**
5. Configure:
   - **Certification Type**: CP™ or SCP™
   - **Linked Quiz**: Select exam (optional)
   - **Vouchers per Purchase**: How many vouchers per product purchased (usually 1)
   - **Validity (Months)**: How long voucher is valid (usually 6)
6. Click **"Link Product"**

#### Step 2: Generate Vouchers for Orders

1. Navigate to **Admin → WooCommerce Orders** (`/admin/woocommerce-orders`)
2. Filter by **Status = Completed** (default)
3. Review orders containing certification products
4. For each order without "Vouchers Generated" badge:
   - Click **"Generate Vouchers"**
   - Review order details in confirmation dialog
   - Click **"Generate"**
5. System automatically creates vouchers based on:
   - Product quantity × vouchers per purchase
   - Expiration date = today + validity months
6. Order now shows **"Vouchers Generated"** badge

#### Step 3: Verify Voucher Creation

1. Navigate to **Admin → Vouchers** (`/admin/vouchers`)
2. Check newly created vouchers
3. Verify:
   - Correct user (customer email)
   - Correct certification type
   - Correct expiration date
   - Linked to WooCommerce order

### Common Scenarios

#### Scenario 1: Customer Buys 2 SCP Certifications

**Order:**
- Product: BDA-SCP Certification
- Quantity: 2
- Customer: john@example.com

**Configuration:**
- Vouchers per Purchase: 1
- Validity: 6 months

**Result:**
- 2 vouchers created (1 × 2)
- Both expire in 6 months
- Both assigned to john@example.com
- Both for SCP™ certification

#### Scenario 2: Bulk Purchase for Organization

**Order:**
- Product: BDA-CP Certification
- Quantity: 10
- Customer: training@company.com

**Configuration:**
- Vouchers per Purchase: 1
- Validity: 12 months

**Result:**
- 10 vouchers created (1 × 10)
- All expire in 12 months
- All assigned to training@company.com
- Admin can later reassign to individual employees

#### Scenario 3: Bundle Product

**Order:**
- Product: BDA Training + Certification Bundle
- Quantity: 1
- Customer: student@university.edu

**Configuration:**
- Vouchers per Purchase: 3 (training + exam + retake)
- Validity: 12 months

**Result:**
- 3 vouchers created (3 × 1)
- All expire in 12 months
- Allows one training exam and two attempts

### Filters & Search

#### Order Status Filters
- **Completed**: Only completed orders (recommended for voucher generation)
- **Processing**: Orders being processed by WooCommerce
- **On Hold**: Payment pending or manual review needed
- **Pending**: Awaiting payment
- **All Status**: Show all orders

#### Product Filters
- **All Certification Products**: Show all orders with any linked product
- **Specific Product**: Filter by individual certification product

### Troubleshooting

#### "No certification orders found"

**Causes:**
1. No orders in WooCommerce
2. Orders don't contain linked certification products
3. Product not linked in Products page

**Solution:**
1. Check WooCommerce admin for orders
2. Visit Products page and link products
3. Refresh Orders page

#### "Failed to generate vouchers"

**Causes:**
1. User not found (email mismatch)
2. Database connection issue
3. Invalid product configuration

**Solution:**
1. Check browser console for error details
2. Verify customer email exists in system
3. Contact development team if issue persists

#### "Vouchers generated but not showing"

**Causes:**
1. Vouchers created but page not refreshed
2. User lookup failed (placeholder used)
3. RLS policy blocking view

**Solution:**
1. Refresh page
2. Check Vouchers admin page directly
3. Verify Supabase connection

### Best Practices

1. **Link products before generating vouchers**
   - Always configure products first
   - Review configuration before linking

2. **Generate vouchers for completed orders only**
   - Wait for payment confirmation
   - Don't generate for pending/processing orders

3. **Review order details before generating**
   - Verify customer email
   - Check product quantities
   - Confirm certification type

4. **Check for existing vouchers**
   - Green badge = vouchers already generated
   - Don't generate twice for same order

5. **Monitor voucher expiration**
   - Set appropriate validity period
   - Consider customer usage timeline
   - Notify customers before expiration

6. **Regular maintenance**
   - Weekly: Process new completed orders
   - Monthly: Review unused vouchers
   - Quarterly: Clean up expired vouchers

### Quick Reference

#### Admin Pages

| Page | URL | Purpose |
|------|-----|---------|
| Products | `/admin/woocommerce-products` | Link WooCommerce products to certifications |
| Orders | `/admin/woocommerce-orders` | View orders and generate vouchers |
| Vouchers | `/admin/vouchers` | Manage all exam vouchers |

#### Product Configuration

| Field | Description | Typical Value |
|-------|-------------|---------------|
| Certification Type | CP™ or SCP™ | Based on product |
| Linked Quiz | Optional exam | Usually none (any exam of type) |
| Vouchers per Purchase | How many vouchers per unit | 1 |
| Validity (Months) | Expiration period | 6-12 months |

#### Order Statuses

| Status | Meaning | Generate Vouchers? |
|--------|---------|-------------------|
| Completed | Payment received, order fulfilled | ✅ Yes |
| Processing | Order being processed | ⏳ Wait |
| On Hold | Manual review needed | ⏳ Wait |
| Pending | Awaiting payment | ❌ No |
| Cancelled | Order cancelled | ❌ No |
| Refunded | Payment refunded | ❌ No |

### API Endpoints (for reference)

```bash
# Get products
GET /wp-json/bda-portal/v1/woocommerce/products

# Get completed orders
GET /wp-json/bda-portal/v1/woocommerce/orders?status=completed

# Get specific order
GET /wp-json/bda-portal/v1/woocommerce/orders/{id}

# Mark order as processed
POST /wp-json/bda-portal/v1/woocommerce/orders/{id}/mark-vouchers-generated
```

### Support Contacts

- **Technical Issues**: Check `WOOCOMMERCE_INTEGRATION.md` for detailed troubleshooting
- **WordPress Issues**: Check `wp-content/debug.log`
- **Supabase Issues**: Check Supabase dashboard logs
- **Development Team**: Contact via GitHub issues

---

**Quick Start Version:** 1.0.0
**Last Updated:** 2025-10-01
