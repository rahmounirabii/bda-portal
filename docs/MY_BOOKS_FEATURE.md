# My Books Feature

## Overview
The My Books feature allows Individual users to access and download digital books they have purchased through the WooCommerce store.

## Components

### Client-Side

#### Entity Layer (`client/src/entities/books/`)

**Types** (`books.types.ts`):
- `UserBook`: Interface representing a purchased book
- `BookFilters`: Filter options (search, format, expired status)
- `BookResult<T>`: Generic result wrapper with error handling

**Service** (`books.service.ts`):
- `BooksService.getUserBooks()`: Fetches user's purchased books from WooCommerce
- `BooksService.getBookDownloadUrl()`: Gets download URL for a specific book

**Hooks** (`books.hooks.ts`):
- `useUserBooks()`: React Query hook to fetch user books with filters
- `useBookDownload()`: Mutation hook to get download URL

#### Page Component (`client/pages/individual/MyBooks.tsx`)

Features:
- Search books by name
- Filter by format (PDF, EPUB, MOBI)
- Filter by status (Active, Expired)
- Book grid display with cover images
- Download buttons for active books
- Expiry status badges
- Empty state with link to store

### Backend (WordPress)

#### REST API Endpoints (`public_html/wp-content/themes/jupiterx/inc/bda-portal-api/init.php`)

**GET `/bda-portal/v1/woocommerce/user-books`**

Query Parameters:
- `customer_email` (required): User's email address
- `search` (optional): Search term for book name

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": "123_456",
      "product_id": 456,
      "product_name": "Introduction to Business Data Analytics",
      "sku": "BDA-BOOK-001",
      "cover_image": "https://...",
      "purchased_at": "2025-01-15 10:30:00",
      "expires_at": "2026-01-15 10:30:00",
      "order_id": 123,
      "order_status": "completed",
      "format": "pdf",
      "pages": 350,
      "description": "Comprehensive guide to..."
    }
  ]
}
```

**POST `/bda-portal/v1/woocommerce/book-download`**

Request Body:
```json
{
  "product_id": 456,
  "order_id": 123
}
```

Response:
```json
{
  "success": true,
  "data": {
    "download_url": "https://..."
  }
}
```

## Implementation Details

### Book Expiry Logic
- Books expire 12 months after purchase by default
- Expiry date calculated: `purchase_date + 12 months`
- Expired books cannot be downloaded
- Visual indicators show expiry status

### Product Metadata
Books support custom metadata:
- `_book_format`: Format type (pdf/epub/mobi)
- `_book_pages`: Number of pages
- Product short description used for book description
- Product featured image used as cover image

### Download Flow
1. User clicks "Download" button
2. Frontend calls `useBookDownload()` mutation
3. Backend verifies:
   - Order exists and contains product
   - Product is downloadable
   - User owns the product
4. Returns WooCommerce download URL
5. Opens in new tab

### Error Handling
- Missing books: Shows "No books found" with store link
- Download errors: Toast notification with error message
- Expired books: Download button disabled

## Routes
- `/my-books` - My Books page (Individual users only)

## Environment Variables
```
VITE_WP_API_BASE_URL=http://localhost:8080/wp-json
```

## WooCommerce Requirements

### Product Configuration
For books to appear in My Books:
1. Product must be marked as "Downloadable"
2. Product must have downloadable files configured
3. User must have completed order containing the product

### Optional Metadata
Add custom fields to products:
- `_book_format`: "pdf", "epub", or "mobi"
- `_book_pages`: Integer (number of pages)

## Testing

### Test Scenarios
1. ✅ User with purchased books sees them in grid
2. ✅ Search filters books by name
3. ✅ Format filter shows only selected format
4. ✅ Status filter separates active/expired books
5. ✅ Download button works for active books
6. ✅ Download button disabled for expired books
7. ✅ Empty state shows when no books found
8. ✅ Books expire 12 months after purchase

### Manual Testing
1. Create downloadable product in WooCommerce
2. Complete order for test user
3. Log in as test user
4. Navigate to /my-books
5. Verify book appears
6. Test download functionality

## Future Enhancements
- [ ] Reading progress tracking
- [ ] Book annotations/highlights
- [ ] Offline download support
- [ ] Book collections/categories
- [ ] Reading statistics
- [ ] Multiple file format downloads per book
- [ ] Admin configurable expiry periods
