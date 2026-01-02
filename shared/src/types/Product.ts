// Product-related types

export interface Product {
  id: string;
  brandId: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  wholesalePrice: number;
  sku: string;
  images: string[];
  quantity: number;
  status: boolean;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductInput {
  brandId: string;
  name: string;
  slug?: string;
  description: string;
  price: number;
  wholesalePrice: number;
  sku: string;
  images: string[];
  quantity: number;
  status?: boolean;
  category?: string;
}

export interface UpdateProductInput {
  brandId?: string;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  wholesalePrice?: number;
  sku?: string;
  images?: string[];
  quantity?: number;
  status?: boolean;
  category?: string;
}

export interface ProductFilter {
  brandId?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  status?: boolean;
  search?: string;
}
