/**
 * Bulk Upload Types
 * Types for bulk user upload via Excel/CSV (US6)
 */

// Excel column mapping based on spec
export interface BulkUserRow {
  full_name: string;
  email: string;
  phone?: string;
  country: string; // Country code (e.g., EG, US, FR)
  certification_track?: 'BDA-CP' | 'BDA-SCP'; // Optional certification track
  language: 'EN' | 'AR'; // Preferred language
}

// Validated row result
export interface ValidatedRow {
  row_number: number;
  data: BulkUserRow;
  status: 'valid' | 'error' | 'duplicate' | 'existing';
  errors: string[];
}

// Validation result
export interface BulkValidationResult {
  total_rows: number;
  valid_count: number;
  error_count: number;
  duplicate_count: number;
  existing_count: number;
  rows: ValidatedRow[];
}

// Upload result
export interface BulkUploadResult {
  success_count: number;
  error_count: number;
  skipped_count: number;
  created_users: {
    id: string;
    email: string;
    full_name: string;
  }[];
  errors: {
    row_number: number;
    email: string;
    error: string;
  }[];
}

// Progress tracking
export interface UploadProgress {
  stage: 'parsing' | 'validating' | 'uploading' | 'complete' | 'error';
  current: number;
  total: number;
  message: string;
}

// Expected Excel template columns
export const EXCEL_COLUMNS = {
  full_name: {
    required: true,
    label: 'Full Name',
    labelAr: 'الاسم الكامل',
    example: 'Ahmed Hassan',
  },
  email: {
    required: true,
    label: 'Email',
    labelAr: 'البريد الإلكتروني',
    example: 'ahmed@example.com',
  },
  phone: {
    required: false,
    label: 'Phone',
    labelAr: 'رقم الهاتف',
    example: '+971501234567',
  },
  country: {
    required: true,
    label: 'Country Code',
    labelAr: 'رمز الدولة',
    example: 'AE',
  },
  certification_track: {
    required: false,
    label: 'Certification Track',
    labelAr: 'مسار الشهادة',
    example: 'BDA-CP',
    options: ['BDA-CP', 'BDA-SCP'],
  },
  language: {
    required: true,
    label: 'Language',
    labelAr: 'اللغة',
    example: 'EN',
    options: ['EN', 'AR'],
  },
} as const;

// Supported file types
export const SUPPORTED_FILE_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'text/csv', // .csv
];

export const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.csv'];

// Country code validation
export const VALID_COUNTRY_CODES = [
  'AE', 'SA', 'EG', 'KW', 'QA', 'BH', 'OM', 'JO', 'LB', 'IQ', 'SY', 'YE', 'PS',
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT',
  'IN', 'PK', 'BD', 'LK', 'NP',
  'MY', 'SG', 'ID', 'TH', 'PH', 'VN',
  'ZA', 'NG', 'KE', 'GH', 'TZ',
  // Add more as needed
];
