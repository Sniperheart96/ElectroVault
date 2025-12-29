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

export class ApiClient {
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
      const errorText = await response.text();
      try {
        const error: ApiError = JSON.parse(errorText);
        throw new Error(error.error.message || 'API request failed');
      } catch {
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }
    }

    // Handle 204 No Content (DELETE responses)
    if (response.status === 204) {
      return undefined as T;
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

  async createPackage(data: unknown): Promise<ApiResponse<Package>> {
    return this.request<ApiResponse<Package>>('/packages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePackage(id: string, data: unknown): Promise<ApiResponse<Package>> {
    return this.request<ApiResponse<Package>>(`/packages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePackage(id: string): Promise<void> {
    await this.request<void>(`/packages/${id}`, {
      method: 'DELETE',
    });
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

  async getComponentById(id: string): Promise<ApiResponse<Component>> {
    return this.request<ApiResponse<Component>>(`/components/${id}`);
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
    lifecycleStatus?: string;
  }): Promise<ApiResponse<Part[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    // API expects coreComponentId, but we use componentId for convenience
    if (params?.componentId) searchParams.set('coreComponentId', params.componentId);
    if (params?.manufacturerId) searchParams.set('manufacturerId', params.manufacturerId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.lifecycleStatus) searchParams.set('lifecycleStatus', params.lifecycleStatus);

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

  async createPart(data: unknown): Promise<ApiResponse<Part>> {
    return this.request<ApiResponse<Part>>('/parts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePart(id: string, data: unknown): Promise<ApiResponse<Part>> {
    return this.request<ApiResponse<Part>>(`/parts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePart(id: string): Promise<void> {
    await this.request<void>(`/parts/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Attribute Definitions
  // ============================================

  async getAttributeDefinitions(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    scope?: 'COMPONENT' | 'PART' | 'BOTH';
  }): Promise<ApiResponse<AttributeDefinition[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.scope) searchParams.set('scope', params.scope);

    const query = searchParams.toString();
    return this.request<ApiResponse<AttributeDefinition[]>>(`/attributes${query ? `?${query}` : ''}`);
  }

  async getAttributeDefinition(id: string): Promise<ApiResponse<AttributeDefinition>> {
    return this.request<ApiResponse<AttributeDefinition>>(`/attributes/${id}`);
  }

  async getAttributesByCategory(categoryId: string, params?: {
    scope?: 'COMPONENT' | 'PART' | 'BOTH';
    includeInherited?: boolean;
  }): Promise<ApiResponse<AttributeDefinition[]>> {
    const searchParams = new URLSearchParams();
    if (params?.scope) searchParams.set('scope', params.scope);
    if (params?.includeInherited !== undefined) {
      searchParams.set('includeInherited', params.includeInherited.toString());
    }

    const query = searchParams.toString();
    return this.request<ApiResponse<AttributeDefinition[]>>(
      `/attributes/by-category/${categoryId}${query ? `?${query}` : ''}`
    );
  }

  async createAttributeDefinition(data: unknown): Promise<ApiResponse<AttributeDefinition>> {
    return this.request<ApiResponse<AttributeDefinition>>('/attributes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAttributeDefinition(id: string, data: unknown): Promise<ApiResponse<AttributeDefinition>> {
    return this.request<ApiResponse<AttributeDefinition>>(`/attributes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteAttributeDefinition(id: string): Promise<void> {
    await this.request<void>(`/attributes/${id}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Pin Mappings
  // ============================================

  async getPinsByPartId(partId: string): Promise<ApiResponse<Pin[]>> {
    return this.request<ApiResponse<Pin[]>>(`/parts/${partId}/pins`);
  }

  async getPin(id: string): Promise<ApiResponse<Pin>> {
    return this.request<ApiResponse<Pin>>(`/pins/${id}`);
  }

  async createPin(partId: string, data: unknown): Promise<ApiResponse<Pin>> {
    return this.request<ApiResponse<Pin>>(`/parts/${partId}/pins`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async bulkCreatePins(partId: string, pins: unknown[]): Promise<ApiResponse<Pin[]>> {
    return this.request<ApiResponse<Pin[]>>(`/parts/${partId}/pins/bulk`, {
      method: 'POST',
      body: JSON.stringify({ pins }),
    });
  }

  async updatePin(id: string, data: unknown): Promise<ApiResponse<Pin>> {
    return this.request<ApiResponse<Pin>>(`/pins/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePin(id: string): Promise<void> {
    await this.request<void>(`/pins/${id}`, {
      method: 'DELETE',
    });
  }

  async reorderPins(partId: string, pins: { id: string; pinNumber: string }[]): Promise<ApiResponse<Pin[]>> {
    return this.request<ApiResponse<Pin[]>>(`/parts/${partId}/pins/reorder`, {
      method: 'POST',
      body: JSON.stringify({ pins }),
    });
  }

  async deleteAllPins(partId: string): Promise<void> {
    await this.request<void>(`/parts/${partId}/pins`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Moderation
  // ============================================

  async getModerationQueue(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ModerationQueueItem[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<ApiResponse<ModerationQueueItem[]>>(
      `/moderation/queue${query ? `?${query}` : ''}`
    );
  }

  async getPendingComponents(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Component[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<ApiResponse<Component[]>>(
      `/moderation/queue/components${query ? `?${query}` : ''}`
    );
  }

  async getPendingParts(params?: {
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Part[]>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.request<ApiResponse<Part[]>>(
      `/moderation/queue/parts${query ? `?${query}` : ''}`
    );
  }

  async getModerationStats(): Promise<ApiResponse<ModerationStats>> {
    return this.request<ApiResponse<ModerationStats>>('/moderation/stats');
  }

  async approveComponent(id: string): Promise<ApiResponse<Component>> {
    return this.request<ApiResponse<Component>>(`/moderation/component/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectComponent(id: string, comment?: string): Promise<ApiResponse<Component>> {
    return this.request<ApiResponse<Component>>(`/moderation/component/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ action: 'REJECT', comment }),
    });
  }

  async approvePart(id: string): Promise<ApiResponse<Part>> {
    return this.request<ApiResponse<Part>>(`/moderation/part/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectPart(id: string, comment?: string): Promise<ApiResponse<Part>> {
    return this.request<ApiResponse<Part>>(`/moderation/part/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ action: 'REJECT', comment }),
    });
  }

  async batchApprove(componentIds: string[]): Promise<ApiResponse<{ approved: number; total: number }>> {
    return this.request<ApiResponse<{ approved: number; total: number }>>('/moderation/batch/approve', {
      method: 'POST',
      body: JSON.stringify({ componentIds }),
    });
  }

  async batchReject(
    componentIds: string[],
    comment: string
  ): Promise<ApiResponse<{ rejected: number; total: number }>> {
    return this.request<ApiResponse<{ rejected: number; total: number }>>('/moderation/batch/reject', {
      method: 'POST',
      body: JSON.stringify({ componentIds, comment }),
    });
  }

  // ============================================
  // Component Relations (ComponentConceptRelation)
  // ============================================

  async getComponentRelations(componentId: string): Promise<ApiResponse<ComponentRelation[]>> {
    return this.request<ApiResponse<ComponentRelation[]>>(`/components/${componentId}/relations`);
  }

  async createRelation(data: {
    sourceId: string;
    targetId: string;
    relationType: string;
    notes?: LocalizedString;
  }): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<ApiResponse<{ success: boolean }>>(`/components/${data.sourceId}/relations`, {
      method: 'POST',
      body: JSON.stringify({
        targetId: data.targetId,
        relationType: data.relationType,
        notes: data.notes,
      }),
    });
  }

  async updateRelation(
    componentId: string,
    relationId: string,
    data: { notes?: LocalizedString }
  ): Promise<ApiResponse<{ success: boolean }>> {
    return this.request<ApiResponse<{ success: boolean }>>(`/components/${componentId}/relations/${relationId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteRelation(componentId: string, relationId: string): Promise<void> {
    await this.request<void>(`/components/${componentId}/relations/${relationId}`, {
      method: 'DELETE',
    });
  }

  // ============================================
  // Stats
  // ============================================

  async getStats(): Promise<ApiResponse<Stats>> {
    return this.request<ApiResponse<Stats>>('/stats');
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
  mountingType: 'THT' | 'SMD' | 'RADIAL' | 'AXIAL' | 'CHASSIS' | 'OTHER';
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

// SI-Präfix-Typ (µ = U+00B5 MICRO SIGN)
export type SIPrefix = 'P' | 'T' | 'G' | 'M' | 'k' | 'h' | 'da' | '' | 'd' | 'c' | 'm' | '\u00B5' | 'n' | 'p' | 'f';

// SI-Präfix-Faktoren für Berechnungen
export const SI_PREFIX_FACTORS: Record<SIPrefix, number> = {
  P: 1e15,
  T: 1e12,
  G: 1e9,
  M: 1e6,
  k: 1e3,
  h: 1e2,
  da: 1e1,
  '': 1,
  d: 1e-1,
  c: 1e-2,
  m: 1e-3,
  '\u00B5': 1e-6,  // µ (Micro)
  n: 1e-9,
  p: 1e-12,
  f: 1e-15,
};

export interface ComponentAttributeValue {
  id: string;
  definitionId: string;
  // Numerische Werte (immer in SI-Basiseinheit)
  normalizedValue: number | null;
  normalizedMin: number | null;
  normalizedMax: number | null;
  // SI-Präfix für Anzeige
  prefix: SIPrefix | null;
  // Für STRING-Typ
  stringValue: string | null;
  definition?: {
    id: string;
    name: string;
    displayName: LocalizedString;
    unit: string | null;
    dataType: 'DECIMAL' | 'INTEGER' | 'STRING' | 'BOOLEAN';
    scope: 'COMPONENT' | 'PART' | 'BOTH';
    isLabel?: boolean;
  };
}

export interface Component {
  id: string;
  name: LocalizedString;
  slug: string;
  series: string | null;
  categoryId: string;
  shortDescription: LocalizedString | null;
  fullDescription: LocalizedString | null;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';
  commonAttributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  category?: Category;
  attributeValues?: ComponentAttributeValue[];
  manufacturerPartsCount?: number;
}

export interface PartAttributeValue {
  id: string;
  definitionId: string;
  normalizedValue: number | null;
  normalizedMin: number | null;
  normalizedMax: number | null;
  prefix: SIPrefix | null;
  stringValue: string | null;
  isDeviation?: boolean;
  definition?: {
    id: string;
    name: string;
    displayName: LocalizedString;
    unit: string | null;
    dataType: 'DECIMAL' | 'INTEGER' | 'STRING' | 'BOOLEAN';
    scope: 'COMPONENT' | 'PART' | 'BOTH';
  };
}

export interface Part {
  id: string;
  coreComponentId: string;
  manufacturerId: string;
  mpn: string;
  orderingCode: string | null;
  packageId: string | null;
  weightGrams: number | null;
  dateCodeFormat: string | null;
  introductionYear: number | null;
  discontinuedYear: number | null;
  rohsCompliant: boolean | null;
  reachCompliant: boolean | null;
  nsn: string | null;
  milSpec: string | null;
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED';
  lifecycleStatus: 'ACTIVE' | 'NRND' | 'EOL' | 'OBSOLETE';
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  coreComponent?: Component;
  manufacturer?: Manufacturer;
  package?: Package;
  attributeValues?: PartAttributeValue[];
}

export interface AttributeDefinition {
  id: string;
  categoryId: string;
  name: string;
  displayName: LocalizedString;
  unit: string | null;                    // Basiseinheit (z.B. "F", "Ω", "m")
  dataType: 'DECIMAL' | 'INTEGER' | 'STRING' | 'BOOLEAN';
  scope: 'COMPONENT' | 'PART' | 'BOTH';
  isFilterable: boolean;
  isRequired: boolean;
  isLabel: boolean;                       // Für dynamische Bauteilbezeichnung
  allowedPrefixes: SIPrefix[];            // Erlaubte SI-Präfixe
  // Legacy-Felder
  siUnit: string | null;
  siMultiplier: number | null;
  sortOrder: number;
  category?: Category;
}

export interface ModerationQueueItem {
  id: string;
  type: 'COMPONENT' | 'PART';
  name: LocalizedString | string;
  status: string;
  createdAt: string;
  createdBy: {
    id: string;
    username: string;
    displayName: string | null;
  } | null;
  category?: {
    id: string;
    name: LocalizedString;
    slug: string;
  };
  coreComponent?: {
    id: string;
    name: LocalizedString;
    slug: string;
  };
  manufacturer?: {
    id: string;
    name: string;
  };
}

export interface ModerationStats {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
}

export interface Stats {
  components: number;
  manufacturers: number;
  users: number;
}

export interface Pin {
  id: string;
  partId: string;
  pinNumber: string;
  pinName: string;
  pinFunction: LocalizedString | null;
  pinType: 'POWER' | 'GROUND' | 'INPUT' | 'OUTPUT' | 'BIDIRECTIONAL' | 'NC' | 'ANALOG' | 'DIGITAL' | 'CLOCK' | 'OTHER' | null;
  maxVoltage: number | null;
  maxCurrent: number | null;
}

// ConceptRelationType - Beziehungen auf Konzept-Ebene (CoreComponent)
export type ConceptRelationType =
  | 'DUAL_VERSION'
  | 'QUAD_VERSION'
  | 'LOW_POWER_VERSION'
  | 'HIGH_SPEED_VERSION'
  | 'MILITARY_VERSION'
  | 'AUTOMOTIVE_VERSION'
  | 'FUNCTIONAL_EQUIV';

// Alias für Kompatibilität (Frontend verwendet generische Namen)
export type RelationType = ConceptRelationType;

export interface ComponentRelation {
  id: string;
  sourceId: string;
  targetId: string;
  relationType: ConceptRelationType;
  notes: LocalizedString | null;
  createdAt: string;
  source?: Component;
  target?: Component;
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
