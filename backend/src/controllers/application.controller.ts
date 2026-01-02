import { Request, Response } from 'express';
import { applicationService, SubmitApplicationData, ApplicationFilters } from '../services/application.service';
import { ApplicationStatus, ApplicationType } from '@prisma/client';

// ============================================
// APPLICATION CONTROLLER
// ============================================

class ApplicationController {
  /**
   * Submit a new application
   * POST /api/applications
   */
  async submit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const applicationData: SubmitApplicationData = {
        applicationType: req.body.applicationType,
        businessName: req.body.businessName,
        businessType: req.body.businessType,
        taxId: req.body.taxId,
        phone: req.body.phone,
        businessAddress: req.body.businessAddress,
        businessWebsite: req.body.businessWebsite,
        businessYears: req.body.businessYears,
        businessLicense: req.body.businessLicense,
        resaleCertificate: req.body.resaleCertificate,
        estimatedMonthlyPurchase: req.body.estimatedMonthlyPurchase,
        howDidYouHear: req.body.howDidYouHear,
        references: req.body.references,
        additionalNotes: req.body.additionalNotes,
        brandName: req.body.brandName,
        brandDescription: req.body.brandDescription,
        productCategories: req.body.productCategories || req.body.vendorProductCategories,
        vendorMinimumOrder: req.body.vendorMinimumOrder || req.body.minimumOrderAmount,
        productLineSize: req.body.productLineSize,
        documents: req.body.documents,
      };

      const application = await applicationService.submitApplication(userId, applicationData);

      res.status(201).json({
        success: true,
        message: 'Application submitted successfully. You will be notified once it is reviewed.',
        data: application,
      });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to submit application',
      });
    }
  }

  /**
   * Get current user's applications
   * GET /api/applications/my
   */
  async getMyApplications(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const applications = await applicationService.getApplicationsByUser(userId);

      res.json({
        success: true,
        data: applications,
      });
    } catch (error: any) {
      console.error('Error fetching user applications:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch applications',
      });
    }
  }

  /**
   * Get all applications (admin only)
   * GET /api/applications
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const filters: ApplicationFilters = {
        status: req.query.status as ApplicationStatus | undefined,
        applicationType: req.query.applicationType as ApplicationType | undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        sortBy: (req.query.sortBy as 'submittedAt' | 'reviewedAt') || 'submittedAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        search: req.query.search as string | undefined,
      };

      const result = await applicationService.getAllApplications(filters);

      res.json({
        success: true,
        data: result.applications,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages,
          limit: filters.limit,
        },
      });
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch applications',
      });
    }
  }

  /**
   * Get application by ID (admin only)
   * GET /api/applications/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const application = await applicationService.getApplicationById(id);

      if (!application) {
        res.status(404).json({
          success: false,
          message: 'Application not found',
        });
        return;
      }

      res.json({
        success: true,
        data: application,
      });
    } catch (error: any) {
      console.error('Error fetching application:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch application',
      });
    }
  }

  /**
   * Approve an application (admin only)
   * POST /api/applications/:id/approve
   */
  async approve(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      const { notes } = req.body;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const application = await applicationService.approveApplication(id, adminId, notes);

      res.json({
        success: true,
        message: 'Application approved successfully',
        data: application,
      });
    } catch (error: any) {
      console.error('Error approving application:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to approve application',
      });
    }
  }

  /**
   * Reject an application (admin only)
   * POST /api/applications/:id/reject
   */
  async reject(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const adminId = req.user?.id;
      const { reason } = req.body;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!reason || reason.trim().length < 10) {
        res.status(400).json({
          success: false,
          message: 'Rejection reason is required and must be at least 10 characters',
        });
        return;
      }

      const application = await applicationService.rejectApplication(id, adminId, reason);

      res.json({
        success: true,
        message: 'Application rejected',
        data: application,
      });
    } catch (error: any) {
      console.error('Error rejecting application:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to reject application',
      });
    }
  }

  /**
   * Get pending applications count (admin only)
   * GET /api/applications/pending-count
   */
  async getPendingCount(_req: Request, res: Response): Promise<void> {
    try {
      const count = await applicationService.getPendingApplicationsCount();

      res.json({
        success: true,
        data: { count },
      });
    } catch (error: any) {
      console.error('Error fetching pending count:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch pending count',
      });
    }
  }

  /**
   * Export applications to CSV (admin only)
   * GET /api/applications/export
   */
  async export(req: Request, res: Response): Promise<void> {
    try {
      const filters: ApplicationFilters = {
        status: req.query.status as ApplicationStatus | undefined,
        applicationType: req.query.applicationType as ApplicationType | undefined,
        search: req.query.search as string | undefined,
      };

      const csv = await applicationService.exportApplications(filters);

      // Set CSV headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=applications-${Date.now()}.csv`);

      res.send(csv);
    } catch (error: any) {
      console.error('Error exporting applications:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export applications',
      });
    }
  }

  /**
   * Resubmit application (for rejected users)
   * POST /api/applications/resubmit
   */
  async resubmit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const applicationData: SubmitApplicationData = {
        applicationType: req.body.applicationType,
        businessName: req.body.businessName,
        businessType: req.body.businessType,
        taxId: req.body.taxId,
        phone: req.body.phone,
        businessAddress: req.body.businessAddress,
        businessWebsite: req.body.businessWebsite,
        businessYears: req.body.businessYears,
        businessLicense: req.body.businessLicense,
        resaleCertificate: req.body.resaleCertificate,
        estimatedMonthlyPurchase: req.body.estimatedMonthlyPurchase,
        howDidYouHear: req.body.howDidYouHear,
        references: req.body.references,
        additionalNotes: req.body.additionalNotes,
        brandName: req.body.brandName,
        brandDescription: req.body.brandDescription,
        productCategories: req.body.productCategories || req.body.vendorProductCategories,
        vendorMinimumOrder: req.body.vendorMinimumOrder || req.body.minimumOrderAmount,
        productLineSize: req.body.productLineSize,
        documents: req.body.documents,
      };

      const application = await applicationService.resubmitApplication(userId, applicationData);

      res.status(201).json({
        success: true,
        message: 'Application resubmitted successfully',
        data: application,
      });
    } catch (error: any) {
      console.error('Error resubmitting application:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to resubmit application',
      });
    }
  }

  /**
   * Suspend a user (admin only)
   * POST /api/applications/users/:userId/suspend
   */
  async suspendUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;
      const { reason } = req.body;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      if (!reason || reason.trim().length < 10) {
        res.status(400).json({
          success: false,
          message: 'Suspension reason is required and must be at least 10 characters',
        });
        return;
      }

      const user = await applicationService.suspendUser(userId, adminId, reason);

      res.json({
        success: true,
        message: 'User suspended successfully',
        data: user,
      });
    } catch (error: any) {
      console.error('Error suspending user:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to suspend user',
      });
    }
  }

  /**
   * Unsuspend a user (admin only)
   * POST /api/applications/users/:userId/unsuspend
   */
  async unsuspendUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
        return;
      }

      const user = await applicationService.unsuspendUser(userId, adminId);

      res.json({
        success: true,
        message: 'User account reactivated successfully',
        data: user,
      });
    } catch (error: any) {
      console.error('Error unsuspending user:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Failed to unsuspend user',
      });
    }
  }

  /**
   * Get application statistics (admin only)
   * GET /api/applications/stats
   */
  async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await applicationService.getApplicationStats();

      res.json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      console.error('Error fetching application stats:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch statistics',
      });
    }
  }
}

export const applicationController = new ApplicationController();
