import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useMemo } from 'react';
import type { Product, ProductVariant } from '@/lib/api/products.api';

// ============================================
// TYPES
// ============================================

export interface CartItem {
  id: string; // unique cart item id
  productId: string;
  variantId?: string;
  product: Product; // full product object
  variant?: ProductVariant; // full variant object if selected
  quantity: number;
  subtotal: number; // quantity * price
}

export interface CartBrandGroup {
  brand: {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    minimumOrderAmount: number;
  };
  items: CartItem[];
  subtotal: number;
  meetsMinimum: boolean;
  amountToMinimum: number;
}

export interface MinimumOrderValidationError {
  brandId: string;
  brandName: string;
  required: number;
  current: number;
  missing: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;

  // Computed values
  totalItems: number;
  totalAmount: number;

  // Actions
  addToCart: (product: Product, quantity: number, variant?: ProductVariant) => void;
  removeFromCart: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;

  // Computed getters
  getItemCount: () => number;
  getSubtotal: () => number;
  getItemsByBrand: () => CartBrandGroup[];
  getItem: (productId: string, variantId?: string) => CartItem | undefined;
  isInCart: (productId: string, variantId?: string) => boolean;
  allBrandsMeetMinimum: () => boolean;
  validateMinimumOrders: () => MinimumOrderValidationError[];

  // Internal: recalculate totals
  _recalculateTotals: () => void;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate subtotal for a cart item
 */
export function calculateSubtotal(product: Product, quantity: number, variant?: ProductVariant): number {
  const price = variant?.price ?? product.price ?? 0;
  return price * quantity;
}

/**
 * Calculate total amount from all cart items
 */
export function calculateTotal(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.subtotal, 0);
}

/**
 * Count total items in cart (sum of quantities)
 */
export function countItems(items: CartItem[]): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

/**
 * Get the effective price for a product (considering variant and price tiers)
 */
function getEffectivePrice(product: Product, quantity: number, variant?: ProductVariant): number {
  // If variant has its own price, use it
  if (variant?.price) {
    return variant.price;
  }

  // Check for price tier discounts
  if (product.priceTiers && product.priceTiers.length > 0) {
    // Sort tiers by minQuantity descending to find the best applicable tier
    const sortedTiers = [...product.priceTiers].sort((a, b) => b.minQuantity - a.minQuantity);
    const applicableTier = sortedTiers.find((tier) => quantity >= tier.minQuantity);
    if (applicableTier) {
      return applicableTier.price;
    }
  }

  return product.price ?? 0;
}

/**
 * Generate unique cart item ID
 */
function generateCartItemId(productId: string, variantId?: string): string {
  return `${productId}-${variantId || 'default'}`;
}

