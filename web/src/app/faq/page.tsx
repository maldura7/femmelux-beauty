'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronDownIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  TruckIcon,
  SparklesIcon,
  ArrowPathIcon,
  CurrencyDollarIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  items: FAQItem[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'account',
    title: 'Account & Registration',
    icon: UserGroupIcon,
    description: 'Questions about creating and managing your wholesale account',
    items: [
      {
        question: 'How do I apply for a wholesale account?',
        answer:
          'To apply for a wholesale account, click on "Apply for Wholesale" in the navigation menu. You\'ll need to provide your business information including your business name, tax ID, and business license. Our team will review your application within 1-2 business days.',
      },
      {
        question: 'What are the requirements to become a wholesale customer?',
        answer:
          'We require all wholesale customers to have a valid business license, tax ID/resale certificate, and a physical business location. We primarily serve beauty retailers, salons, spas, and e-commerce businesses.',
      },
      {
        question: 'How long does the approval process take?',
        answer:
          'Most applications are reviewed within 1-2 business days. You\'ll receive an email notification once your application has been approved or if we need additional information.',
      },
      {
        question: 'Can I update my business information after registration?',
        answer:
          'Yes, you can update your business information at any time through your account settings. Some changes, like updating your tax ID, may require verification from our team.',
      },
    ],
  },
  {
    id: 'ordering',
    title: 'Ordering',
    icon: ShoppingCartIcon,
    description: 'Information about placing and managing orders',
    items: [
      {
        question: 'Is there a minimum order requirement?',
        answer:
          'Yes, our minimum order value is $200 for your first order. Subsequent orders have a minimum of $100. Some brands may have their own minimum requirements which will be displayed on their product pages.',
      },
      {
        question: 'What payment methods do you accept?',
        answer:
          'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, and bank transfers for orders over $1,000. Net-30 terms are available for qualified accounts after 3 successful orders.',
      },
      {
        question: 'Can I modify or cancel my order?',
        answer:
          'You can cancel or modify your order within 1 hour of placing it, as long as it hasn\'t been processed. After that, please contact our customer service team and we\'ll do our best to accommodate your request.',
      },
      {
        question: 'How do I track my order?',
        answer:
          'Once your order ships, you\'ll receive a confirmation email with tracking information. You can also view your order status and tracking details in your account under "My Orders".',
      },
      {
        question: 'Do you offer pre-orders for new products?',
        answer:
          'Yes, we occasionally offer pre-orders for highly anticipated product launches. Pre-order items are clearly marked and will include an estimated shipping date.',
      },
    ],
  },
  {
    id: 'shipping',
    title: 'Shipping & Delivery',
    icon: TruckIcon,
    description: 'Shipping options, times, and delivery information',
    items: [
      {
        question: 'What are your shipping options?',
        answer:
          'We offer Standard Shipping (5-7 business days), Express Shipping (2-3 business days), and Overnight Shipping. Free standard shipping is available on orders over $500.',
      },
      {
        question: 'Do you ship internationally?',
        answer:
          'Currently, we ship within the United States and Canada. International shipping to other countries is coming soon. Please contact us for special international requests.',
      },
      {
        question: 'How are shipping costs calculated?',
        answer:
          'Shipping costs are calculated based on the weight of your order and your delivery location. You\'ll see the exact shipping cost at checkout before completing your purchase.',
      },
      {
        question: 'What if my package is damaged during shipping?',
        answer:
          'If your package arrives damaged, please take photos and contact us within 48 hours of delivery. We\'ll arrange a replacement or refund for any damaged items.',
      },
      {
        question: 'Can I change my shipping address after placing an order?',
        answer:
          'You can update your shipping address within 1 hour of placing your order. After that, please contact customer service immediately, and we\'ll try to update it if the order hasn\'t shipped yet.',
      },
    ],
  },
  {
    id: 'products',
    title: 'Products',
    icon: SparklesIcon,
    description: 'Questions about our product offerings and authenticity',
    items: [
      {
        question: 'Are all products authentic?',
        answer:
          'Yes, absolutely. We source all products directly from authorized distributors and brand partners. Every product we sell is 100% authentic with full manufacturer warranties.',
      },
      {
        question: 'Do you offer product samples?',
        answer:
          'Many of our brands offer sample programs. Look for the "Samples Available" badge on product pages. Samples can be added to qualifying orders or purchased separately.',
      },
      {
        question: 'How do I know when out-of-stock items will be available?',
        answer:
          'You can click "Notify Me" on any out-of-stock product page to receive an email alert when it\'s back in stock. We also display estimated restock dates when available.',
      },
      {
        question: 'Do products have expiration dates?',
        answer:
          'All products we ship have at least 12 months of shelf life remaining. Expiration dates are printed on the product packaging. We maintain strict inventory rotation to ensure freshness.',
      },
      {
        question: 'Can I request specific products or brands?',
        answer:
          'Yes! We\'re always looking to expand our catalog. Use the "Request a Product" form in your account or contact our team with your suggestions.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns & Refunds',
    icon: ArrowPathIcon,
    description: 'Our return policy and refund process',
    items: [
      {
        question: 'What is your return policy?',
        answer:
          'We accept returns of unopened, unused products in their original packaging within 30 days of delivery. Opened or used products cannot be returned due to health and safety regulations.',
      },
      {
        question: 'How do I initiate a return?',
        answer:
          'To start a return, go to "My Orders" in your account, select the order, and click "Request Return". You\'ll receive a prepaid shipping label via email within 24 hours.',
      },
      {
        question: 'How long do refunds take to process?',
        answer:
          'Once we receive your return, refunds are processed within 3-5 business days. The refund will be credited to your original payment method.',
      },
      {
        question: 'What if I received the wrong item?',
        answer:
          'If you received an incorrect item, please contact us immediately. We\'ll send the correct item right away and provide a prepaid label to return the wrong item at no cost to you.',
      },
      {
        question: 'Are there any items that cannot be returned?',
        answer:
          'For hygiene reasons, we cannot accept returns on opened cosmetics, skincare, or any product that has been used. Clearance and final sale items are also non-returnable.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing & Discounts',
    icon: CurrencyDollarIcon,
    description: 'Information about wholesale pricing and volume discounts',
    items: [
      {
        question: 'How does wholesale pricing work?',
        answer:
          'As an approved wholesale customer, you\'ll see special wholesale prices on all products. These prices are typically 30-50% below retail, depending on the brand and product category.',
      },
      {
        question: 'Do you offer volume discounts?',
        answer:
          'Yes! We offer tiered volume discounts. Orders over $1,000 receive an additional 5% off, orders over $2,500 receive 8% off, and orders over $5,000 receive 12% off.',
      },
      {
        question: 'Are there special promotions for new customers?',
        answer:
          'New approved accounts receive 10% off their first order with code WELCOME10. We also run monthly promotions and flash sales exclusively for wholesale members.',
      },
      {
        question: 'Do prices include tax?',
        answer:
          'Prices displayed are before tax. If you have a valid resale certificate on file, you won\'t be charged sales tax. Upload your certificate in your account settings.',
      },
      {
        question: 'Can I negotiate pricing for large orders?',
        answer:
          'For orders over $10,000, please contact our sales team for custom pricing. We\'re happy to work with you on bulk orders and long-term partnerships.',
      },
    ],
  },
];

function FAQAccordion({ item, isOpen, onToggle }: { item: FAQItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full py-4 text-left hover:text-primary-600 transition-colors"
      >
        <span className="font-medium text-secondary-800 pr-4">{item.question}</span>
        <ChevronDownIcon
          className={cn(
            'w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180 text-primary-500'
          )}
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-200',
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        )}
      >
        <p className="text-gray-600 leading-relaxed">{item.answer}</p>
      </div>
    </div>
  );
}

function FAQCategorySection({ category }: { category: FAQCategory }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const Icon = category.icon;

  return (
    <div id={category.id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-secondary-800">{category.title}</h2>
          <p className="text-sm text-gray-500">{category.description}</p>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        {category.items.map((item, index) => (
          <FAQAccordion
            key={index}
            item={item}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <QuestionMarkCircleIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto">
            Find answers to common questions about our wholesale platform, ordering process,
            shipping, and more.
          </p>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide">
            {faqCategories.map((category) => {
              const Icon = category.icon;
              return (
                <a
                  key={category.id}
                  href={`#${category.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                >
                  <Icon className="w-4 h-4" />
                  {category.title}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-12">
          {faqCategories.map((category) => (
            <FAQCategorySection key={category.id} category={category} />
          ))}
        </div>

        {/* Contact Section */}
        <div className="max-w-3xl mx-auto mt-16">
          <div className="bg-gradient-to-br from-secondary-800 to-secondary-900 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-3">Still have questions?</h2>
            <p className="text-gray-300 mb-6">
              Can&apos;t find the answer you&apos;re looking for? Our team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-secondary-900 font-semibold rounded-lg transition-colors"
              >
                Contact Support
              </Link>
              <a
                href="mailto:support@femmelux.com"
                className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 hover:bg-white/10 text-white font-medium rounded-lg transition-colors"
              >
                support@femmelux.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
