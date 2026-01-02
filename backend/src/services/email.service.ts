import nodemailer from 'nodemailer';

// ============================================
// EMAIL SERVICE
// ============================================

// Email configuration (in production, use environment variables)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

// Admin email addresses for notifications
const ADMIN_EMAILS = process.env.ADMIN_EMAILS?.split(',') || ['admin@femmelux.com'];
const FROM_EMAIL = process.env.FROM_EMAIL || 'FemmeLux Beauty <noreply@femmelux.com>';
const SITE_URL = process.env.SITE_URL || 'http://localhost:3000';
const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3001';

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
}

function generateEmailHeader(title: string): string {
  return `
    <div style="background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">FemmeLux Beauty</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${title}</p>
    </div>
  `;
}

function generateEmailFooter(): string {
  return `
    <div style="background: #f9fafb; padding: 30px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
        Need help? Contact us at <a href="mailto:support@femmelux.com" style="color: #ec4899;">support@femmelux.com</a>
      </p>
      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
        © ${new Date().getFullYear()} FemmeLux Beauty. All rights reserved.
      </p>
    </div>
  `;
}

function wrapEmailContent(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        ${content}
      </div>
    </body>
    </html>
  `;
}

// ============================================
// EMAIL SERVICE CLASS
// ============================================

class EmailService {
  private isConfigured: boolean;

  constructor() {
    this.isConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
    if (!this.isConfigured) {
      console.warn('⚠️ Email service not configured. Emails will be logged to console.');
    }
  }

  /**
   * Send an email
   */
  private async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.isConfigured) {
      console.log('\n📧 EMAIL (not sent - SMTP not configured):');
      console.log(`   To: ${to}`);
      console.log(`   Subject: ${subject}`);
      console.log('   Content: [HTML content]\n');
      return;
    }

    try {
      await transporter.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
      console.log(`✅ Email sent to ${to}: ${subject}`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send application submitted confirmation email
   */
  async sendApplicationSubmittedEmail(user: any, application: any): Promise<void> {
    const subject = 'Application Received - Under Review';

    const html = wrapEmailContent(`
      ${generateEmailHeader('Application Received')}
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Thank You for Your Application!</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Dear ${user.firstName},
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          We have received your ${application.applicationType.toLowerCase()} application and our team is reviewing it.
          You will receive an email notification once the review is complete.
        </p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Application Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Application ID:</td>
              <td style="color: #1f2937; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${application.id.slice(0, 8)}...</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Type:</td>
              <td style="color: #1f2937; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${application.applicationType}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Business Name:</td>
              <td style="color: #1f2937; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${application.businessName}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0;">Submitted:</td>
              <td style="color: #1f2937; padding: 8px 0; font-weight: 500;">${formatDate(new Date(application.submittedAt))}</td>
            </tr>
          </table>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>What happens next?</strong><br>
            Our team typically reviews applications within 2-3 business days.
            We'll notify you via email once a decision has been made.
          </p>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0 0;">
          Thank you for choosing FemmeLux Beauty!
        </p>
      </div>
      ${generateEmailFooter()}
    `);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send application approved email
   */
  async sendApplicationApprovedEmail(user: any, application: any): Promise<void> {
    const subject = 'Application Approved - Welcome to FemmeLux Beauty!';

    const html = wrapEmailContent(`
      ${generateEmailHeader('Congratulations!')}
      <div style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: #d1fae5; border-radius: 50%; padding: 15px;">
            <span style="font-size: 32px;">✓</span>
          </div>
        </div>

        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Your Application Has Been Approved!</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Dear ${user.firstName},
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Great news! Your ${application.applicationType.toLowerCase()} application for <strong>${application.businessName}</strong>
          has been approved. You now have full access to our wholesale platform.
        </p>

        <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #065f46; margin: 0 0 15px 0; font-size: 16px;">🎉 You can now:</h3>
          <ul style="color: #047857; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>View wholesale prices on all products</li>
            <li>Place orders at exclusive wholesale rates</li>
            <li>Access your account dashboard</li>
            <li>Track your orders and order history</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Log In to Your Account
          </a>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0 0;">
          Welcome to the FemmeLux Beauty family!
        </p>
      </div>
      ${generateEmailFooter()}
    `);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send application rejected email
   */
  async sendApplicationRejectedEmail(user: any, application: any, reason: string): Promise<void> {
    const subject = 'Application Status Update';

    const html = wrapEmailContent(`
      ${generateEmailHeader('Application Update')}
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Application Status Update</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Dear ${user.firstName},
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Thank you for your interest in becoming a ${application.applicationType.toLowerCase()} with FemmeLux Beauty.
          After careful review, we regret to inform you that we are unable to approve your application at this time.
        </p>

        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #991b1b; margin: 0; font-size: 14px;">
            <strong>Reason:</strong><br>
            ${reason}
          </p>
        </div>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">What can you do?</h3>
          <ul style="color: #4b5563; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>Review the reason above and address any concerns</li>
            <li>Update your business documentation if needed</li>
            <li>Submit a new application when you're ready</li>
            <li>Contact our support team if you have questions</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/apply" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Submit New Application
          </a>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0 0;">
          We appreciate your understanding and hope to welcome you in the future.
        </p>
      </div>
      ${generateEmailFooter()}
    `);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send new application notification to admins
   */
  async sendNewApplicationNotificationToAdmin(application: any, user: any): Promise<void> {
    const subject = `New Business Application - Action Required`;

    const html = wrapEmailContent(`
      ${generateEmailHeader('New Application')}
      <div style="padding: 40px 30px;">
        <div style="background: #fef3c7; border-radius: 8px; padding: 15px 20px; margin-bottom: 25px;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>⚠️ Action Required:</strong> A new business application needs your review.
          </p>
        </div>

        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">New ${application.applicationType} Application</h2>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Applicant Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb; width: 40%;">Name:</td>
              <td style="color: #1f2937; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${user.firstName} ${user.lastName}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Email:</td>
              <td style="color: #1f2937; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${user.email}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Business Name:</td>
              <td style="color: #1f2937; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${application.businessName}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Business Type:</td>
              <td style="color: #1f2937; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${application.businessType}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Application Type:</td>
              <td style="color: #1f2937; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">
                <span style="display: inline-block; background: ${application.applicationType === 'VENDOR' ? '#dbeafe' : '#fce7f3'}; color: ${application.applicationType === 'VENDOR' ? '#1e40af' : '#9d174d'}; padding: 4px 12px; border-radius: 9999px; font-size: 12px;">
                  ${application.applicationType}
                </span>
              </td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0;">Submitted:</td>
              <td style="color: #1f2937; padding: 8px 0; font-weight: 500;">${formatDate(new Date(application.submittedAt))}</td>
            </tr>
          </table>
        </div>

        ${application.applicationType === 'VENDOR' ? `
        <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #0369a1; margin: 0 0 15px 0; font-size: 16px;">Vendor Information:</h3>
          <p style="color: #0c4a6e; margin: 0;">
            <strong>Brand Name:</strong> ${application.brandName || 'Not provided'}<br>
            <strong>Product Categories:</strong> ${application.productCategories?.join(', ') || 'Not specified'}
          </p>
        </div>
        ` : ''}

        <div style="text-align: center; margin: 30px 0;">
          <a href="${ADMIN_URL}/dashboard/applications/${application.id}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Review Application
          </a>
        </div>
      </div>
      ${generateEmailFooter()}
    `);

    // Send to all admin emails
    for (const email of ADMIN_EMAILS) {
      await this.sendEmail(email.trim(), subject, html);
    }
  }

  /**
   * Send vendor onboarding email
   */
  async sendVendorOnboardingEmail(user: any, brand: any): Promise<void> {
    const subject = 'Welcome to FemmeLux Beauty - Vendor Onboarding';

    const html = wrapEmailContent(`
      ${generateEmailHeader('Welcome, Vendor!')}
      <div style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: #dbeafe; border-radius: 50%; padding: 15px;">
            <span style="font-size: 32px;">🏪</span>
          </div>
        </div>

        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Welcome to the Vendor Program!</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Dear ${user.firstName},
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Congratulations! Your brand <strong>${brand.name}</strong> is now part of the FemmeLux Beauty family.
          We're excited to partner with you and help grow your business.
        </p>

        <div style="background: #f0f9ff; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #0369a1; margin: 0 0 15px 0; font-size: 16px;">🚀 Getting Started:</h3>
          <ol style="color: #0c4a6e; margin: 0; padding-left: 20px; line-height: 2;">
            <li><strong>Access Your Dashboard:</strong> Log in to manage your products</li>
            <li><strong>Add Products:</strong> Upload your product catalog</li>
            <li><strong>Set Pricing:</strong> Configure retail and wholesale prices</li>
            <li><strong>Upload Images:</strong> Add high-quality product images</li>
            <li><strong>Go Live:</strong> Activate your products for customers</li>
          </ol>
        </div>

        <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">Your Brand Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #6b7280; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">Brand Name:</td>
              <td style="color: #1f2937; padding: 8px 0; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${brand.name}</td>
            </tr>
            <tr>
              <td style="color: #6b7280; padding: 8px 0;">Brand URL:</td>
              <td style="color: #1f2937; padding: 8px 0; font-weight: 500;">${SITE_URL}/brands/${brand.slug}</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/vendor/dashboard" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Go to Vendor Dashboard
          </a>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0 0;">
          If you need any assistance, our vendor support team is here to help!
        </p>
      </div>
      ${generateEmailFooter()}
    `);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send account suspended email
   */
  async sendAccountSuspendedEmail(user: any, reason: string): Promise<void> {
    const subject = 'Account Suspended - FemmeLux Beauty';

    const html = wrapEmailContent(`
      ${generateEmailHeader('Account Notice')}
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Account Suspended</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Dear ${user.firstName},
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Your FemmeLux Beauty account has been suspended. During this time, you will not be able to access your account or place orders.
        </p>

        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #991b1b; margin: 0; font-size: 14px;">
            <strong>Reason:</strong><br>
            ${reason}
          </p>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0;">
          If you believe this was done in error or would like to discuss this decision, please contact our support team.
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="mailto:support@femmelux.com" style="display: inline-block; background: #6b7280; color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Contact Support
          </a>
        </div>
      </div>
      ${generateEmailFooter()}
    `);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send account reactivated email
   */
  async sendAccountReactivatedEmail(user: any): Promise<void> {
    const subject = 'Account Reactivated - FemmeLux Beauty';

    const html = wrapEmailContent(`
      ${generateEmailHeader('Good News!')}
      <div style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: #d1fae5; border-radius: 50%; padding: 15px;">
            <span style="font-size: 32px;">✓</span>
          </div>
        </div>

        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Your Account Has Been Reactivated!</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Dear ${user.firstName},
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Great news! Your FemmeLux Beauty account has been reactivated. You can now log in and continue using our platform as before.
        </p>

        <div style="background: #ecfdf5; border-radius: 8px; padding: 20px; margin: 25px 0;">
          <p style="color: #047857; margin: 0; text-align: center;">
            ✓ Full account access restored<br>
            ✓ Order placement enabled<br>
            ✓ All features available
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Log In Now
          </a>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0 0;">
          Thank you for your patience. We look forward to serving you!
        </p>
      </div>
      ${generateEmailFooter()}
    `);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user: any, resetToken: string): Promise<void> {
    const subject = 'Reset Your Password - FemmeLux Beauty';
    const resetLink = `${SITE_URL}/reset-password?token=${resetToken}`;

    const html = wrapEmailContent(`
      ${generateEmailHeader('Password Reset')}
      <div style="padding: 40px 30px;">
        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Dear ${user.firstName},
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          We received a request to reset your password. Click the button below to create a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>

        <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
        </p>

        <div style="background: #f9fafb; border-radius: 8px; padding: 15px; margin-top: 25px;">
          <p style="color: #6b7280; font-size: 12px; margin: 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="color: #4b5563; word-break: break-all;">${resetLink}</span>
          </p>
        </div>
      </div>
      ${generateEmailFooter()}
    `);

    await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send welcome email after registration
   */
  async sendWelcomeEmail(user: any): Promise<void> {
    const subject = 'Welcome to FemmeLux Beauty!';

    const html = wrapEmailContent(`
      ${generateEmailHeader('Welcome!')}
      <div style="padding: 40px 30px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <div style="display: inline-block; background: #fce7f3; border-radius: 50%; padding: 15px;">
            <span style="font-size: 32px;">💄</span>
          </div>
        </div>

        <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; text-align: center;">Welcome to FemmeLux Beauty!</h2>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Dear ${user.firstName},
        </p>

        <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
          Thank you for creating an account with FemmeLux Beauty. We're thrilled to have you join our community of beauty professionals!
        </p>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
          <p style="color: #92400e; margin: 0; font-size: 14px;">
            <strong>Next Step:</strong> To access wholesale prices and place orders, please complete your business application.
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${SITE_URL}/apply" style="display: inline-block; background: linear-gradient(135deg, #ec4899 0%, #db2777 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Complete Application
          </a>
        </div>

        <p style="color: #4b5563; line-height: 1.6; margin: 20px 0 0 0;">
          If you have any questions, our team is here to help!
        </p>
      </div>
      ${generateEmailFooter()}
    `);

    await this.sendEmail(user.email, subject, html);
  }
}

export const emailService = new EmailService();
