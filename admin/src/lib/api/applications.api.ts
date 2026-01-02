import api, { ApiResponse, getErrorMessage } from '../api';

// ============================================
// TYPES
// ============================================

export type ApplicationType = 'CUSTOMER' | 'VENDOR';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Custom paginated response for applications (matches backend response structure)
export interface ApplicationsPaginatedResponse {
  data: Application[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
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
  reviewNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    createdAt: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface ApplicationFilters {
  status?: ApplicationStatus;
  applicationType?: ApplicationType;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: 'submittedAt' | 'reviewedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ApplicationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  approvedThisMonth: number;
  rejectionRate: number;
}

// ============================================
// CONSTANTS
// ============================================

export const BUSINESS_TYPES: Record<string, string> = {
  salon: 'Salon',
  spa: 'Spa',
  retail_store: 'Retail Store',
  online_retailer: 'Online Retailer',
  distributor: 'Distributor',
  llc: 'LLC',
  corporation: 'Corporation',
  sole_proprietor: 'Sole Proprietor',
  other: 'Other',
};

export const US_STATES: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
  DC: 'District of Columbia',
};

export const MONTHLY_PURCHASE_LABELS: Record<string, string> = {
  under_500: 'Under $500',
  '500_1000': '$500 - $1,000',
  '1000_5000': '$1,000 - $5,000',
  '5000_10000': '$5,000 - $10,000',
  '10000_plus': '$10,000+',
};

export const PRODUCT_CATEGORIES: Record<string, string> = {
  skincare: 'Skincare',
  makeup: 'Makeup',
  haircare: 'Haircare',
  body_care: 'Body Care',
  tools: 'Tools & Accessories',
  fragrance: 'Fragrance',
  nails: 'Nail Care',
  other: 'Other',
};

export const HEAR_ABOUT_US_LABELS: Record<string, string> = {
  google: 'Google Search',
  social_media: 'Social Media',
  trade_show: 'Trade Show',
  referral: 'Referral',
  advertisement: 'Advertisement',
  industry_publication: 'Industry Publication',
  other: 'Other',
};

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get all applications with filters
 */
export async function getAllApplications(
  filters: ApplicationFilters = {}
): Promise<ApplicationsPaginatedResponse> {
  try {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.applicationType) params.append('applicationType', filters.applicationType);
    if (filters.search) params.append('search', filters.search);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    const response = await api.get<{
      success: boolean;
      data: Application[];
      pagination: { total: number; page: number; pages: number; limit: number };
    }>(`/applications?${params.toString()}`);

    if (response.data.success && response.data.data) {
      // Transform backend response to match PaginatedResponse interface
      return {
        data: response.data.data,
        total: response.data.pagination.total,
        page: response.data.pagination.page,
        totalPages: response.data.pagination.pages,
        limit: response.data.pagination.limit,
      };
    }
    throw new Error('Failed to fetch applications');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get application by ID
 */
export async function getApplication(id: string): Promise<Application> {
  try {
    const response = await api.get<ApiResponse<Application>>(`/applications/${id}`);

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Application not found');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Approve an application
 */
export async function approveApplication(
  id: string,
  notes?: string
): Promise<Application> {
  try {
    const response = await api.post<ApiResponse<Application>>(`/applications/${id}/approve`, {
      notes,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to approve application');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Reject an application
 */
export async function rejectApplication(
  id: string,
  reason: string
): Promise<Application> {
  try {
    const response = await api.post<ApiResponse<Application>>(`/applications/${id}/reject`, {
      reason,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to reject application');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Get pending applications count
 */
export async function getPendingCount(): Promise<number> {
  try {
    const response = await api.get<ApiResponse<{ count: number }>>('/applications/pending-count');

    if (response.data.success && response.data.data) {
      return response.data.data.count;
    }
    return 0;
  } catch (error) {
    console.error('Failed to fetch pending count:', error);
    return 0;
  }
}

/**
 * Get application statistics
 */
export async function getApplicationStats(): Promise<ApplicationStats> {
  try {
    const response = await api.get<ApiResponse<ApplicationStats>>('/applications/stats');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error('Failed to fetch application stats');
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

/**
 * Export applications to CSV
 */
export async function exportApplications(filters: ApplicationFilters = {}): Promise<Blob> {
  try {
    const params = new URLSearchParams();

    if (filters.status) params.append('status', filters.status);
    if (filters.applicationType) params.append('applicationType', filters.applicationType);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/applications/export?${params.toString()}`, {
      responseType: 'blob',
    });

    return response.data;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format application ID for display
 */
export function formatApplicationId(id: string): string {
  return `APP-${id.substring(0, 8).toUpperCase()}`;
}

/**
 * Get status color classes
 */
export function getStatusColor(status: ApplicationStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'PENDING':
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
      };
    case 'APPROVED':
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
      };
    case 'REJECTED':
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
      };
  }
}

/**
 * Get type color classes
 */
export function getTypeColor(type: ApplicationType): {
  bg: string;
  text: string;
} {
  switch (type) {
    case 'CUSTOMER':
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
      };
    case 'VENDOR':
      return {
        bg: 'bg-purple-100',
        text: 'text-purple-800',
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
      };
  }
}

/**
 * Format date for display
 */
export function formatDate(dateString: string | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format date and time for display
 */
export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get label for a value from a labels map
 */
export function getLabel(value: string | undefined, labels: Record<string, string>): string {
  if (!value) return '-';
  return labels[value] || value;
}

/**
 * Get labels for multiple values
 */
export function getLabels(values: string[] | undefined, labels: Record<string, string>): string {
  if (!values || values.length === 0) return '-';
  return values.map((v) => labels[v] || v).join(', ');
}
