import api, { ApiResponse, getErrorMessage } from '../api';

// ============================================
// TYPES
// ============================================

export type ApplicationType = 'CUSTOMER' | 'VENDOR';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface ApplicationFormData {
  // Step 1: Application Type
  applicationType: ApplicationType;

  // Step 2: Business Information
  businessName: string;
  businessType: string;
  taxId: string;
  businessLicense?: string;
  resaleCertificate?: string;
  businessYears: number;

  // Step 3: Contact Information
  phone: string;
  businessWebsite?: string;
  businessAddress: BusinessAddress;

  // Step 4: Purchase Information (Customer only)
  estimatedMonthlyPurchase?: string;
  productCategories?: string[];

  // Step 5: Vendor Information (Vendor only)
  brandName?: string;
  brandDescription?: string;
  vendorProductCategories?: string[];
  minimumOrderAmount?: number;
  productLineSize?: number;

  // Step 6: References & Documents
  businessReferences?: string;
  documents?: string[];

  // Step 7: Additional Information
  hearAboutUs?: string;
  additionalNotes?: string;

  // Step 8: Agreement
  certifyAccurate: boolean;
  agreeTerms: boolean;
}

export interface Application {
  id: string;
  userId: string;
  applicationType: ApplicationType;
  status: ApplicationStatus;
  businessName: string;
  businessType: string;
  taxId: string;
  businessLicense?: string;
  resaleCertificate?: string;
  businessYears: number;
  phone: string;
  businessWebsite?: string;
  businessAddress: BusinessAddress;
  estimatedMonthlyPurchase?: string;
  productCategories?: string[];
  brandName?: string;
  brandDescription?: string;
  vendorProductCategories?: string[];
  minimumOrderAmount?: number;
  productLineSize?: number;
  businessReferences?: string;
  documents?: string[];
  hearAboutUs?: string;
  additionalNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CONSTANTS
// ============================================

export const BUSINESS_TYPES = [
  { value: 'salon', label: 'Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'retail_store', label: 'Retail Store' },
  { value: 'online_retailer', label: 'Online Retailer' },
  { value: 'distributor', label: 'Distributor' },
  { value: 'llc', label: 'LLC' },
  { value: 'corporation', label: 'Corporation' },
  { value: 'sole_proprietor', label: 'Sole Proprietor' },
  { value: 'other', label: 'Other' },
];

export const US_STATES = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'District of Columbia' },
];

export const MONTHLY_PURCHASE_OPTIONS = [
  { value: 'under_500', label: 'Under $500' },
  { value: '500_1000', label: '$500 - $1,000' },
  { value: '1000_5000', label: '$1,000 - $5,000' },
  { value: '5000_10000', label: '$5,000 - $10,000' },
  { value: '10000_plus', label: '$10,000+' },
];

export const PRODUCT_CATEGORIES = [
  { value: 'skincare', label: 'Skincare' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'haircare', label: 'Haircare' },
  { value: 'body_care', label: 'Body Care' },
  { value: 'tools', label: 'Tools & Accessories' },
  { value: 'fragrance', label: 'Fragrance' },
  { value: 'nails', label: 'Nail Care' },
  { value: 'other', label: 'Other' },
];

export const HEAR_ABOUT_US_OPTIONS = [
  { value: 'google', label: 'Google Search' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'referral', label: 'Referral' },
  { value: 'advertisement', label: 'Advertisement' },
  { value: 'industry_publication', label: 'Industry Publication' },
  { value: 'other', label: 'Other' },
];

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Upload a file for application
 */
export async function uploadApplicationFile(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'application');

    const response = await api.post<ApiResponse<{ url: string }>>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success && response.data.data) {
      return response.data.data.url;
    }
    throw new Error('Failed to upload file');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Submit a new business application
 */
export async function submitApplication(
  data: ApplicationFormData,
  files?: File[]
): Promise<Application> {
  try {
    // Upload files first if any
    const uploadedUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadApplicationFile(file);
        uploadedUrls.push(url);
      }
    }

    // Submit application with file URLs
    const response = await api.post<ApiResponse<Application>>('/applications', {
      ...data,
      documents: uploadedUrls.length > 0 ? uploadedUrls : data.documents,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to submit application');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Resubmit application after rejection
 */
export async function resubmitApplication(
  data: ApplicationFormData,
  files?: File[]
): Promise<Application> {
  try {
    // Upload files first if any
    const uploadedUrls: string[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        const url = await uploadApplicationFile(file);
        uploadedUrls.push(url);
      }
    }

    // Submit application with file URLs
    const response = await api.post<ApiResponse<Application>>('/applications/resubmit', {
      ...data,
      documents: uploadedUrls.length > 0 ? uploadedUrls : data.documents,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to resubmit application');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get my applications
 */
export async function getMyApplications(): Promise<Application[]> {
  try {
    const response = await api.get<ApiResponse<Application[]>>('/applications/my');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get latest application status
 */
export async function getLatestApplication(): Promise<Application | null> {
  try {
    const applications = await getMyApplications();
    if (applications.length === 0) return null;

    // Sort by submittedAt descending and return the latest
    return applications.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )[0];
  } catch (error) {
    return null;
  }
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

const STORAGE_KEY = 'femmelux_application_draft';

/**
 * Save application draft to localStorage
 */
export function saveApplicationDraft(data: Partial<ApplicationFormData>): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Load application draft from localStorage
 */
export function loadApplicationDraft(): Partial<ApplicationFormData> | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

/**
 * Clear application draft from localStorage
 */
export function clearApplicationDraft(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
