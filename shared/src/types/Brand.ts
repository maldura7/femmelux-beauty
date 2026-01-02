// Brand-related types

export interface Brand {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description?: string;
  minimumOrder: number;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBrandInput {
  name: string;
  slug?: string;
  logo: string;
  description?: string;
  minimumOrder: number;
  status?: boolean;
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  logo?: string;
  description?: string;
  minimumOrder?: number;
  status?: boolean;
}
