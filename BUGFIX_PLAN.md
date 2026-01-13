# Bug Fix Plan - FemmeLux Beauty Admin Dashboard

## Issues Identified

### 1. Missing Analytics API Endpoints (404 Errors)
**Error:** `[API] Resource not found` for:
- `/analytics/dashboard`
- `/analytics/sales?period=day`
- `/analytics/orders-by-status`
- `/analytics/top-products?limit=5`

**Root Cause:** Backend doesn't have analytics routes/controllers implemented

**Solution:**
- Create `backend/src/controllers/analytics.controller.ts`
- Create `backend/src/routes/analytics.routes.ts`
- Create `backend/src/services/analytics.service.ts`
- Register analytics routes in `backend/src/routes/index.ts`

### 2. Products Page TypeError
**Error:** `products.filter is not a function` at line 167

**Root Cause:** The `products` variable might be undefined or not an array when the API call fails or returns unexpected data

**Solution:**
- Add proper null/undefined checks
- Ensure `products` defaults to empty array
- Add error boundary handling

### 3. Missing getRecentOrders Function
**Error:** Dashboard page calls `getRecentOrders(5)` which may not exist

**Solution:**
- Verify if function exists in `orders.api.ts`
- If missing, create it or use existing `getAllOrders` with filters

## Implementation Steps

### Step 1: Create Analytics Backend Service
File: `backend/src/services/analytics.service.ts`
- Implement dashboard stats calculation
- Implement sales over time aggregation
- Implement orders by status grouping
- Implement top products query
- Implement top brands query
- Implement top customers query

### Step 2: Create Analytics Controller
File: `backend/src/controllers/analytics.controller.ts`
- Create handlers for all analytics endpoints
- Add proper error handling
- Add authentication/authorization

### Step 3: Create Analytics Routes
File: `backend/src/routes/analytics.routes.ts`
- Define all analytics routes
- Add middleware (auth, validation)
- Export router

### Step 4: Register Analytics Routes
File: `backend/src/routes/index.ts`
- Import and register analytics routes

### Step 5: Fix Products Page Data Handling
File: `admin/src/app/dashboard/products/page.tsx`
- Ensure products array is always defined
- Add proper error handling
- Add loading states

### Step 6: Verify/Create getRecentOrders
File: `admin/src/lib/api/orders.api.ts`
- Check if function exists
- Create if missing

## Priority Order

1. **HIGH**: Create analytics backend (Steps 1-4) - Fixes 404 errors
2. **HIGH**: Fix products page data handling (Step 5) - Fixes TypeError
3. **MEDIUM**: Verify getRecentOrders (Step 6) - May already exist

## Testing Checklist

After implementation:
- [ ] Dashboard loads without 404 errors
- [ ] All stat cards display data
- [ ] Sales chart renders
- [ ] Orders status chart renders
- [ ] Recent orders table displays
- [ ] Top products table displays
- [ ] Products page loads without errors
- [ ] Products filtering works
- [ ] Products pagination works

## Files to Create/Modify

### Create:
1. `backend/src/services/analytics.service.ts`
2. `backend/src/controllers/analytics.controller.ts`
3. `backend/src/routes/analytics.routes.ts`

### Modify:
1. `backend/src/routes/index.ts`
2. `backend/src/controllers/index.ts` (export analytics controller)
3. `backend/src/services/index.ts` (export analytics service)
4. `admin/src/app/dashboard/products/page.tsx` (add safety checks)
5. `admin/src/lib/api/orders.api.ts` (verify/add getRecentOrders)
