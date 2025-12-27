/**
 * API Client for ElectroVault Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export interface ApiResponse<T> {
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setToken(token: string | null) {
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error.message || 'API request failed');
    }

    return response.json();
  }

  // ============================================
  // Categories
  // ============================================

  async getCategories(params?: {
    page?: number;
    limit?: number;
    level?: number;
    parentId?: string;
  }): Promise<ApiResponse<Category[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.level !== undefined) searchParams.set('level', params.level.toString());
    if (params?.parentId) searchParams.set('parentId', params.parentId);

    const query = searchParams.toString();
    return this.request<ApiResponse<Category[]>>(`/categories${query ? `?${query}` : ''}`);
  }

  async getCategoryTree(): Promise<ApiResponse<CategoryTreeNode[]>> {
    return this.request<ApiResponse<CategoryTreeNode[]>>('/categories/tree');
  }

  async getCategoryBySlug(slug: string): Promise<ApiResponse<Category>> {
    return this.request<ApiResponse<Category>>(`/categories/${slug}`);
  }

  async getCategoryPath(id: string): Promise<ApiResponse<CategoryPathItem[]>> {
    return this.request<ApiResponse<CategoryPathItem[]>>(`/categories/${id}/path`);
  }

  // ============================================
  // Manufacturers
  // ============================================

  async getManufacturers(params?: {
    page?: number;
    limit?: number;
    status?: string;
    includeAcquired?: boolean;
  }): Promise<ApiResponse<Manufacturer[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.includeAcquired !== undefined) {
      searchParams.set('includeAcquired', params.includeAcquired.toString());
    }

    const query = searchParams.toString();
    return this.request<ApiResponse<Manufacturer[]>>(`/manufacturers${query ? `?${query}` : ''}`);
  }

  async searchManufacturers(query: string, limit = 10): Promise<ApiResponse<Manufacturer[]>> {
    return this.request<ApiResponse<Manufacturer[]>>(
      `/manufacturers/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  async getManufacturerBySlug(slug: string): Promise<ApiResponse<Manufacturer>> {
    return this.request<ApiResponse<Manufacturer>>(`/manufacturers/${slug}`);
  }

  async createManufacturer(data: unknown): Promise<ApiResponse<Manufacturer>> {
    return this.request<ApiResponse<Manufacturer>>('/manufacturers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateManufacturer(id: string, data: unknown): Promise<ApiResponse<Manufacturer>> {
    return this.request<ApiResponse<Manufacturer>>(`/manufacturers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteManufacturer(id: string): Promise<void> {
    await this.request<void>(`/manufacturers/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Categories
  // ============================================

  async createCategory(data: unknown): Promise<ApiResponse<Category>> {
    return this.request<ApiResponse<Category>>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCategory(id: string, data: unknown): Promise<ApiResponse<Category>> {
    return this.request<ApiResponse<Category>>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Packages
  // ============================================

  async getPackages(params?: {
    page?: number;
    limit?: number;
    mountingType?: string;
  }): Promise<ApiResponse<Package[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.mountingType) searchParams.set('mountingType', params.mountingType);

    const query = searchParams.toString();
    return this.request<ApiResponse<Package[]>>(`/packages${query ? `?${query}` : ''}`);
  }

  async searchPackages(query: string, limit = 10): Promise<ApiResponse<Package[]>> {
    return this.request<ApiResponse<Package[]>>(
      `/packages/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  // ============================================
  // Components
  // ============================================

  async getComponents(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    status?: string;
    includeArchived?: boolean;
  }): Promise<ApiResponse<Component[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.includeArchived !== undefined) {
      searchParams.set('includeArchived', params.includeArchived.toString());
    }

    const query = searchParams.toString();
    return this.request<ApiResponse<Component[]>>(`/components${query ? `?${query}` : ''}`);
  }

  async getComponentBySlug(slug: string): Promise<ApiResponse<Component>> {
    return this.request<ApiResponse<Component>>(`/components/${slug}`);
  }

  async createComponent(data: unknown): Promise<ApiResponse<Component>> {
    return this.request<ApiResponse<Component>>('/components', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateComponent(id: string, data: unknown): Promise<ApiResponse<Component>> {
    return this.request<ApiResponse<Component>>(`/components/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteComponent(id: string): Promise<void> {
    await this.request<void>(`/components/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Parts
  // ============================================

  async getParts(params?: {
    page?: number;
    limit?: number;
    componentId?: string;
    manufacturerId?: string;
    status?: string;
  }): Promise<ApiResponse<Part[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.componentId) searchParams.set('componentId', params.componentId);
    if (params?.manufacturerId) searchParams.set('manufacturerId', params.manufacturerId);
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return this.request<ApiResponse<Part[]>>(`/parts${query ? `?${query}` : ''}`);
  }

  async searchParts(query: string, limit = 10): Promise<ApiResponse<Part[]>> {
    return this.request<ApiResponse<Part[]>>(
      `/parts/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
  }

  async getPartByMpn(mpn: string): Promise<ApiResponse<Part>> {
    return this.request<ApiResponse<Part>>(`/parts/${encodeURIComponent(mpn)}`);
  }
}

// ============================================
// Type Definitions
// ============================================

export interface LocalizedString {
  de?: string;
  en?: string;
  fr?: string;
  es?: string;
  zh?: string;
}

export interface Category {
  id: string;
  name: LocalizedString;
  slug: string;
  level: number;
  parentId: string | null;
  description: LocalizedString | null;
  iconUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
}

export interface CategoryPathItem {
  id: string;
  name: LocalizedString;
  slug: string;
  level: number;
}

export interface Manufacturer {
  id: string;
  name: string;
  slug: string;
  cageCode: string | null;
  countryCode: string | null;
  website: string | null;
  logoUrl: string | null;
  status: 'ACTIVE' | 'ACQUIRED' | 'DEFUNCT';
  foundedYear: number | null;
  defunctYear: number | null;
  description: LocalizedString | null;
  aliases: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  mountingType: 'THT' | 'SMD' | 'HYBRID' | 'OTHER';
  pinCount: number | null;
  lengthMm: string | null;
  widthMm: string | null;
  heightMm: string | null;
  pitchMm: string | null;
  jedecStandard: string | null;
  eiaStandard: string | null;
  description: string | null;
  drawingUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Component {
  id: string;
  name: LocalizedString;
  slug: string;
  categoryId: string;
  shortDescription: LocalizedString | null;
  description: LocalizedString | null;
  status: 'ACTIVE' | 'NRND' | 'EOL' | 'OBSOLETE';
  commonAttributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  category?: Category;
}

export interface Part {
  id: string;
  componentId: string;
  manufacturerId: string;
  mpn: string;
  description: LocalizedString | null;
  status: 'ACTIVE' | 'NRND' | 'EOL' | 'OBSOLETE';
  specificAttributes: Record<string, unknown>;
  stockQuantity: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  manufacturer?: Manufacturer;
  component?: Component;
}

// Export singleton instance
export const api = new ApiClient();

// Export for server-side usage with token
export function createApiClient(token?: string): ApiClient {
  const client = new ApiClient();
  if (token) {
    client.setToken(token);
  }
  return client;
}

/**
 * Create an authenticated API client from the current session
 * Use this in Server Components to make authenticated API calls
 */
export async function getAuthenticatedApiClient(): Promise<ApiClient> {
  // Dynamic import to avoid circular dependencies
  const { getSession } = await import('./auth-server');
  const session = await getSession();
  return createApiClient(session?.accessToken);
}
