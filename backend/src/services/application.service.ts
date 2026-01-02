import { PrismaClient, ApplicationStatus, ApplicationType, AccountStatus, Prisma } from '@prisma/client';
import { emailService } from './email.service';

const prisma = new PrismaClient();

// ============================================
// TYPES
// ============================================

export interface SubmitApplicationData {
  applicationType: 'CUSTOMER' | 'VENDOR';
  businessName: string;
  businessType: string;
  taxId: string;
  phone: string;
  businessAddress: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country?: string;
  };
  businessWebsite?: string;
  businessYears?: number;
  businessLicense?: string;
  resaleCertificate?: string;
  estimatedMonthlyPurchase?: number;
  howDidYouHear?: string;
  references?: string;
  additionalNotes?: string;
  // Vendor-specific fields
  brandName?: string;
  brandDescription?: string;
  productCategories?: string[];
  vendorMinimumOrder?: number;
  productLineSize?: number;
  // Document uploads
  documents?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  applicationType?: ApplicationType;
  page?: number;
  limit?: number;
  sortBy?: 'submittedAt' | 'reviewedAt';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface PaginatedApplications {
  applications: any[];
  total: number;
  page: number;
  pages: number;
}

// ============================================
// APPLICATION SERVICE CLASS
// ============================================

class ApplicationService {
  /**
   * Submit a new business application
   */
  async submitApplication(userId: string, applicationData: SubmitApplicationData) {
    // 1. Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Check if user is already approved
    if (user.accountStatus === AccountStatus.APPROVED) {
      throw new Error('Your account is already approved');
    }

    // 3. Check if user is suspended
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new Error('Your account is suspended. Please contact support.');
    }

    // 4. Check if user has a pending application
    const pendingApplication = await prisma.businessApplication.findFirst({
      where: {
        userId,
        status: ApplicationStatus.PENDING,
      },
    });

    if (pendingApplication) {
      throw new Error('You already have a pending application. Please wait for it to be reviewed.');
    }

    // 5. Validate vendor-specific fields
    if (applicationData.applicationType === 'VENDOR' && !applicationData.brandName) {
      throw new Error('Brand name is required for vendor applications');
    }

    // Helper to convert empty strings to undefined for optional fields
    const emptyToUndefined = <T>(value: T | string | undefined | null): T | undefined => {
      if (value === '' || value === null || value === undefined) return undefined;
      return value as T;
    };

    // 6. Create application in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the business application
      const application = await tx.businessApplication.create({
        data: {
          userId,
          applicationType: applicationData.applicationType as ApplicationType,
          businessName: applicationData.businessName,
          businessType: applicationData.businessType,
          taxId: applicationData.taxId,
          phone: applicationData.phone,
          businessAddress: applicationData.businessAddress as Prisma.InputJsonValue,
          businessWebsite: emptyToUndefined(applicationData.businessWebsite),
          businessYears: emptyToUndefined(applicationData.businessYears),
          businessLicense: emptyToUndefined(applicationData.businessLicense),
          resaleCertificate: emptyToUndefined(applicationData.resaleCertificate),
          estimatedMonthlyPurchase: emptyToUndefined(applicationData.estimatedMonthlyPurchase),
          howDidYouHear: emptyToUndefined(applicationData.howDidYouHear),
          references: emptyToUndefined(applicationData.references),
          additionalNotes: emptyToUndefined(applicationData.additionalNotes),
          brandName: emptyToUndefined(applicationData.brandName),
          brandDescription: emptyToUndefined(applicationData.brandDescription),
          productCategories: applicationData.productCategories || [],
          vendorMinimumOrder: emptyToUndefined(applicationData.vendorMinimumOrder),
          productLineSize: emptyToUndefined(applicationData.productLineSize),
          documents: applicationData.documents as Prisma.InputJsonValue,
          status: ApplicationStatus.PENDING,
          submittedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update user's account status and business info
      await tx.user.update({
        where: { id: userId },
        data: {
          accountStatus: AccountStatus.PENDING,
          appliedAt: new Date(),
          businessName: applicationData.businessName,
          businessType: applicationData.businessType,
          taxId: applicationData.taxId,
          phone: applicationData.phone,
          businessAddress: applicationData.businessAddress as Prisma.InputJsonValue,
          businessWebsite: emptyToUndefined(applicationData.businessWebsite),
          businessYears: emptyToUndefined(applicationData.businessYears),
          businessLicense: emptyToUndefined(applicationData.businessLicense),
          resaleCertificate: emptyToUndefined(applicationData.resaleCertificate),
          estimatedMonthlyPurchase: emptyToUndefined(applicationData.estimatedMonthlyPurchase),
          howDidYouHear: emptyToUndefined(applicationData.howDidYouHear),
          references: emptyToUndefined(applicationData.references),
          additionalNotes: emptyToUndefined(applicationData.additionalNotes),
        },
      });

      return application;
    });

    // 7. Send confirmation email to applicant
    try {
      await emailService.sendApplicationSubmittedEmail(user, result);
    } catch (error) {
      console.error('Failed to send application confirmation email:', error);
    }

    // 8. Send notification to admins
    try {
      await emailService.sendNewApplicationNotificationToAdmin(result, user);
    } catch (error) {
      console.error('Failed to send admin notification email:', error);
    }

    return result;
  }

