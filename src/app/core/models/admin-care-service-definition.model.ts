export interface AdminCareServiceDefinition {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly description: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreateAdminCareServiceDefinition {
  readonly code: string;
  readonly name: string;
  readonly description?: string | null;
}

export interface UpdateAdminCareServiceDefinition {
  readonly code?: string;
  readonly name?: string;
  readonly description?: string | null;
  readonly isActive?: boolean;
}