// ============================================
// CART STORE
// ============================================

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      totalItems: 0,
      totalAmount: 0,

      // Internal: recalculate totals
      _recalculateTotals: () => {
        const items = get().items;
        set({
          totalItems: countItems(items),
          totalAmount: calculateTotal(items),
        });
      },

      // Add item to cart
      addToCart: (product, quantity, variant) => {
        set((state) => {
          const existingItemIndex = state.items.findIndex(
            (item) =>
              item.productId === product.id &&
              item.variantId === (variant?.id || undefined)
          );

          let newItems: CartItem[];

          if (existingItemIndex >= 0) {
            // Update quantity of existing item
            const existingItem = state.items[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;
            const maxQty = variant?.stock ?? product.maxOrderQuantity ?? product.stock;
            const finalQuantity = Math.min(newQuantity, maxQty);
            const effectivePrice = getEffectivePrice(product, finalQuantity, variant);

            newItems = state.items.map((item, index) => {
              if (index === existingItemIndex) {
                return {
                  ...item,
                  quantity: finalQuantity,
                  subtotal: effectivePrice * finalQuantity,
                  product, // Update with latest product data
                  variant, // Update with latest variant data
                };
              }
              return item;
            });
          } else {
            // Add new item
            const effectivePrice = getEffectivePrice(product, quantity, variant);
            const newItem: CartItem = {
              id: generateCartItemId(product.id, variant?.id),
              productId: product.id,
              variantId: variant?.id,
              product,
              variant,
              quantity,
              subtotal: effectivePrice * quantity,
            };

            newItems = [...state.items, newItem];
          }

          return {
            items: newItems,
            totalItems: countItems(newItems),
            totalAmount: calculateTotal(newItems),
          };
        });
      },

      // Remove item from cart
      removeFromCart: (productId, variantId) => {
        set((state) => {
          const newItems = state.items.filter(
            (item) =>
              !(item.productId === productId && item.variantId === (variantId || undefined))
          );

          return {
            items: newItems,
            totalItems: countItems(newItems),
            totalAmount: calculateTotal(newItems),
          };
        });
      },

      // Update item quantity
      updateQuantity: (productId, quantity, variantId) => {
        set((state) => {
          // If quantity is 0 or less, remove the item
          if (quantity <= 0) {
            const newItems = state.items.filter(
              (item) =>
                !(item.productId === productId && item.variantId === (variantId || undefined))
            );

            return {
              items: newItems,
              totalItems: countItems(newItems),
              totalAmount: calculateTotal(newItems),
            };
          }

          const newItems = state.items.map((item) => {
            if (
              item.productId === productId &&
              item.variantId === (variantId || undefined)
            ) {
              const maxQty = item.variant?.stock ?? item.product.maxOrderQuantity ?? item.product.stock;
              const minQty = item.product.minOrderQuantity || 1;
              const finalQuantity = Math.max(minQty, Math.min(quantity, maxQty));
              const effectivePrice = getEffectivePrice(item.product, finalQuantity, item.variant);

              return {
                ...item,
                quantity: finalQuantity,
                subtotal: effectivePrice * finalQuantity,
              };
            }
            return item;
          });

          return {
            items: newItems,
            totalItems: countItems(newItems),
            totalAmount: calculateTotal(newItems),
          };
        });
      },

      // Clear entire cart
      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalAmount: 0,
        });
      },

      // Toggle cart sidebar
      toggleCart: () => {
        set((state) => ({ isOpen: !state.isOpen }));
      },

      // Open cart sidebar
      openCart: () => {
        set({ isOpen: true });
      },

      // Close cart sidebar
      closeCart: () => {
        set({ isOpen: false });
      },

      // Get total item count
      getItemCount: () => {
        return get().totalItems;
      },

      // Get cart subtotal
      getSubtotal: () => {
        return get().totalAmount;
      },

      // Get items grouped by brand
      getItemsByBrand: () => {
        const items = get().items;
        const brandMap = new Map<string, CartBrandGroup>();

        items.forEach((item) => {
          const brand = item.product.brand;
          const brandId = brand.id;
          const existing = brandMap.get(brandId);

          if (existing) {
            existing.items.push(item);
            existing.subtotal += item.subtotal;
          } else {
            brandMap.set(brandId, {
              brand: {
                id: brand.id,
                name: brand.name,
                slug: brand.slug,
                logo: brand.logo,
                minimumOrderAmount: brand.minimumOrderAmount,
              },
              items: [item],
              subtotal: item.subtotal,
              meetsMinimum: false,
              amountToMinimum: 0,
            });
          }
        });

        // Calculate minimum order status for each brand
        const groups = Array.from(brandMap.values()).map((group) => {
          const meetsMinimum = group.subtotal >= group.brand.minimumOrderAmount;
          const amountToMinimum = meetsMinimum
            ? 0
            : group.brand.minimumOrderAmount - group.subtotal;

          return {
            ...group,
            meetsMinimum,
            amountToMinimum,
          };
        });

        // Sort by brand name
        return groups.sort((a, b) => a.brand.name.localeCompare(b.brand.name));
      },

      // Get specific item
      getItem: (productId, variantId) => {
        return get().items.find(
          (item) =>
            item.productId === productId &&
            item.variantId === (variantId || undefined)
        );
      },

      // Check if product is in cart
      isInCart: (productId, variantId) => {
        return get().items.some(
          (item) =>
            item.productId === productId &&
            item.variantId === (variantId || undefined)
        );
      },

      // Check if all brands meet minimum order
      allBrandsMeetMinimum: () => {
        const groups = get().getItemsByBrand();
        if (groups.length === 0) return false;
        return groups.every((group) => group.meetsMinimum);
      },

      // Validate minimum orders and return detailed errors
      validateMinimumOrders: () => {
        const groups = get().getItemsByBrand();
        const errors: MinimumOrderValidationError[] = [];

        groups.forEach((group) => {
          if (!group.meetsMinimum) {
            errors.push({
              brandId: group.brand.id,
              brandName: group.brand.name,
              required: group.brand.minimumOrderAmount,
              current: group.subtotal,
              missing: group.amountToMinimum,
            });
          }
        });

        return errors;
      },
    }),
    {
      name: 'femmelux-cart',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        totalItems: state.totalItems,
        totalAmount: state.totalAmount,
      }),
      // Rehydrate computed values after loading from storage
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.totalItems = countItems(state.items);
          state.totalAmount = calculateTotal(state.items);
        }
      },
    }
  )
);

