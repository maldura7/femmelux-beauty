'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  PhotoIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { resolveImageUrl } from '@/lib/utils';

export interface ImageItem {
  id: string;
  url: string;
  file?: File;
  isPrimary?: boolean;
}

interface ImageUploadProps {
  images: ImageItem[];
  onChange: (images: ImageItem[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
  disabled = false,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || disabled) return;

      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) return;

      const newImages: ImageItem[] = [];
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      filesToProcess.forEach((file) => {
        if (file.type.startsWith('image/')) {
          const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const url = URL.createObjectURL(file);
          newImages.push({
            id,
            url,
            file,
            isPrimary: images.length === 0 && newImages.length === 0,
          });
        }
      });

      if (newImages.length > 0) {
        onChange([...images, ...newImages]);
      }
    },
    [images, maxImages, onChange, disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      // Handle file drops
      if (e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [handleFileSelect, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleRemove = useCallback(
    (id: string) => {
      if (disabled) return;

      const newImages = images.filter((img) => img.id !== id);

      // If we removed the primary image, make the first one primary
      if (newImages.length > 0 && !newImages.some((img) => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }

      // Revoke object URL if it was a local file
      const removed = images.find((img) => img.id === id);
      if (removed?.file) {
        URL.revokeObjectURL(removed.url);
      }

      onChange(newImages);
    },
    [images, onChange, disabled]
  );

  const handleSetPrimary = useCallback(
    (id: string) => {
      if (disabled) return;

      const newImages = images.map((img) => ({
        ...img,
        isPrimary: img.id === id,
      }));
      onChange(newImages);
    },
    [images, onChange, disabled]
  );

  // Drag and drop reorder handlers
  const handleImageDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      if (disabled) return;
      setDraggedIndex(index);
      e.dataTransfer.effectAllowed = 'move';
    },
    [disabled]
  );

  const handleImageDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === index || disabled) return;

      const newImages = [...images];
      const draggedImage = newImages[draggedIndex];
      newImages.splice(draggedIndex, 1);
      newImages.splice(index, 0, draggedImage);

      setDraggedIndex(index);
      onChange(newImages);
    },
    [draggedIndex, images, onChange, disabled]
  );

  const handleImageDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`
            relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
          <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-medium text-primary-600">Click to upload</span> or drag and
            drop
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, GIF up to 10MB • {images.length}/{maxImages} images
          </p>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">
              Uploaded Images ({images.length}/{maxImages})
            </p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <ArrowsUpDownIcon className="h-3 w-3" />
              Drag to reorder
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={image.id}
                draggable={!disabled}
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDragEnd={handleImageDragEnd}
                className={`
                  relative group aspect-square rounded-lg overflow-hidden border-2 cursor-move
                  ${image.isPrimary ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'}
                  ${draggedIndex === index ? 'opacity-50' : ''}
                  ${disabled ? 'cursor-not-allowed' : ''}
                `}
              >
                <Image
                  src={resolveImageUrl(image.url) || image.url}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-1 left-1 px-2 py-0.5 bg-primary-500 text-white text-xs font-medium rounded">
                    Primary
                  </div>
                )}

                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Set as Primary */}
                  {!image.isPrimary && (
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(image.id)}
                      disabled={disabled}
                      className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white hover:text-primary-600 transition-colors"
                      title="Set as primary image"
                    >
                      <StarIcon className="h-5 w-5" />
                    </button>
                  )}
                  {image.isPrimary && (
                    <div className="p-2 rounded-full bg-primary-500 text-white">
                      <StarIconSolid className="h-5 w-5" />
                    </div>
                  )}

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemove(image.id)}
                    disabled={disabled}
                    className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white hover:text-error-600 transition-colors"
                    title="Remove image"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Index Badge */}
                <div className="absolute bottom-1 right-1 w-6 h-6 flex items-center justify-center bg-black/60 text-white text-xs font-medium rounded-full">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-gray-500">
        The primary image will be shown as the main product thumbnail. Drag images to reorder
        them.
      </p>
    </div>
  );
}

export default ImageUpload;
