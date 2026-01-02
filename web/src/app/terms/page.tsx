import Link from 'next/link';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Terms of Service',
  description: 'FemmeLux Beauty wholesale platform terms of service and conditions of use.',
};

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    content: `By accessing or using the FemmeLux Beauty wholesale platform ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you may not access or use the Platform.

These Terms apply to all users of the Platform, including wholesale customers, vendors, and visitors. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of the Platform after any modifications indicates your acceptance of the modified Terms.`,
  },
  {
    id: 'eligibility',
    title: '2. Eligibility & Account Registration',
    content: `To use our wholesale services, you must:

• Be at least 18 years of age
• Have a valid business license and tax identification number
• Operate a legitimate beauty retail, salon, spa, or related business
• Provide accurate and complete registration information
• Maintain the security of your account credentials

You are responsible for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account or any other breach of security. We reserve the right to refuse service, terminate accounts, or cancel orders at our discretion.`,
  },
  {
    id: 'wholesale',
    title: '3. Wholesale Account Terms',
    content: `Wholesale accounts are subject to the following conditions:

**Application & Approval**: All wholesale applications are subject to review and approval. We may request additional documentation to verify your business credentials. Approval is at our sole discretion.

**Minimum Orders**: Minimum order requirements apply and are subject to change. Current minimums are displayed during checkout and may vary by brand or product category.

**Pricing**: Wholesale prices are confidential and intended only for approved wholesale customers. You agree not to share wholesale pricing information with third parties. Prices are subject to change without notice.

**Resale Only**: Products purchased through the wholesale platform are for resale purposes only. Personal use purchases should be made through retail channels.`,
  },
  {
    id: 'orders',
    title: '4. Orders & Payment',
    content: `**Order Acceptance**: All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including limitations on quantities, inaccuracies in product or pricing information, or problems with payment.

**Pricing & Errors**: While we strive to ensure accurate pricing, errors may occur. If a product is listed at an incorrect price, we reserve the right to cancel orders placed at that price and notify you of the error.

**Payment Terms**: Payment is due at the time of order unless you have been approved for net payment terms. We accept major credit cards, PayPal, and bank transfers for qualifying orders.

**Taxes**: You are responsible for all applicable taxes. If you have a valid resale certificate on file, sales tax will not be charged on qualifying orders.

**Order Cancellation**: Orders may be cancelled within one hour of placement if they have not entered processing. After this period, cancellation requests are subject to approval.`,
  },
  {
    id: 'shipping',
    title: '5. Shipping & Delivery',
    content: `**Shipping Methods**: We offer various shipping options with different delivery timeframes and costs. Shipping costs are calculated based on order weight, dimensions, and destination.

**Risk of Loss**: All items purchased from FemmeLux Beauty are shipped FOB shipping point. This means the risk of loss and title for items pass to you upon delivery to the carrier.

**Delivery**: We are not responsible for delays caused by carriers, weather, customs, or other circumstances beyond our control. Delivery estimates are not guaranteed.

**International Shipping**: International orders may be subject to import duties, taxes, and customs fees, which are the responsibility of the buyer.

**Address Accuracy**: You are responsible for providing accurate shipping information. We are not responsible for orders shipped to incorrect addresses provided by you.`,
  },
  {
    id: 'returns',
    title: '6. Returns & Refunds',
    content: `**Return Policy**: Unopened products in original packaging may be returned within 30 days of delivery for a refund or credit. Opened or used products cannot be returned due to health and safety regulations.

**Return Authorization**: All returns require prior authorization. Contact customer service to initiate a return and obtain a Return Merchandise Authorization (RMA) number.

**Condition**: Returned items must be in original, unopened, and resalable condition with all packaging and materials intact.

**Refund Processing**: Refunds will be processed within 5-7 business days after we receive and inspect the returned items. Refunds will be credited to the original payment method.

**Non-Returnable Items**: Clearance items, final sale items, opened cosmetics, and products marked as non-returnable cannot be returned.

**Damaged or Defective Items**: If you receive damaged or defective items, please contact us within 48 hours of delivery with photos of the damage. We will arrange replacement or refund at no additional cost.`,
  },
  {
    id: 'products',
    title: '7. Products & Intellectual Property',
    content: `**Product Authenticity**: All products sold through FemmeLux Beauty are 100% authentic and sourced from authorized distributors and brand partners.

**Product Information**: While we strive to provide accurate product descriptions and images, we do not warrant that product descriptions or other content is accurate, complete, reliable, or error-free.

**Trademarks**: All brand names, logos, and trademarks displayed on the Platform are the property of their respective owners. Use of these marks is subject to the trademark owner's permission.

**Your Content**: By submitting reviews, feedback, or other content to the Platform, you grant us a non-exclusive, royalty-free, perpetual license to use, modify, and display such content.`,
  },
  {
    id: 'conduct',
    title: '8. Prohibited Conduct',
    content: `You agree not to:

• Use the Platform for any unlawful purpose or in violation of these Terms
• Share your account credentials with third parties
• Disclose confidential wholesale pricing to unauthorized parties
• Resell products in violation of brand distribution policies
• Submit false or misleading information
• Attempt to interfere with the proper functioning of the Platform
• Use automated systems to access the Platform without our permission
• Engage in any activity that could damage, disable, or impair the Platform
• Attempt to gain unauthorized access to any portion of the Platform
• Use the Platform to transmit spam, viruses, or other harmful content`,
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW, FEMMELUX BEAUTY AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO YOUR USE OF THE PLATFORM.

OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR THE PLATFORM SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.

SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF LIABILITY FOR CONSEQUENTIAL DAMAGES, SO THE ABOVE LIMITATION MAY NOT APPLY TO YOU.`,
  },
  {
    id: 'indemnification',
    title: '10. Indemnification',
    content: `You agree to indemnify, defend, and hold harmless FemmeLux Beauty, its affiliates, officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to:

• Your use of the Platform
• Your violation of these Terms
• Your violation of any rights of a third party
• Your products, services, or business practices
• Any content you submit to the Platform`,
  },
  {
    id: 'termination',
    title: '11. Termination',
    content: `We may terminate or suspend your account and access to the Platform at any time, with or without cause, and with or without notice. Upon termination:

• Your right to use the Platform will immediately cease
• Any pending orders may be cancelled
• You remain liable for all charges incurred prior to termination
• Provisions of these Terms that by their nature should survive termination will survive

You may terminate your account at any time by contacting customer service. Account termination does not relieve you of any obligations incurred prior to termination.`,
  },
  {
    id: 'disputes',
    title: '12. Dispute Resolution',
    content: `**Governing Law**: These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, without regard to its conflict of law provisions.

**Arbitration**: Any dispute arising out of or relating to these Terms or the Platform shall be resolved by binding arbitration in accordance with the American Arbitration Association's Commercial Arbitration Rules. The arbitration shall take place in Wilmington, Delaware.

**Class Action Waiver**: You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.

**Time Limitation**: Any claim arising out of or related to these Terms must be filed within one (1) year after such claim arose.`,
  },
  {
    id: 'general',
    title: '13. General Provisions',
    content: `**Entire Agreement**: These Terms, together with our Privacy Policy and any other policies referenced herein, constitute the entire agreement between you and FemmeLux Beauty regarding the Platform.

**Severability**: If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.

**Waiver**: Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision.

**Assignment**: You may not assign or transfer these Terms without our prior written consent. We may assign or transfer these Terms without restriction.

**Contact Information**: For questions about these Terms, please contact us at legal@femmelux.com or through our Contact page.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-secondary-800 to-secondary-900 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <DocumentTextIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Please read these terms carefully before using the FemmeLux Beauty wholesale platform.
          </p>
          <p className="text-sm text-gray-400 mt-4">Last updated: January 1, 2025</p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Table of Contents
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors"
                >
                  {section.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-10">
            <div className="prose prose-gray max-w-none">
              {sections.map((section, index) => (
                <section key={section.id} id={section.id} className="scroll-mt-24">
                  {index > 0 && <hr className="my-8 border-gray-200" />}
                  <h2 className="text-xl font-semibold text-secondary-800 mb-4">{section.title}</h2>
                  <div className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 mb-4">
              By using our platform, you agree to these Terms of Service.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/privacy"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Privacy Policy
              </Link>
              <span className="text-gray-300">|</span>
              <Link href="/faq" className="text-primary-600 hover:text-primary-700 font-medium">
                FAQ
              </Link>
              <span className="text-gray-300">|</span>
              <Link
                href="/contact"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
