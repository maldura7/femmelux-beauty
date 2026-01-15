import { PrismaClient, ImageScraperJobStatus, Prisma } from '@prisma/client';
import { findAndAssignProductImage } from './imageScraper.service';

const prisma = new PrismaClient();

// Store for active job cancellation flags
const activeJobs = new Map<string, { cancelled: boolean }>();

// ============================================
// TYPES
// ============================================

interface CreateJobOptions {
  brandId?: string;
  categoryId?: string;
  limit?: number;
  createdBy: string;
}

interface JobProgress {
  jobId: string;
  status: ImageScraperJobStatus;
  totalProducts: number;
  processed: number;
  successful: number;
  failed: number;
  startedAt?: Date;
  completedAt?: Date;
  percentComplete: number;
}

interface ScrapeResult {
  productId: string;
  productName: string;
  success: boolean;
  imageUrl?: string;
  localPath?: string;
  source?: string;
  error?: string;
}

// ============================================
// JOB MANAGEMENT FUNCTIONS
// ============================================

/**
 * Create a new background image scraping job
 */
export async function createJob(options: CreateJobOptions): Promise<string> {
  const { brandId, categoryId, limit = 100, createdBy } = options;

  // Count products that need images
  const whereClause: Record<string, unknown> = {
    OR: [
      { images: { equals: [] } },
      { images: { equals: null } },
    ],
  };

  if (brandId) {
    whereClause.brandId = brandId;
  }

  if (categoryId) {
    whereClause.category = categoryId;
  }

  const totalProducts = await prisma.product.count({
    where: whereClause,
  });

  const actualTotal = Math.min(totalProducts, limit);

  // Create the job record
  const job = await prisma.imageScraperJob.create({
    data: {
      status: 'PENDING',
      totalProducts: actualTotal,
      brandId,
      categoryId,
      createdBy,
      errorLog: [],
      results: [],
    },
  });

  return job.id;
}

/**
 * Start processing a job in the background
 * This runs asynchronously and updates the job status as it progresses
 */
export async function startJob(jobId: string): Promise<void> {
  // Get job details
  const job = await prisma.imageScraperJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    throw new Error('Job not found');
  }

  if (job.status !== 'PENDING') {
    throw new Error(`Job is already ${job.status.toLowerCase()}`);
  }

  // Initialize cancellation flag
  activeJobs.set(jobId, { cancelled: false });

  // Update job to RUNNING
  await prisma.imageScraperJob.update({
    where: { id: jobId },
    data: {
      status: 'RUNNING',
      startedAt: new Date(),
    },
  });

  // Run the job asynchronously (don't await)
  processJobAsync(jobId, job.brandId, job.categoryId, job.totalProducts)
    .catch(error => {
      console.error(`[ImageScraperJob] Job ${jobId} failed with error:`, error);
      // Update job to FAILED
      prisma.imageScraperJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          errorLog: [{ message: error.message, timestamp: new Date().toISOString() }],
        },
      }).catch(console.error);
    })
    .finally(() => {
      activeJobs.delete(jobId);
    });
}

/**
 * Process the job asynchronously
 */
