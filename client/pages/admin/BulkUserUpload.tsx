/**
 * Bulk User Upload Page
 * Implements US6: Upload batch of users using Excel/CSV
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Users,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  Mail,
  BookOpen,
  RefreshCw,
} from 'lucide-react';

import {
  BulkUploadService,
  EXCEL_COLUMNS,
  SUPPORTED_EXTENSIONS,
} from '@/entities/bulk-upload';

import type {
  BulkUserRow,
  ValidatedRow,
  BulkValidationResult,
  BulkUploadResult,
  UploadProgress,
} from '@/entities/bulk-upload';

// ============================================
// VALIDATION PREVIEW COMPONENT
// ============================================

interface ValidationPreviewProps {
  validation: BulkValidationResult;
  onProceed: () => void;
  onCancel: () => void;
  isUploading: boolean;
}

const ValidationPreview: React.FC<ValidationPreviewProps> = ({
  validation,
  onProceed,
  onCancel,
  isUploading,
}) => {
  const [showAll, setShowAll] = useState(false);
  const displayRows = showAll ? validation.rows : validation.rows.slice(0, 10);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-700">{validation.total_rows}</p>
          <p className="text-sm text-blue-600">Total Rows</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-green-700">{validation.valid_count}</p>
          <p className="text-sm text-green-600">Valid</p>
        </div>
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-red-700">{validation.error_count}</p>
          <p className="text-sm text-red-600">Errors</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <p className="text-2xl font-bold text-yellow-700">
            {validation.duplicate_count + validation.existing_count}
          </p>
          <p className="text-sm text-yellow-600">Skipped</p>
        </div>
      </div>

      {/* Row Details */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left">Row</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Full Name</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Country</th>
                <th className="px-4 py-2 text-left">Issues</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayRows.map((row) => (
                <tr
                  key={row.row_number}
                  className={
                    row.status === 'valid'
                      ? 'bg-green-50'
                      : row.status === 'error'
                        ? 'bg-red-50'
                        : 'bg-yellow-50'
                  }
                >
                  <td className="px-4 py-2">{row.row_number}</td>
                  <td className="px-4 py-2">
                    {row.status === 'valid' && (
                      <span className="flex items-center gap-1 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        Valid
                      </span>
                    )}
                    {row.status === 'error' && (
                      <span className="flex items-center gap-1 text-red-700">
                        <XCircle className="h-4 w-4" />
                        Error
                      </span>
                    )}
                    {row.status === 'duplicate' && (
                      <span className="flex items-center gap-1 text-yellow-700">
                        <AlertTriangle className="h-4 w-4" />
                        Duplicate
                      </span>
                    )}
                    {row.status === 'existing' && (
                      <span className="flex items-center gap-1 text-yellow-700">
                        <AlertTriangle className="h-4 w-4" />
                        Exists
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">{row.data.full_name}</td>
                  <td className="px-4 py-2">{row.data.email}</td>
                  <td className="px-4 py-2">{row.data.country}</td>
                  <td className="px-4 py-2 text-red-600 text-xs">
                    {row.errors.join('; ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {validation.rows.length > 10 && (
          <div className="p-2 bg-gray-50 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-royal-600 text-sm hover:underline flex items-center gap-1 mx-auto"
            >
              {showAll ? (
                <>
                  Show Less <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  Show All ({validation.rows.length} rows){' '}
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <p className="text-sm text-gray-600">
          {validation.valid_count} users will be created.{' '}
          {validation.error_count > 0 && (
            <span className="text-red-600">
              {validation.error_count} rows have errors and will be skipped.
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isUploading}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            disabled={validation.valid_count === 0 || isUploading}
            className="px-4 py-2 bg-royal-600 text-white rounded-lg hover:bg-royal-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Users...
              </>
            ) : (
              <>
                <Users className="h-4 w-4" />
                Create {validation.valid_count} Users
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// RESULTS COMPONENT
// ============================================

interface UploadResultsProps {
  result: BulkUploadResult;
  onReset: () => void;
}

const UploadResults: React.FC<UploadResultsProps> = ({ result, onReset }) => {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="text-center p-8 bg-green-50 rounded-xl">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-green-800 mb-2">Upload Complete</h2>
        <p className="text-green-700">
          Successfully created {result.success_count} user accounts
        </p>
        {result.error_count > 0 && (
          <p className="text-yellow-700 mt-2">
            {result.error_count} rows had errors
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-green-700">{result.success_count}</p>
          <p className="text-sm text-green-600">Created</p>
        </div>
        <div className="bg-red-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-red-700">{result.error_count}</p>
          <p className="text-sm text-red-600">Errors</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-gray-700">{result.skipped_count}</p>
          <p className="text-sm text-gray-600">Skipped</p>
        </div>
      </div>

      {/* Errors List */}
      {result.errors.length > 0 && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <h3 className="font-medium text-red-800 mb-3">Errors</h3>
          <ul className="space-y-2 text-sm">
            {result.errors.map((err, i) => (
              <li key={i} className="text-red-700">
                Row {err.row_number} ({err.email}): {err.error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <button
          onClick={() => BulkUploadService.exportResultsCSV(result)}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export Results
        </button>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-royal-600 text-white rounded-lg hover:bg-royal-700 flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Upload More
        </button>
      </div>
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

const BulkUserUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<'upload' | 'validate' | 'result'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [validation, setValidation] = useState<BulkValidationResult | null>(null);
  const [result, setResult] = useState<BulkUploadResult | null>(null);

  // Options
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true);
  const [activateContent, setActivateContent] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsProcessing(true);
    setProgress({
      stage: 'parsing',
      current: 0,
      total: 1,
      message: 'Reading file...',
    });

    try {
      // Read file content
      const content = await file.text();

      setProgress({
        stage: 'parsing',
        current: 1,
        total: 1,
        message: 'Parsing data...',
      });

      // Parse CSV
      const rows = BulkUploadService.parseCSV(content);

      if (rows.length === 0) {
        alert('No valid data found in file. Please check the format.');
        setIsProcessing(false);
        return;
      }

      setProgress({
        stage: 'validating',
        current: 0,
        total: rows.length,
        message: 'Validating rows...',
      });

      // Validate rows
      const validationResult = await BulkUploadService.validateRows(rows);

      setValidation(validationResult);
      setStage('validate');
    } catch (error: any) {
      console.error('File processing error:', error);
      alert(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleProceed = useCallback(async () => {
    if (!validation) return;

    setIsProcessing(true);

    try {
      const uploadResult = await BulkUploadService.createUsers(
        validation.rows,
        sendWelcomeEmail,
        activateContent,
        setProgress
      );

      setResult(uploadResult);
      setStage('result');
    } catch (error: any) {
      console.error('Upload error:', error);
      alert(`Error creating users: ${error.message}`);
    } finally {
      setIsProcessing(false);
      setProgress(null);
    }
  }, [validation, sendWelcomeEmail, activateContent]);

  const handleReset = useCallback(() => {
    setStage('upload');
    setValidation(null);
    setResult(null);
    setProgress(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bulk User Upload</h1>
              <p className="text-white/80">
                Upload users via Excel or CSV file
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          {/* Progress Bar */}
          {progress && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{progress.message}</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-royal-500 transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Upload Stage */}
          {stage === 'upload' && (
            <div className="space-y-6">
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-2">Required Columns:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        <strong>Full Name</strong> - User's full name
                      </li>
                      <li>
                        <strong>Email</strong> - Valid email address
                      </li>
                      <li>
                        <strong>Country</strong> - 2-letter country code (e.g., AE, EG, US)
                      </li>
                      <li>
                        <strong>Language</strong> - EN or AR
                      </li>
                    </ul>
                    <p className="mt-2">
                      <strong>Optional:</strong> Phone, Certification Track (BDA-CP/BDA-SCP)
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Template */}
              <div className="flex justify-end">
                <button
                  onClick={() => BulkUploadService.downloadTemplate()}
                  className="text-royal-600 hover:text-royal-700 text-sm flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download CSV Template
                </button>
              </div>

              {/* Drop Zone */}
              <div
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isProcessing
                    ? 'border-gray-300 bg-gray-50'
                    : 'border-gray-300 hover:border-royal-400 cursor-pointer'
                }`}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => !isProcessing && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {isProcessing ? (
                  <div>
                    <Loader2 className="h-12 w-12 text-royal-500 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Processing file...</p>
                  </div>
                ) : (
                  <>
                    <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-gray-400 text-sm">
                      Supported formats: {SUPPORTED_EXTENSIONS.join(', ')}
                    </p>
                  </>
                )}
              </div>

              {/* Options */}
              <div className="border-t pt-4 space-y-3">
                <h3 className="font-medium text-gray-900">Options</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendWelcomeEmail}
                    onChange={(e) => setSendWelcomeEmail(e.target.checked)}
                    className="w-4 h-4 text-royal-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">Send welcome emails to new users</span>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activateContent}
                    onChange={(e) => setActivateContent(e.target.checked)}
                    className="w-4 h-4 text-royal-600 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">
                      Activate curriculum access based on certification track
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Validation Stage */}
          {stage === 'validate' && validation && (
            <ValidationPreview
              validation={validation}
              onProceed={handleProceed}
              onCancel={handleReset}
              isUploading={isProcessing}
            />
          )}

          {/* Results Stage */}
          {stage === 'result' && result && (
            <UploadResults result={result} onReset={handleReset} />
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUserUpload;
