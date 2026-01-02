// Cart-related types

import { Product } from './Product';

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  userId?: string;
}

export interface AddToCartInput {
  productId: string;
  quantity: number;
}

export interface UpdateCartItemInput {
  productId: string;
  quantity: number;
}

export interface RemoveFromCartInput {
  productId: string;
}
