'use client';

import { useState, useCallback, useRef } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  XMarkIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

// ============================================
// TYPES
// ============================================

export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedTypes?: string[];
  label?: string;
  helpText?: string;
}

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return 'image';
  if (type === 'application/pdf') return 'pdf';
  return 'document';
}

// ============================================
// FILE UPLOAD COMPONENT
// ============================================

export default function FileUpload({
  files,
  onFilesChange,
  maxFiles = 5,
  maxSize = DEFAULT_MAX_SIZE,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  label = 'Upload Documents',
  helpText,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate file
  const validateFile = useCallback(
    (file: File): string | null => {
      if (!acceptedTypes.includes(file.type)) {
        return `Invalid file type. Accepted: ${acceptedTypes.map((t) => t.split('/')[1].toUpperCase()).join(', ')}`;
      }
      if (file.size > maxSize) {
        return `File too large. Maximum size: ${formatFileSize(maxSize)}`;
      }
      return null;
    },
    [acceptedTypes, maxSize]
  );

  // Add files
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const fileArray = Array.from(newFiles);
      const remainingSlots = maxFiles - files.length;

      if (remainingSlots <= 0) {
        return;
      }

      const filesToAdd = fileArray.slice(0, remainingSlots).map((file) => {
        const error = validateFile(file);
        return {
          id: generateId(),
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: error ? 'error' : 'pending',
          progress: 0,
          error,
        } as UploadedFile;
      });

      onFilesChange([...files, ...filesToAdd]);
    },
    [files, maxFiles, onFilesChange, validateFile]
  );

  // Remove file
  const removeFile = useCallback(
    (id: string) => {
      onFilesChange(files.filter((f) => f.id !== id));
    },
    [files, onFilesChange]
  );

  // Handle drag events
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  // Handle file input change
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        addFiles(e.target.files);
      }
      // Reset input so same file can be selected again
      e.target.value = '';
    },
    [addFiles]
  );

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const canAddMore = files.length < maxFiles;

  return (
    <div className="space-y-4">
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-secondary-900">{label}</label>
      )}

      {/* Drop Zone */}
      {canAddMore && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-all duration-200
            ${
              isDragOver
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileChange}
            className="hidden"
          />

          <CloudArrowUpIcon
            className={`mx-auto h-12 w-12 ${isDragOver ? 'text-primary-500' : 'text-gray-400'}`}
          />
          <p className="mt-4 text-sm text-secondary-900">
            <span className="font-medium text-primary-600 hover:text-primary-500">
              Click to upload
            </span>{' '}
            or drag and drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {acceptedTypes.map((t) => t.split('/')[1].toUpperCase()).join(', ')} up to{' '}
            {formatFileSize(maxSize)}
          </p>
          {helpText && <p className="mt-2 text-xs text-gray-500">{helpText}</p>}
          <p className="mt-2 text-xs text-gray-400">
            {files.length} / {maxFiles} files uploaded
          </p>
        </div>
      )}

      {/* File List */}
      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className={`
                flex items-center gap-3 p-3 rounded-lg border
                ${
                  file.status === 'error'
                    ? 'border-red-200 bg-red-50'
                    : file.status === 'success'
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }
              `}
            >
              {/* File Icon */}
              <div
                className={`
                  flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                  ${
                    file.status === 'error'
                      ? 'bg-red-100'
                      : file.status === 'success'
                      ? 'bg-green-100'
                      : 'bg-gray-200'
                  }
                `}
              >
                {getFileIcon(file.type) === 'image' ? (
                  <img
                    src={URL.createObjectURL(file.file)}
                    alt={file.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <DocumentIcon
                    className={`w-5 h-5 ${
                      file.status === 'error'
                        ? 'text-red-600'
                        : file.status === 'success'
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}
                  />
                )}
              </div>

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                {file.error && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <ExclamationCircleIcon className="w-3 h-3" />
                    {file.error}
                  </p>
                )}
              </div>

              {/* Status Icon / Remove Button */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {file.status === 'success' && (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                )}
                {file.status === 'uploading' && (
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Max files reached message */}
      {!canAddMore && (
        <p className="text-sm text-amber-600">
          Maximum number of files ({maxFiles}) reached. Remove a file to add more.
        </p>
      )}
    </div>
  );
}
