// Authentication middleware
export {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
  authorizeOwnerOrAdmin,
} from './auth.middleware';

// Validation middleware
export {
  validateRequest,
  validate,
  registerUserRules,
  loginUserRules,
  updateUserRules,
  createBrandRules,
  updateBrandRules,
  createProductRules,
  updateProductRules,
  createOrderRules,
  updateOrderStatusRules,
  uuidParamRule,
  paginationRules,
} from './validation.middleware';

// Error handling middleware
export {
  ApiError,
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from './error.middleware';

// Price visibility middleware
export {
  checkPriceAccess,
  checkPriceAccessOptional,
} from './priceVisibility.middleware';