// ============================================
// HELPER HOOKS
// ============================================

/**
 * Hook to get cart item count (for header badge)
 */
export function useCartItemCount(): number {
  return useCartStore((state) => state.totalItems);
}

/**
 * Hook to check if cart is empty
 */
export function useIsCartEmpty(): boolean {
  return useCartStore((state) => state.items.length === 0);
}

/**
 * Hook to get cart subtotal
 */
export function useCartSubtotal(): number {
  return useCartStore((state) => state.totalAmount);
}

/**
 * Hook to get cart items grouped by brand
 * Uses useMemo to prevent infinite loop with useSyncExternalStore
 */
export function useCartByBrand(): CartBrandGroup[] {
  const items = useCartStore((state) => state.items);
  const getItemsByBrand = useCartStore((state) => state.getItemsByBrand);

  return useMemo(() => getItemsByBrand(), [items, getItemsByBrand]);
}

/**
 * Hook to check if all brands meet minimum order requirements
 * Uses useMemo to prevent infinite loop with useSyncExternalStore
 */
export function useAllBrandsMeetMinimum(): boolean {
  const items = useCartStore((state) => state.items);
  const allBrandsMeetMinimum = useCartStore((state) => state.allBrandsMeetMinimum);

  return useMemo(() => allBrandsMeetMinimum(), [items, allBrandsMeetMinimum]);
}

/**
 * Hook to get minimum order validation errors
 * Uses useMemo to prevent infinite loop with useSyncExternalStore
 */
export function useMinimumOrderValidation(): MinimumOrderValidationError[] {
  const items = useCartStore((state) => state.items);
  const validateMinimumOrders = useCartStore((state) => state.validateMinimumOrders);

  return useMemo(() => validateMinimumOrders(), [items, validateMinimumOrders]);
}

/**
 * Hook to check if a specific product is in cart
 */
export function useIsInCart(productId: string, variantId?: string): boolean {
  return useCartStore((state) => state.isInCart(productId, variantId));
}

/**
 * Hook to get a specific cart item
 */
export function useCartItem(productId: string, variantId?: string): CartItem | undefined {
  return useCartStore((state) => state.getItem(productId, variantId));
}

/**
 * Hook to get cart open state
 */
export function useIsCartOpen(): boolean {
  return useCartStore((state) => state.isOpen);
}

// ============================================
// SELECTORS (for optimized re-renders)
// ============================================

export const cartSelectors = {
  items: (state: CartState) => state.items,
  isOpen: (state: CartState) => state.isOpen,
  totalItems: (state: CartState) => state.totalItems,
  totalAmount: (state: CartState) => state.totalAmount,
};