  /**
   * Get application by ID
   */
  async getApplicationById(applicationId: string) {
    const application = await prisma.businessApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            accountStatus: true,
            createdAt: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return application;
  }

  /**
   * Get all applications with filters and pagination
   */
  async getAllApplications(filters: ApplicationFilters = {}): Promise<PaginatedApplications> {
    const {
      status,
      applicationType,
      page = 1,
      limit = 20,
      sortBy = 'submittedAt',
      sortOrder = 'desc',
      search,
    } = filters;

    // Build where clause
    const where: Prisma.BusinessApplicationWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (applicationType) {
      where.applicationType = applicationType;
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await prisma.businessApplication.count({ where });

    // Get applications
    const applications = await prisma.businessApplication.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            accountStatus: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      applications,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  /**
   * Get count of pending applications
   */
  async getPendingApplicationsCount(): Promise<number> {
    return prisma.businessApplication.count({
      where: { status: ApplicationStatus.PENDING },
    });
  }

  /**
   * Approve an application
   */
  async approveApplication(applicationId: string, adminId: string, notes?: string) {
    // 1. Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only admin users can approve applications');
    }

    // 2. Get application
    const application = await prisma.businessApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // 3. Validate status
    if (application.status !== ApplicationStatus.PENDING) {
      throw new Error(`Cannot approve application with status: ${application.status}`);
    }

    // 4. Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update application
      const updatedApplication = await tx.businessApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedBy: adminId,
          reviewNotes: notes,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update user
      const updateData: Prisma.UserUpdateInput = {
        accountStatus: AccountStatus.APPROVED,
        approvedAt: new Date(),
        approver: { connect: { id: adminId } },
        // Clear any rejection data
        rejectedAt: null,
        rejecter: { disconnect: true },
        rejectionReason: null,
      };

      // If vendor, set role to VENDOR
      if (application.applicationType === ApplicationType.VENDOR) {
        updateData.role = 'VENDOR';
      }

      await tx.user.update({
        where: { id: application.userId },
        data: updateData,
      });

      // If vendor, create brand
      let brand = null;
      if (application.applicationType === ApplicationType.VENDOR && application.brandName) {
        // Generate slug from brand name
        const slug = application.brandName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Check if slug exists
        const existingBrand = await tx.brand.findUnique({
          where: { slug },
        });

        const finalSlug = existingBrand ? `${slug}-${Date.now()}` : slug;

        brand = await tx.brand.create({
          data: {
            name: application.brandName,
            slug: finalSlug,
            description: application.brandDescription,
            minimumOrder: application.vendorMinimumOrder || 0,
            status: true,
          },
        });

        // Link user to brand
        await tx.user.update({
          where: { id: application.userId },
          data: { brandId: brand.id },
        });
      }

      return { application: updatedApplication, brand };
    });

    // 4. Send approval email
    try {
      await emailService.sendApplicationApprovedEmail(application.user, result.application);
    } catch (error) {
      console.error('Failed to send approval email:', error);
    }

    // 5. If vendor, send onboarding email
    if (result.brand) {
      try {
        await emailService.sendVendorOnboardingEmail(application.user, result.brand);
      } catch (error) {
        console.error('Failed to send vendor onboarding email:', error);
      }
    }

