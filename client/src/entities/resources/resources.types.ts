/**
 * Resources Entity - Types (Dynamic & Configurable)
 * Content and learning materials management
 */

export type CertificationType = 'CP' | 'SCP';

// Configuration Tables Types
export interface ResourceType {
  id: string;
  type_key: string; // 'document', 'video', etc.
  label_en: string;
  label_ar?: string;
  icon?: string; // Lucide icon name
  color?: string; // Tailwind color
  is_active: boolean;
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceCategory {
  id: string;
  category_key: string; // 'bock', 'exam_prep', etc.
  label_en: string;
  label_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon?: string;
  color?: string;
  is_active: boolean;
  display_order: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ResourceVisibilityRule {
  id: string;
  rule_key: string; // 'public', 'certification', 'purchased', etc.
  label_en: string;
  label_ar?: string;
  description_en?: string;
  description_ar?: string;
  is_active: boolean;
  created_at: string;
}

// Main Resource Type
export interface Resource {
  id: string;

  // Basic info
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;

  // File info
  file_path: string;
  file_size?: number;
  file_type?: string;
  thumbnail_path?: string;

  // Classification (FKs to config tables)
  resource_type_id: string;
  category_id?: string;
  certification_type?: CertificationType;
  tags?: string[];

  // Visibility & Access
  visibility_rule_id: string;
  requires_certification: boolean;
  requires_purchase: boolean;
  woocommerce_product_id?: number;

  // Status
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;

  // Metadata
  version?: string;
  language: string;
  download_count: number;

  // Audit
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;

  // Joined data (from queries)
  resource_type?: ResourceType;
  category?: ResourceCategory;
  visibility_rule?: ResourceVisibilityRule;
}

export interface CurriculumModule {
  id: string;
  module_name: string;
  module_name_ar?: string;
  description?: string;
  description_ar?: string;
  certification_type: CertificationType;
  module_number: number;
  parent_module_id?: string;
  learning_objectives?: string[];
  learning_objectives_ar?: string[];
  bock_domains?: string[];
  resource_ids?: string[];
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// DTOs
export interface CreateResourceTypeDTO {
  type_key: string;
  label_en: string;
  label_ar?: string;
  icon?: string;
  color?: string;
  display_order?: number;
}

export interface UpdateResourceTypeDTO {
  label_en?: string;
  label_ar?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateResourceCategoryDTO {
  category_key: string;
  label_en: string;
  label_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon?: string;
  color?: string;
  display_order?: number;
}

export interface UpdateResourceCategoryDTO {
  label_en?: string;
  label_ar?: string;
  description_en?: string;
  description_ar?: string;
  icon?: string;
  color?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateResourceDTO {
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;

  file: File; // File to upload to Supabase Storage
  thumbnail?: File;

  resource_type_id: string;
  category_id?: string;
  certification_type?: CertificationType;
  tags?: string[];

  visibility_rule_id: string;
  requires_certification?: boolean;
  requires_purchase?: boolean;
  woocommerce_product_id?: number;

  language?: string;
  version?: string;
}

export interface UpdateResourceDTO {
  title?: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;

  resource_type_id?: string;
  category_id?: string;
  certification_type?: CertificationType;
  tags?: string[];

  visibility_rule_id?: string;
  requires_certification?: boolean;
  requires_purchase?: boolean;

  status?: 'draft' | 'published' | 'archived';
  is_featured?: boolean;
  published_at?: string;
}

export interface ResourceFilters {
  resource_type_id?: string;
  category_id?: string;
  certification_type?: CertificationType | 'all';
  status?: 'draft' | 'published' | 'archived';
  visibility_rule_id?: string;
  search?: string;
  tags?: string[];
  is_featured?: boolean;
}

export interface ResourceAccessLog {
  id: string;
  resource_id: string;
  user_id: string;
  action: 'view' | 'download';
  accessed_at: string;
  ip_address?: string;
  user_agent?: string;
}

export interface ResourceError {
  code: string;
  message: string;
  details?: any;
}

export interface ResourceResult<T> {
  data: T | null;
  error: ResourceError | null;
}

// Stats & Analytics
export interface ResourceStats {
  total_resources: number;
  total_downloads: number;
  by_type: Record<string, number>;
  by_category: Record<string, number>;
  most_downloaded: Resource[];
  recent_uploads: Resource[];
}
