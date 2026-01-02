# FemmeLux Beauty - Testing Checklist

## Pre-Testing Setup

- [ ] Ensure Docker containers are running (postgres, redis)
- [ ] Run database migrations: `cd backend && npx prisma migrate dev`
- [ ] Seed the database: `cd backend && npx prisma db seed`
- [ ] Start all services: `npm run dev` (from root)
- [ ] Verify backend is running at http://localhost:4000
- [ ] Verify admin panel is running at http://localhost:3001
- [ ] Verify customer website is running at http://localhost:3000

---

## Backend API Testing

### Authentication
- [ ] POST /api/auth/register - Register new user
- [ ] POST /api/auth/login - Login with credentials
- [ ] POST /api/auth/refresh - Refresh access token
- [ ] POST /api/auth/logout - Logout and invalidate token
- [ ] GET /api/auth/me - Get current user profile
- [ ] PUT /api/auth/profile - Update user profile
- [ ] POST /api/auth/change-password - Change password

### Brands
- [ ] GET /api/brands - List all brands (public)
- [ ] GET /api/brands/:slug - Get brand by slug
- [ ] POST /api/brands - Create brand (admin only)
- [ ] PUT /api/brands/:id - Update brand (admin only)
- [ ] DELETE /api/brands/:id - Delete brand (admin only)
- [ ] POST /api/brands/:id/upload-logo - Upload brand logo

### Categories
- [ ] GET /api/categories - List all categories (public)
- [ ] GET /api/categories/tree - Get category tree
- [ ] GET /api/categories/:slug - Get category by slug
- [ ] POST /api/categories - Create category (admin only)
- [ ] PUT /api/categories/:id - Update category (admin only)
- [ ] DELETE /api/categories/:id - Delete category (admin only)

### Products
- [ ] GET /api/products - List products with filters
- [ ] GET /api/products/:slug - Get product by slug
- [ ] GET /api/products/search - Search products
- [ ] POST /api/products - Create product (admin only)
- [ ] PUT /api/products/:id - Update product (admin only)
- [ ] DELETE /api/products/:id - Delete product (admin only)
- [ ] POST /api/products/:id/images - Upload product images
- [ ] DELETE /api/products/:id/images/:imageId - Delete image

### Cart
- [ ] GET /api/cart - Get current cart
- [ ] POST /api/cart/items - Add item to cart
- [ ] PUT /api/cart/items/:id - Update cart item
- [ ] DELETE /api/cart/items/:id - Remove item from cart
- [ ] DELETE /api/cart - Clear cart

### Orders
- [ ] GET /api/orders - List user orders
- [ ] GET /api/orders/:id - Get order details
- [ ] POST /api/orders - Create order from cart
- [ ] PUT /api/orders/:id/cancel - Cancel order
- [ ] PUT /api/orders/:id/status - Update status (admin)
- [ ] GET /api/orders/:id/invoice - Download invoice

### Customers (Admin)
- [ ] GET /api/customers - List all customers
- [ ] GET /api/customers/:id - Get customer details
- [ ] PUT /api/customers/:id - Update customer
- [ ] PUT /api/customers/:id/approve - Approve customer
- [ ] DELETE /api/customers/:id - Delete customer

### Dashboard (Admin)
- [ ] GET /api/dashboard/stats - Get dashboard statistics
- [ ] GET /api/dashboard/recent-orders - Get recent orders
- [ ] GET /api/dashboard/top-products - Get top products

---

## Admin Panel Testing

### Authentication
- [ ] Login page displays correctly
- [ ] Admin can login with valid credentials
- [ ] Invalid credentials show error message
- [ ] Logout clears session and redirects

### Dashboard
- [ ] Stats cards show correct data
- [ ] Recent orders table displays orders
- [ ] Quick links navigate correctly

### Brands Management
- [ ] Brands list loads with pagination
- [ ] Search filters brands correctly
- [ ] Create new brand form works
- [ ] Edit brand updates correctly
- [ ] Delete brand with confirmation
- [ ] Logo upload works correctly

### Categories Management
- [ ] Categories list with tree structure
- [ ] Create category with parent selection
- [ ] Edit category works
- [ ] Delete category with confirmation
- [ ] Drag and drop reordering (if implemented)

### Products Management
- [ ] Products list with filters (brand, category, status)
- [ ] Search products works
- [ ] Create product with all fields
- [ ] Product variants creation
- [ ] Price tiers (wholesale pricing)
- [ ] Image upload (multiple images)
- [ ] Edit product updates correctly
- [ ] Delete product with confirmation

### Orders Management
- [ ] Orders list with status filter
- [ ] Order details page shows all info
- [ ] Status update works
- [ ] Tracking number update
- [ ] Order timeline displays correctly

### Customers Management
- [ ] Customers list displays
- [ ] Filter by approval status
- [ ] Approve pending customers
- [ ] View customer details
- [ ] View customer orders

---

## Customer Website Testing

### Public Pages
- [ ] Homepage loads correctly
- [ ] Brand logos carousel works
- [ ] Featured products display
- [ ] Categories navigation works
- [ ] Footer links work

### Brands Page
- [ ] All brands display in grid
- [ ] Brand cards show correct info
- [ ] Click navigates to brand detail
- [ ] Brand detail shows products
- [ ] Brand product pagination works

### Products
- [ ] Products listing page works
- [ ] Filters work (brand, category, price)
- [ ] Search works
- [ ] Product detail page loads
- [ ] Image gallery works
- [ ] Variant selection works
- [ ] Price tier display for quantities
- [ ] Add to cart button works

### Authentication
- [ ] Register page works
- [ ] Business info fields for wholesale
- [ ] Login page works
- [ ] Forgot password flow
- [ ] Profile edit works
- [ ] Password change works

### Shopping Cart
- [ ] Cart displays items correctly
- [ ] Quantity update works
- [ ] Remove item works
- [ ] Brand grouping displays correctly
- [ ] Minimum order warnings show
- [ ] Cart total calculates correctly

### Checkout
- [ ] Checkout page loads
- [ ] Address forms work
- [ ] Order summary displays
- [ ] Place order creates order
- [ ] Order confirmation page shows
- [ ] Redirect to order details

### Account Pages
- [ ] Account dashboard displays
- [ ] Quick stats are correct
- [ ] Recent orders show
- [ ] Orders list with filters
- [ ] Order detail page works
- [ ] Cancel order works
- [ ] Reorder button works
- [ ] Profile edit works
- [ ] Password change works

---

## Mobile Responsiveness

### Admin Panel
- [ ] Sidebar collapses on mobile
- [ ] Tables scroll horizontally
- [ ] Forms are usable on mobile
- [ ] Modals fit screen

### Customer Website
- [ ] Header hamburger menu works
- [ ] Navigation drawer works
- [ ] Product grid adjusts
- [ ] Cart is usable on mobile
- [ ] Checkout works on mobile
- [ ] Account sidebar collapses

---

## Performance Testing

- [ ] Homepage loads under 3s
- [ ] Products page loads under 2s
- [ ] Images are optimized
- [ ] API responses are fast
- [ ] No console errors
- [ ] Lighthouse score > 80

---

## Security Testing

- [ ] Protected routes require auth
- [ ] Admin routes check admin role
- [ ] JWT tokens expire correctly
- [ ] Password is hashed
- [ ] SQL injection prevented
- [ ] XSS prevented
- [ ] CORS configured correctly

---

## Browser Compatibility

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari
- [ ] Mobile Chrome

---

## Notes

Add any issues or observations during testing:

1. 
2. 
3. 

