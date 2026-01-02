# FemmeLux Beauty - B2B Wholesale Beauty Platform

A comprehensive B2B wholesale beauty e-commerce platform built with modern technologies. FemmeLux connects beauty brands with wholesale buyers, featuring minimum order requirements, multi-brand shopping carts, and complete order management.

## Tech Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (sessions, caching)
- **Authentication**: JWT (access + refresh tokens)
- **File Storage**: Local/S3 compatible
- **Validation**: Zod

### Admin Panel
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + Headless UI
- **State**: React Query (TanStack Query)
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts

### Customer Website
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **UI**: Tailwind CSS + Headless UI
- **State**: Zustand (cart) + React Query
- **Forms**: React Hook Form

## Project Structure

```
femmelux-beauty/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # App entry point
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data script
│   └── uploads/            # File uploads directory
│
├── admin/                   # Admin panel (Next.js)
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # API clients, utilities
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
│
├── web/                     # Customer website (Next.js)
│   ├── src/
│   │   ├── app/            # App router pages
│   │   ├── components/     # React components
│   │   ├── lib/            # API clients, utilities
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
│
├── docker-compose.yml       # Docker services
├── package.json            # Root package.json
└── README.md               # This file
```

## Prerequisites

- **Node.js**: v18.x or higher
- **PostgreSQL**: v14.x or higher
- **Redis**: v6.x or higher (optional, for caching)
- **npm**: v9.x or higher

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/femmelux-beauty.git
cd femmelux-beauty
```

### 2. Install Dependencies

```bash
# Install root dependencies (for running all services)
npm install

# Install backend dependencies
cd backend && npm install

# Install admin panel dependencies
cd ../admin && npm install

# Install customer website dependencies
cd ../web && npm install

cd ..
```

### 3. Environment Configuration

Copy the example environment files and configure them:

```bash
# Backend
cp backend/.env.example backend/.env

# Admin Panel
cp admin/.env.example admin/.env.local

# Customer Website
cp web/.env.example web/.env.local
```

#### Backend Environment Variables

Edit `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/femmelux?schema=public"

# JWT
JWT_ACCESS_SECRET="your-super-secret-access-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Server
PORT=4000
NODE_ENV=development

# File uploads
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# CORS
CORS_ORIGINS="http://localhost:3000,http://localhost:3001"
```

#### Admin Panel Environment Variables

Edit `admin/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

#### Customer Website Environment Variables

Edit `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 4. Database Setup

```bash
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npm run prisma:seed

cd ..
```

### 5. Start Development Servers

You can start all services at once or individually:

```bash
# Start all services concurrently
npm run dev

# Or start individually:
npm run dev:backend  # Starts on http://localhost:4000
npm run dev:admin    # Starts on http://localhost:3001
npm run dev:web      # Starts on http://localhost:3000
```

## Default Credentials

After running the seed script:

### Admin Account
- **Email**: admin@femmelux.com
- **Password**: Admin123!

### Test Customer Accounts
- **Email**: buyer1@example.com / **Password**: Customer123!
- **Email**: buyer2@example.com / **Password**: Customer123!

## API Documentation

The backend API follows RESTful conventions:

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user

### Brands
- `GET /api/brands` - List all brands
- `GET /api/brands/:id` - Get brand by ID
- `GET /api/brands/slug/:slug` - Get brand by slug
- `POST /api/brands` - Create brand (admin)
- `PUT /api/brands/:id` - Update brand (admin)
- `DELETE /api/brands/:id` - Delete brand (admin)

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/slug/:slug` - Get product by slug
- `GET /api/products/brand/:brandId` - Get products by brand
- `POST /api/products` - Create product (admin/vendor)
- `PUT /api/products/:id` - Update product (admin/vendor)
- `DELETE /api/products/:id` - Delete product (admin/vendor)

### Orders
- `GET /api/orders` - List orders (admin/vendor)
- `GET /api/orders/my` - Get customer's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/cancel` - Cancel order

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create category (admin)
- `PUT /api/categories/:id` - Update category (admin)
- `DELETE /api/categories/:id` - Delete category (admin)

### Customers
- `GET /api/customers` - List customers (admin)
- `GET /api/customers/:id` - Get customer details (admin)
- `PUT /api/customers/:id/approve` - Approve customer (admin)

## Docker Deployment

Use Docker Compose for easy deployment:

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

## Production Deployment

### Backend
```bash
cd backend
npm run build
npm start
```

### Admin Panel
```bash
cd admin
npm run build
npm start
```

### Customer Website
```bash
cd web
npm run build
npm start
```

## Features

### For Administrators
- Dashboard with sales analytics and charts
- Brand management (CRUD, logo upload)
- Product management (CRUD, image upload, variants)
- Order management (status updates, tracking)
- Customer management (approval workflow)
- Category management

### For Vendors (Brand Owners)
- View orders containing their products
- Update product information
- Track sales performance

### For Customers (Wholesale Buyers)
- Browse products by brand or category
- Multi-brand shopping cart
- Minimum order validation per brand
- Order history and tracking
- Account management
- Reorder functionality

## Key Business Logic

### Minimum Order Requirements
Each brand can set a minimum order amount. Customers must meet the minimum for each brand in their cart before checkout.

### Stock Management
- Stock is reserved when items are added to cart
- Stock is decremented when order is confirmed
- Stock is restored if order is cancelled

### Order Status Flow
```
pending → confirmed → processing → shipped → delivered
    ↓
cancelled
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@femmelux.com or open an issue in the repository.
