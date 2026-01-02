'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckIcon, ArrowLeftIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import {
  useCartStore,
  useIsCartEmpty,
  useCartSubtotal,
  useCartItemCount,
  useAllBrandsMeetMinimum,
} from '@/store/cart.store';
import { ShippingForm, OrderReview, type ShippingFormData } from '@/components/checkout';
import { CartSummary } from '@/components/cart';
import { formatCurrency } from '@/lib/utils';
import { createOrder, type CreateOrderData, type OrderAddress } from '@/lib/api/orders.api';
import toast from 'react-hot-toast';

type CheckoutStep = 'shipping' | 'review' | 'confirmation';

interface CheckoutState {
  shippingData: ShippingFormData | null;
}

export default function CheckoutPage() {
  const router = useRouter();

  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);

  const isEmpty = useIsCartEmpty();
  const subtotal = useCartSubtotal();
  const itemCount = useCartItemCount();
  const allBrandsMeetMinimum = useAllBrandsMeetMinimum();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
  const [checkoutState, setCheckoutState] = useState<CheckoutState>({
    shippingData: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  // Redirect to cart if empty or minimum not met
  useEffect(() => {
    if (isEmpty && currentStep !== 'confirmation') {
      router.push('/cart');
    }
  }, [isEmpty, currentStep, router]);

  // Steps configuration
  const steps = [
    { id: 'shipping', label: 'Shipping', number: 1 },
    { id: 'review', label: 'Review', number: 2 },
    { id: 'confirmation', label: 'Confirmation', number: 3 },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  // Handle shipping form submission
  const handleShippingSubmit = (data: ShippingFormData) => {
    setCheckoutState((prev) => ({ ...prev, shippingData: data }));
    setCurrentStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle order submission
  const handlePlaceOrder = async () => {
    if (!checkoutState.shippingData) {
      toast.error('Please complete shipping information');
      setCurrentStep('shipping');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      router.push('/cart');
      return;
    }

    setIsSubmitting(true);
    try {
      // Convert shipping form data to backend address format
      const shippingAddress: OrderAddress = {
        street: checkoutState.shippingData.address + (checkoutState.shippingData.address2 ? `, ${checkoutState.shippingData.address2}` : ''),
        city: checkoutState.shippingData.city,
        state: checkoutState.shippingData.state,
        postalCode: checkoutState.shippingData.postalCode,
        country: checkoutState.shippingData.country,
      };

      // Convert cart items to order items format
      const orderItems = items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      }));

      // Create order data
      const orderData: CreateOrderData = {
        items: orderItems,
        shippingAddress,
        billingAddress: shippingAddress, // Use shipping as billing for now
        notes: checkoutState.shippingData.notes,
        paymentMethod: 'invoice', // Default payment method for wholesale
      };

      // Call the API to create the order
      const order = await createOrder(orderData);

      // Set the order number from the response
      setOrderNumber(order.orderNumber);

      // Clear cart
      clearCart();

      // Move to confirmation
      setCurrentStep('confirmation');
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Order creation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to place order. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit from review
  const handleEditSection = (section: 'shipping' | 'billing') => {
    if (section === 'shipping') {
      setCurrentStep('shipping');
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'shipping':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <ShippingForm
              onSubmit={handleShippingSubmit}
              initialData={checkoutState.shippingData || undefined}
            />
          </div>
        );

      case 'review':
        return (
          <>
            <OrderReview
              items={items}
              shippingData={checkoutState.shippingData!}
              subtotal={subtotal}
              total={subtotal}
              onEdit={handleEditSection}
            />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button
                onClick={() => setCurrentStep('shipping')}
                className="flex-1 py-3 px-6 border border-gray-200 hover:bg-gray-50 text-secondary-800 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Shipping
              </button>
              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                className="flex-1 py-3 px-6 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing Order...
                  </>
                ) : (
                  'Place Order'
                )}
              </button>
            </div>
          </>
        );

      case 'confirmation':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckIcon className="w-10 h-10 text-green-600" />
            </div>

            <h2 className="text-2xl font-bold text-secondary-800 mb-2">
              Thank You for Your Order!
            </h2>
            <p className="text-gray-600 mb-6">
              Your wholesale order has been received and is being processed.
            </p>

            {/* Order Number */}
            {orderNumber && (
              <div className="inline-block bg-gray-100 rounded-lg px-6 py-3 mb-6">
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="text-xl font-bold text-secondary-800">{orderNumber}</p>
              </div>
            )}

            {/* What's Next */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-8">
              <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium text-blue-800">
                    1
                  </span>
                  <span>
                    You&apos;ll receive an order confirmation email with your order details.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium text-blue-800">
                    2
                  </span>
                  <span>
                    Our team will review your order and send you an invoice with payment
                    instructions.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium text-blue-800">
                    3
                  </span>
                  <span>
                    Once payment is received, your order will be prepared and shipped with tracking.
                  </span>
                </li>
              </ul>
            </div>

            {/* Shipping Details */}
            {checkoutState.shippingData && (
              <div className="text-left bg-gray-50 rounded-lg p-4 mb-8">
                <h3 className="font-semibold text-secondary-800 mb-2">Shipping To:</h3>
                <div className="text-sm text-gray-600">
                  <p className="font-medium text-secondary-700">
                    {checkoutState.shippingData.firstName} {checkoutState.shippingData.lastName}
                  </p>
                  {checkoutState.shippingData.company && (
                    <p>{checkoutState.shippingData.company}</p>
                  )}
                  <p>{checkoutState.shippingData.address}</p>
                  {checkoutState.shippingData.address2 && (
                    <p>{checkoutState.shippingData.address2}</p>
                  )}
                  <p>
                    {checkoutState.shippingData.city}, {checkoutState.shippingData.state}{' '}
                    {checkoutState.shippingData.postalCode}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-semibold rounded-lg transition-colors"
              >
                <ShoppingBagIcon className="w-5 h-5" />
                Continue Shopping
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 hover:bg-gray-50 text-secondary-800 font-medium rounded-lg transition-colors"
              >
                Return to Home
              </Link>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Show minimum order warning
  if (!isEmpty && !allBrandsMeetMinimum && currentStep !== 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-lg mx-auto text-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-secondary-800 mb-2">
              Minimum Order Not Met
            </h1>
            <p className="text-gray-600 mb-8">
              Some brands in your cart don&apos;t meet their minimum order requirements. Please
              update your cart to continue.
            </p>
            <Link
              href="/cart"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-semibold rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Return to Cart
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary-600 transition-colors mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Cart
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-secondary-800">Checkout</h1>
        </div>

        {/* Progress Steps */}
        {currentStep !== 'confirmation' && (
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {steps.slice(0, -1).map((step, index) => (
                <div key={step.id} className="flex items-center">
                  {/* Step Circle */}
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm transition-colors ${
                      index < currentStepIndex
                        ? 'bg-green-500 text-white'
                        : index === currentStepIndex
                        ? 'bg-primary-500 text-secondary-900'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <CheckIcon className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={`ml-2 text-sm font-medium hidden sm:block ${
                      index <= currentStepIndex ? 'text-secondary-800' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>

                  {/* Connector */}
                  {index < steps.length - 2 && (
                    <div
                      className={`w-12 sm:w-24 h-1 mx-4 rounded ${
                        index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Section */}
          <div className={`${currentStep === 'confirmation' ? 'lg:col-span-3' : 'lg:col-span-2'}`}>
            {renderStepContent()}
          </div>

          {/* Order Summary Sidebar */}
          {currentStep !== 'confirmation' && (
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-secondary-800 mb-4">Order Summary</h3>

                  {/* Item Count */}
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                    <Link href="/cart" className="text-primary-600 hover:text-primary-700 font-medium">
                      Edit Cart
                    </Link>
                  </div>

                  {/* Items Preview */}
                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {items.slice(0, 5).map((item) => (
                      <div
                        key={`${item.productId}-${item.variantId || ''}`}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-600 truncate mr-2">
                          {item.product.name} x {item.quantity}
                        </span>
                        <span className="text-secondary-800 font-medium flex-shrink-0">
                          {formatCurrency(item.subtotal)}
                        </span>
                      </div>
                    ))}
                    {items.length > 5 && (
                      <p className="text-xs text-gray-400">
                        +{items.length - 5} more items
                      </p>
                    )}
                  </div>

                  {/* Totals */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Shipping</span>
                      <span className="text-sm">Calculated later</span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold text-secondary-800 pt-2 border-t border-gray-200">
                      <span>Total</span>
                      <span className="text-primary-600">{formatCurrency(subtotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 text-gray-600">
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="text-sm font-medium">Secure Checkout</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Your information is protected with industry-standard encryption.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
