import { useState, useRef, useCallback } from 'react';
import { Upload, X, File, FileText, Image, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import {
  formatFileSize,
  isFileTypeAllowed,
  isFileSizeValid,
  FILE_UPLOAD_CONSTRAINTS,
} from '@/shared/constants/ticket.constants';

/**
 * FileUploader Component
 *
 * Drag-and-drop file uploader with validation and preview
 * Supports multiple files and displays upload progress
 */

export interface FileWithPreview extends File {
  preview?: string;
}

export interface UploadedFile {
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

export interface FileUploaderProps {
  /**
   * Callback when files are selected/dropped
   */
  onFilesSelected: (files: File[]) => void;

  /**
   * Callback when a file is removed
   */
  onFileRemove?: (index: number) => void;

  /**
   * Maximum number of files allowed
   */
  maxFiles?: number;

  /**
   * Currently selected files
   */
  files?: UploadedFile[];

  /**
   * Whether to accept multiple files
   */
  multiple?: boolean;

  /**
   * Whether the uploader is disabled
   */
  disabled?: boolean;

  /**
   * Custom accept attribute for file input
   */
  accept?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Compact mode (smaller UI)
   */
  compact?: boolean;
}

export const FileUploader = ({
  onFilesSelected,
  onFileRemove,
  maxFiles = FILE_UPLOAD_CONSTRAINTS.MAX_FILES_PER_TICKET,
  files = [],
  multiple = true,
  disabled = false,
  accept,
  className,
  compact = false,
}: FileUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFiles = useCallback(
    (filesToValidate: FileList | File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = [];
      const errors: string[] = [];

      // Check max files limit
      if (files.length + filesToValidate.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        return { valid, errors };
      }

      Array.from(filesToValidate).forEach((file) => {
        // Check file size
        if (!isFileSizeValid(file)) {
          errors.push(
            `${file.name}: File too large (max ${formatFileSize(FILE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE)})`
          );
          return;
        }

        // Check file type
        if (!isFileTypeAllowed(file)) {
          errors.push(`${file.name}: File type not allowed`);
          return;
        }

        valid.push(file);
      });

      return { valid, errors };
    },
    [files.length, maxFiles]
  );

  const handleFileSelect = useCallback(
    (selectedFiles: FileList | File[]) => {
      setValidationError(null);

      const { valid, errors } = validateFiles(selectedFiles);

      if (errors.length > 0) {
        setValidationError(errors.join(', '));
        return;
      }

      if (valid.length > 0) {
        onFilesSelected(valid);
      }
    },
    [validateFiles, onFilesSelected]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const { files: droppedFiles } = e.dataTransfer;
      if (droppedFiles && droppedFiles.length > 0) {
        handleFileSelect(droppedFiles);
      }
    },
    [disabled, handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { files: selectedFiles } = e.target;
      if (selectedFiles && selectedFiles.length > 0) {
        handleFileSelect(selectedFiles);
      }
      // Reset input value to allow selecting same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  const getFileIcon = (file: File | UploadedFile) => {
    const actualFile = 'file' in file ? file.file : file;
    const type = actualFile.type;

    if (type.startsWith('image/')) {
      return <Image className="h-5 w-5" />;
    }
    if (type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    }
    if (
      type === 'application/msword' ||
      type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return <FileText className="h-5 w-5 text-blue-500" />;
    }
    return <File className="h-5 w-5" />;
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const acceptedTypes =
    accept || FILE_UPLOAD_CONSTRAINTS.ALLOWED_MIME_TYPES.join(',');

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'relative cursor-pointer rounded-lg border-2 border-dashed transition-all',
          {
            'border-blue-300 bg-blue-50': isDragging,
            'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100':
              !isDragging && !disabled,
            'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed': disabled,
            'p-8': !compact,
            'p-4': compact,
          }
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedTypes}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
        />

        <div className="flex flex-col items-center justify-center text-center">
          <Upload
            className={cn('mb-2 text-gray-400', {
              'h-10 w-10': !compact,
              'h-6 w-6': compact,
            })}
          />
          <p
            className={cn('font-medium text-gray-700', {
              'text-sm': compact,
            })}
          >
            {isDragging ? 'Drop files here' : 'Click or drag files to upload'}
          </p>
          <p
            className={cn('text-gray-500', {
              'text-xs mt-1': !compact,
              'text-xs': compact,
            })}
          >
            Max {formatFileSize(FILE_UPLOAD_CONSTRAINTS.MAX_FILE_SIZE)} per
            file • Up to {maxFiles} files
          </p>
        </div>
      </div>

      {/* Validation error */}
      {validationError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p>{validationError}</p>
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((uploadedFile, index) => (
            <div
              key={index}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                {
                  'border-gray-200 bg-white': uploadedFile.status === 'pending',
                  'border-blue-200 bg-blue-50': uploadedFile.status === 'uploading',
                  'border-green-200 bg-green-50': uploadedFile.status === 'success',
                  'border-red-200 bg-red-50': uploadedFile.status === 'error',
                }
              )}
            >
              {/* File icon */}
              <div className="shrink-0">{getFileIcon(uploadedFile)}</div>

              {/* File info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {uploadedFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadedFile.file.size)}
                  {uploadedFile.status === 'uploading' &&
                    ` • ${uploadedFile.progress}%`}
                  {uploadedFile.error && ` • ${uploadedFile.error}`}
                </p>

                {/* Progress bar for uploading */}
                {uploadedFile.status === 'uploading' && (
                  <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${uploadedFile.progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Status icon */}
              <div className="shrink-0">{getStatusIcon(uploadedFile.status)}</div>

              {/* Remove button */}
              {uploadedFile.status !== 'uploading' && onFileRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileRemove(index);
                  }}
                  className="shrink-0 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                  aria-label="Remove file"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

FileUploader.displayName = 'FileUploader';
