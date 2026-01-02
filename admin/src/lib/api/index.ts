// ============================================
// API EXPORTS
// ============================================

// Auth API
export {
  login,
  register,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  refreshToken,
} from './auth.api';

// Brands API
export {
  getAllBrands,
  getBrand,
  getBrandBySlug,
  createBrand,
  updateBrand,
  deleteBrand,
  restoreBrand,
  getBrandProducts,
  validateCart,
  searchBrands,
  getBrandStats,
} from './brands.api';
export type {
  BrandFilters,
  CreateBrandData,
  UpdateBrandData,
  BrandWithProducts,
  BrandsResponse,
  BrandProductsResponse,
} from './brands.api';

// Products API
export {
  getAllProducts,
  getProduct,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  updateStock,
  bulkUpdateStock,
  getRelatedProducts,
  getLowStockProducts,
  getCategories,
  uploadProductImage,
  getProductsByIds,
} from './products.api';
export type {
  ProductFilters,
  CreateProductData,
  UpdateProductData,
  ProductsResponse,
  StockUpdateData,
  BulkStockUpdateData,
} from './products.api';

// Orders API
export {
  getAllOrders,
  getOrder,
  getOrderByNumber,
  getBrandOrders,
  getMyOrders,
  updateOrderStatus,
  updatePaymentStatus,
  addTracking,
  cancelOrder,
  getOrderStats,
  getRecentOrders,
  exportOrders,
  sendOrderConfirmation,
  sendShippingNotification,
} from './orders.api';
export type {
  OrderFilters,
  OrdersResponse,
  UpdateOrderStatusData,
  UpdatePaymentStatusData,
  AddTrackingData,
  OrderStats,
} from './orders.api';