async function processJobAsync(
  jobId: string,
  brandId: string | null,
  categoryId: string | null,
  limit: number
): Promise<void> {
  const whereClause: Record<string, unknown> = {
    OR: [
      { images: { equals: [] } },
      { images: { equals: null } },
    ],
  };

  if (brandId) {
    whereClause.brandId = brandId;
  }

  if (categoryId) {
    whereClause.category = categoryId;
  }

  // Get products to process
  const products = await prisma.product.findMany({
    where: whereClause,
    take: limit,
    select: { id: true, name: true },
  });

  const results: ScrapeResult[] = [];
  const errorLog: { productId: string; productName: string; error: string; timestamp: string }[] = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    // Check if job was cancelled
    const jobState = activeJobs.get(jobId);
    if (jobState?.cancelled) {
      console.log(`[ImageScraperJob] Job ${jobId} was cancelled at ${i}/${products.length}`);
      await prisma.imageScraperJob.update({
        where: { id: jobId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
          processed: i,
          successful,
          failed,
          results: results as unknown as Prisma.JsonArray,
          errorLog: errorLog as unknown as Prisma.JsonArray,
        },
      });
      return;
    }

    const product = products[i];

    // Add delay between products to avoid rate limiting
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    try {
      console.log(`[ImageScraperJob] Processing ${i + 1}/${products.length}: ${product.name}`);
      const result = await findAndAssignProductImage(product.id);
      results.push(result);

      if (result.success) {
        successful++;
      } else {
        failed++;
        if (result.error) {
          errorLog.push({
            productId: product.id,
            productName: product.name,
            error: result.error,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Update progress every 5 products or on the last one
      if ((i + 1) % 5 === 0 || i === products.length - 1) {
        await prisma.imageScraperJob.update({
          where: { id: jobId },
          data: {
            processed: i + 1,
            successful,
            failed,
            results: results as unknown as Prisma.JsonArray,
            errorLog: errorLog as unknown as Prisma.JsonArray,
          },
        });
      }
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errorLog.push({
        productId: product.id,
        productName: product.name,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Mark job as completed
  await prisma.imageScraperJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      processed: products.length,
      successful,
      failed,
      results: results as unknown as Prisma.JsonArray,
      errorLog: errorLog as unknown as Prisma.JsonArray,
    },
  });

  console.log(`[ImageScraperJob] Job ${jobId} completed: ${successful}/${products.length} successful`);
}

/**
 * Get the current status of a job
 */
export async function getJobStatus(jobId: string): Promise<JobProgress | null> {
  const job = await prisma.imageScraperJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return null;
  }

  return {
    jobId: job.id,
    status: job.status,
    totalProducts: job.totalProducts,
    processed: job.processed,
    successful: job.successful,
    failed: job.failed,
    startedAt: job.startedAt || undefined,
    completedAt: job.completedAt || undefined,
    percentComplete: job.totalProducts > 0
      ? Math.round((job.processed / job.totalProducts) * 100)
      : 0,
  };
}

/**
 * Cancel a running job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  const jobState = activeJobs.get(jobId);

  if (!jobState) {
    // Job might not be running or doesn't exist
    const job = await prisma.imageScraperJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.status === 'PENDING') {
      // Can directly cancel pending jobs
      await prisma.imageScraperJob.update({
        where: { id: jobId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
        },
      });
      return true;
    }

    if (job.status !== 'RUNNING') {
      throw new Error(`Cannot cancel job with status: ${job.status}`);
    }

    return false;
  }

  // Set cancellation flag
  jobState.cancelled = true;
  return true;
}

/**
 * Get list of jobs with optional filters
 */
export async function getJobList(options: {
  status?: ImageScraperJobStatus;
  limit?: number;
  offset?: number;
}): Promise<{
  jobs: JobProgress[];
  total: number;
}> {
  const { status, limit = 20, offset = 0 } = options;

  const whereClause: Record<string, unknown> = {};
  if (status) {
    whereClause.status = status;
  }

  const [jobs, total] = await Promise.all([
    prisma.imageScraperJob.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.imageScraperJob.count({ where: whereClause }),
  ]);

  return {
    jobs: jobs.map(job => ({
      jobId: job.id,
      status: job.status,
      totalProducts: job.totalProducts,
      processed: job.processed,
      successful: job.successful,
      failed: job.failed,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
      percentComplete: job.totalProducts > 0
        ? Math.round((job.processed / job.totalProducts) * 100)
        : 0,
    })),
    total,
  };
}

/**
 * Get detailed results for a completed job
 */
export async function getJobResults(jobId: string): Promise<{
  job: JobProgress;
  results: ScrapeResult[];
  errorLog: { productId: string; productName: string; error: string; timestamp: string }[];
} | null> {
  const job = await prisma.imageScraperJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return null;
  }

  return {
    job: {
      jobId: job.id,
      status: job.status,
      totalProducts: job.totalProducts,
      processed: job.processed,
      successful: job.successful,
      failed: job.failed,
      startedAt: job.startedAt || undefined,
      completedAt: job.completedAt || undefined,
      percentComplete: job.totalProducts > 0
        ? Math.round((job.processed / job.totalProducts) * 100)
        : 0,
    },
    results: (job.results as unknown as ScrapeResult[]) || [],
    errorLog: (job.errorLog as unknown as { productId: string; productName: string; error: string; timestamp: string }[]) || [],
  };
}

/**
 * Delete old completed/failed/cancelled jobs
 */
export async function cleanupOldJobs(daysOld: number = 30): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await prisma.imageScraperJob.deleteMany({
    where: {
      status: {
        in: ['COMPLETED', 'FAILED', 'CANCELLED'],
      },
      completedAt: {
        lt: cutoffDate,
      },
    },
  });

  return result.count;
}

export default {
  createJob,
  startJob,
  getJobStatus,
  cancelJob,
  getJobList,
  getJobResults,
  cleanupOldJobs,
};
