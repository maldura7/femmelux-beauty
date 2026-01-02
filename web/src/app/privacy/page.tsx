import Link from 'next/link';
import { ShieldCheckIcon } from '@heroicons/react/24/outline';

export const metadata = {
  title: 'Privacy Policy',
  description: 'FemmeLux Beauty privacy policy - how we collect, use, and protect your information.',
};

const sections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    content: `FemmeLux Beauty ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our wholesale platform and use our services.

Please read this Privacy Policy carefully. By accessing or using our platform, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the platform.

We reserve the right to make changes to this Privacy Policy at any time. We will alert you about any changes by updating the "Last Updated" date of this Privacy Policy. You are encouraged to periodically review this Privacy Policy to stay informed of updates.`,
  },
  {
    id: 'information-collected',
    title: '2. Information We Collect',
    content: `We collect information in several ways when you use our platform:

**Personal Information You Provide**
When you register for an account, place an order, or contact us, you may provide:
• Name and contact information (email, phone number, address)
• Business information (company name, tax ID, business license)
• Payment information (credit card details, billing address)
• Account credentials (username, password)
• Communication preferences

**Information Automatically Collected**
When you access our platform, we automatically collect:
• Device information (IP address, browser type, operating system)
• Usage data (pages visited, time spent, click patterns)
• Location data (based on IP address)
• Cookies and similar tracking technologies

**Information from Third Parties**
We may receive information from:
• Payment processors (transaction verification)
• Business verification services
• Marketing partners (with your consent)
• Social media platforms (if you connect your accounts)`,
  },
  {
    id: 'use-of-information',
    title: '3. How We Use Your Information',
    content: `We use the information we collect for various purposes, including:

**To Provide Our Services**
• Process and fulfill your orders
• Manage your account and preferences
• Verify your business credentials
• Communicate with you about orders and services
• Provide customer support

**To Improve Our Platform**
• Analyze usage patterns and trends
• Develop new features and services
• Personalize your experience
• Conduct research and analytics

**For Marketing & Communications**
• Send promotional emails and newsletters (with your consent)
• Display relevant advertisements
• Notify you about new products and special offers
• Conduct surveys and collect feedback

**For Legal & Security Purposes**
• Comply with legal obligations
• Enforce our terms and policies
• Prevent fraud and unauthorized access
• Protect our rights and property`,
  },
  {
    id: 'information-sharing',
    title: '4. How We Share Your Information',
    content: `We may share your information in the following circumstances:

**Service Providers**
We share information with third-party vendors who perform services on our behalf, including:
• Payment processors
• Shipping carriers
• Email service providers
• Analytics providers
• Cloud hosting services

These providers are contractually obligated to protect your information and use it only for the services they provide to us.

**Brand Partners**
When you purchase products from specific brands, we may share your order information with those brands to fulfill your order and provide customer service.

**Business Transfers**
If we are involved in a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.

**Legal Requirements**
We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., court orders, subpoenas).

**With Your Consent**
We may share your information for other purposes with your explicit consent.`,
  },
  {
    id: 'cookies',
    title: '5. Cookies & Tracking Technologies',
    content: `We use cookies and similar tracking technologies to collect and store information about your use of our platform.

**Types of Cookies We Use**

• **Essential Cookies**: Required for the platform to function properly. These enable core features like user authentication, shopping cart functionality, and security.

• **Analytics Cookies**: Help us understand how visitors interact with our platform. We use this data to improve our services and user experience.

• **Functional Cookies**: Remember your preferences and settings to provide a more personalized experience.

• **Marketing Cookies**: Used to deliver relevant advertisements and track the effectiveness of our marketing campaigns.

**Managing Cookies**
Most web browsers allow you to control cookies through their settings. You can:
• Block all cookies
• Delete existing cookies
• Allow cookies from specific websites
• Be notified when a cookie is set

Note that disabling certain cookies may affect the functionality of our platform.

**Do Not Track**
Some browsers include a "Do Not Track" feature. Our platform does not currently respond to "Do Not Track" signals.`,
  },
  {
    id: 'data-security',
    title: '6. Data Security',
    content: `We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

**Security Measures Include**
• Encryption of data in transit (SSL/TLS)
• Encryption of sensitive data at rest
• Regular security assessments and audits
• Access controls and authentication requirements
• Employee training on data protection
• Incident response procedures

**Payment Security**
All payment transactions are processed through PCI-DSS compliant payment processors. We do not store complete credit card numbers on our servers.

**Your Responsibilities**
You are responsible for:
• Maintaining the confidentiality of your account credentials
• Using strong, unique passwords
• Logging out after using shared devices
• Reporting any suspected unauthorized access

While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    id: 'data-retention',
    title: '7. Data Retention',
    content: `We retain your personal information for as long as necessary to fulfill the purposes for which it was collected, including:

• **Account Information**: Retained while your account is active and for a reasonable period afterward for legal and business purposes.

• **Transaction Records**: Retained for at least 7 years to comply with tax and accounting requirements.

• **Marketing Data**: Retained until you opt out or request deletion.

• **Analytics Data**: Generally retained in aggregated, anonymized form indefinitely.

When information is no longer needed, we securely delete or anonymize it in accordance with our data retention policies and applicable law.`,
  },
  {
    id: 'your-rights',
    title: '8. Your Privacy Rights',
    content: `Depending on your location, you may have certain rights regarding your personal information:

**Access & Portability**
You have the right to request a copy of the personal information we hold about you in a portable format.

**Correction**
You can request that we correct any inaccurate or incomplete personal information.

**Deletion**
You may request that we delete your personal information, subject to certain exceptions (e.g., legal obligations).

**Opt-Out**
You can opt out of:
• Marketing communications (via unsubscribe links or account settings)
• Sale of personal information (for California residents)
• Targeted advertising

**Restriction**
You may request that we restrict the processing of your personal information in certain circumstances.

**Objection**
You have the right to object to processing of your personal information for certain purposes.

**To Exercise Your Rights**
Contact us at privacy@femmelux.com or through your account settings. We will respond to your request within 30 days.`,
  },
  {
    id: 'california',
    title: '9. California Privacy Rights (CCPA)',
    content: `If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

**Right to Know**
You can request information about the categories and specific pieces of personal information we have collected, the sources of that information, our business purposes for collecting it, and the categories of third parties with whom we share it.

**Right to Delete**
You can request deletion of your personal information, with certain exceptions.

**Right to Opt-Out**
You have the right to opt out of the "sale" of your personal information. While we do not sell personal information in the traditional sense, some data sharing for advertising purposes may constitute a "sale" under CCPA.

**Right to Non-Discrimination**
We will not discriminate against you for exercising your CCPA rights.

**Authorized Agents**
You may designate an authorized agent to make requests on your behalf.

**Contact for CCPA Requests**
Email: privacy@femmelux.com
Phone: 1-800-FEMMELUX`,
  },
  {
    id: 'international',
    title: '10. International Data Transfers',
    content: `Our platform is operated in the United States. If you are accessing our platform from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States.

**Data Transfer Mechanisms**
When we transfer personal information internationally, we implement appropriate safeguards, including:
• Standard contractual clauses approved by relevant authorities
• Certification under recognized frameworks
• Your explicit consent where required

**EU/EEA Residents**
If you are located in the European Union or European Economic Area, we process your data in accordance with the General Data Protection Regulation (GDPR). You have additional rights including the right to lodge a complaint with your local supervisory authority.`,
  },
  {
    id: 'children',
    title: '11. Children\'s Privacy',
    content: `Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children under 18.

If we learn that we have collected personal information from a child under 18, we will take steps to delete that information as quickly as possible.

If you believe we may have collected information from a child under 18, please contact us immediately at privacy@femmelux.com.`,
  },
  {
    id: 'third-party',
    title: '12. Third-Party Links & Services',
    content: `Our platform may contain links to third-party websites, services, or applications that are not operated by us. This Privacy Policy does not apply to third-party services.

We are not responsible for the privacy practices of third parties. We encourage you to review the privacy policies of any third-party services you access through our platform.

**Third-Party Services We Use**
• Google Analytics (analytics)
• Stripe (payment processing)
• Various shipping carriers
• Email marketing platforms

Each of these services has its own privacy policy governing the use of your information.`,
  },
  {
    id: 'contact',
    title: '13. Contact Us',
    content: `If you have questions about this Privacy Policy or our privacy practices, please contact us:

**FemmeLux Beauty**
Privacy Team
123 Beauty Boulevard
Wilmington, DE 19801

**Email**: privacy@femmelux.com
**Phone**: 1-800-FEMMELUX
**Online**: Use our Contact form at femmelux.com/contact

**Data Protection Officer**
For EU/EEA residents, our Data Protection Officer can be reached at dpo@femmelux.com.

We will respond to all privacy-related inquiries within 30 days.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheckIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-primary-200 mt-4">Last updated: January 1, 2025</p>
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
              By using our platform, you consent to the collection and use of your information as
              described in this Privacy Policy.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/terms" className="text-primary-600 hover:text-primary-700 font-medium">
                Terms of Service
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