    return result.application;
  }

  /**
   * Reject an application
   */
  async rejectApplication(applicationId: string, adminId: string, reason: string) {
    // 1. Validate reason
    if (!reason || reason.trim().length < 10) {
      throw new Error('Rejection reason must be at least 10 characters');
    }

    // 2. Verify admin user exists
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true },
    });

    if (!adminUser) {
      throw new Error('Admin user not found');
    }

    if (adminUser.role !== 'ADMIN') {
      throw new Error('Only admin users can reject applications');
    }

    // 3. Get application
    const application = await prisma.businessApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // 4. Validate status
    if (application.status !== ApplicationStatus.PENDING) {
      throw new Error(`Cannot reject application with status: ${application.status}`);
    }

    // 5. Update in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update application
      const updatedApplication = await tx.businessApplication.update({
        where: { id: applicationId },
        data: {
          status: ApplicationStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedBy: adminId,
          rejectionReason: reason,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Update user
      await tx.user.update({
        where: { id: application.userId },
        data: {
          accountStatus: AccountStatus.REJECTED,
          rejectedAt: new Date(),
          rejecter: { connect: { id: adminId } },
          rejectionReason: reason,
        },
      });

      return updatedApplication;
    });

    // 5. Send rejection email
    try {
      await emailService.sendApplicationRejectedEmail(application.user, result, reason);
    } catch (error) {
      console.error('Failed to send rejection email:', error);
    }

    return result;
  }

  /**
   * Get applications by user
   */
  async getApplicationsByUser(userId: string) {
    return prisma.businessApplication.findMany({
      where: { userId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });
  }

  /**
   * Resubmit application (for rejected users)
   */
  async resubmitApplication(userId: string, applicationData: SubmitApplicationData) {
    // 1. Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Validate user was rejected
    if (user.accountStatus !== AccountStatus.REJECTED) {
      throw new Error('Only rejected applications can be resubmitted');
    }

    // 3. Submit new application
    return this.submitApplication(userId, applicationData);
  }

  /**
   * Suspend a user
   */
  async suspendUser(userId: string, _adminId: string, reason: string) {
    // 1. Validate reason
    if (!reason || reason.trim().length < 10) {
      throw new Error('Suspension reason must be at least 10 characters');
    }

    // 2. Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 3. Check if already suspended
    if (user.accountStatus === AccountStatus.SUSPENDED) {
      throw new Error('User is already suspended');
    }

    // 4. Cannot suspend admins
    if (user.role === 'ADMIN') {
      throw new Error('Cannot suspend admin users');
    }

    // 5. Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: AccountStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountStatus: true,
        suspendedAt: true,
        suspensionReason: true,
      },
    });

    // 6. Send suspension email
    try {
      await emailService.sendAccountSuspendedEmail(updatedUser, reason);
    } catch (error) {
      console.error('Failed to send suspension email:', error);
    }

    return updatedUser;
  }

  /**
   * Unsuspend a user
   */
  async unsuspendUser(userId: string, _adminId: string) {
    // 1. Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // 2. Check if suspended
    if (user.accountStatus !== AccountStatus.SUSPENDED) {
      throw new Error('User is not suspended');
    }

    // 3. Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: AccountStatus.APPROVED,
        suspendedAt: null,
        suspensionReason: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        accountStatus: true,
      },
    });

    // 4. Send reactivation email
    try {
      await emailService.sendAccountReactivatedEmail(updatedUser);
    } catch (error) {
      console.error('Failed to send reactivation email:', error);
    }

    return updatedUser;
  }

  /**
   * Export applications to CSV
   */
  async exportApplications(filters: ApplicationFilters = {}): Promise<string> {
    const { status, applicationType, search } = filters;

    // Build where clause
    const where: Prisma.BusinessApplicationWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (applicationType) {
      where.applicationType = applicationType;
    }

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get all matching applications
    const applications = await prisma.businessApplication.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    // CSV Header
    const headers = [
      'Application ID',
      'Applicant Name',
      'Email',
      'Business Name',
      'Business Type',
      'Application Type',
      'Status',
      'Submitted Date',
      'Reviewed Date',
      'Reviewer',
      'Tax ID',
      'Phone',
    ];

    // CSV Rows
    const rows = applications.map((app) => [
      app.id,
      `${app.user.firstName} ${app.user.lastName}`,
      app.user.email,
      app.businessName,
      app.businessType,
      app.applicationType,
      app.status,
      app.submittedAt.toISOString(),
      app.reviewedAt?.toISOString() || '',
      app.reviewer ? `${app.reviewer.firstName} ${app.reviewer.lastName}` : '',
      app.taxId,
      app.phone,
    ]);

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV string
    const csvLines = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => escapeCSV(String(val))).join(',')),
    ];

    return csvLines.join('\n');
  }

  /**
   * Get application statistics
   */
  async getApplicationStats() {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.businessApplication.count({ where: { status: 'PENDING' } }),
      prisma.businessApplication.count({ where: { status: 'APPROVED' } }),
      prisma.businessApplication.count({ where: { status: 'REJECTED' } }),
      prisma.businessApplication.count(),
    ]);

    const customerApps = await prisma.businessApplication.count({
      where: { applicationType: 'CUSTOMER' },
    });

    const vendorApps = await prisma.businessApplication.count({
      where: { applicationType: 'VENDOR' },
    });

    // Get recent applications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentApplications = await prisma.businessApplication.count({
      where: {
        submittedAt: { gte: sevenDaysAgo },
      },
    });

    return {
      pending,
      approved,
      rejected,
      total,
      byType: {
        customer: customerApps,
        vendor: vendorApps,
      },
      recentApplications,
    };
  }
}

export const applicationService = new ApplicationService();
