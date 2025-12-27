/**
 * Reusable Training Batch Form Component
 * Used for both creating and editing training batches
 */

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useTrainers } from '@/entities/ecp';
import type { CreateBatchDTO, TrainingBatch, TrainingMode } from '@/entities/ecp';

interface BatchFormProps {
  initialData?: TrainingBatch;
  onSubmit: (data: CreateBatchDTO) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BatchForm({ initialData, onSubmit, onCancel, isSubmitting }: BatchFormProps) {
  const [formData, setFormData] = useState<CreateBatchDTO>({
    batch_name: initialData?.batch_name || '',
    batch_name_ar: initialData?.batch_name_ar || '',
    description: initialData?.description || '',
    certification_type: initialData?.certification_type || 'CP',
    trainer_id: initialData?.trainer_id || null,
    training_start_date: initialData?.training_start_date || '',
    training_end_date: initialData?.training_end_date || '',
    exam_date: initialData?.exam_date || null,
    training_location: initialData?.training_location || '',
    training_mode: initialData?.training_mode || 'in_person',
    max_capacity: initialData?.max_capacity || 30,
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const { data: trainers } = useTrainers({ is_active: true, status: 'approved' });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Required fields
    if (!formData.batch_name.trim()) {
      errors.batch_name = 'Batch name is required';
    } else if (formData.batch_name.length < 3) {
      errors.batch_name = 'Batch name must be at least 3 characters';
    }

    if (!formData.training_start_date) {
      errors.training_start_date = 'Start date is required';
    }

    if (!formData.training_end_date) {
      errors.training_end_date = 'End date is required';
    }

    // Date validations
    if (formData.training_start_date && formData.training_end_date) {
      const startDate = new Date(formData.training_start_date);
      const endDate = new Date(formData.training_end_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Only validate past dates for new batches
      if (!initialData && startDate < today) {
        errors.training_start_date = 'Start date cannot be in the past';
      }

      if (endDate < startDate) {
        errors.training_end_date = 'End date must be on or after start date';
      }

      // Exam date validation (must be on or after end date)
      if (formData.exam_date) {
        const examDate = new Date(formData.exam_date);
        if (examDate < endDate) {
          errors.exam_date = 'Exam date must be on or after training end date';
        }
      }
    }

    // Capacity validation
    if (formData.max_capacity < 1) {
      errors.max_capacity = 'Capacity must be at least 1';
    } else if (formData.max_capacity > 100) {
      errors.max_capacity = 'Capacity cannot exceed 100';
    }

    // Location validation for non-online modes
    if (formData.training_mode !== 'online' && !formData.training_location?.trim()) {
      errors.training_location = 'Location is required for in-person and hybrid training';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clean up form data - convert empty strings to null for optional UUID fields
    const cleanedData: CreateBatchDTO = {
      ...formData,
      trainer_id: formData.trainer_id || null,
      exam_date: formData.exam_date || null,
      batch_name_ar: formData.batch_name_ar || null,
      description: formData.description || null,
      training_location: formData.training_location || null,
    };

    await onSubmit(cleanedData);
  };

  const clearFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      setValidationErrors({ ...validationErrors, [fieldName]: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Batch Name */}
      <div>
        <Label htmlFor="batch_name">Batch Name *</Label>
        <Input
          id="batch_name"
          value={formData.batch_name}
          onChange={(e) => {
            setFormData({ ...formData, batch_name: e.target.value });
            clearFieldError('batch_name');
          }}
          placeholder="BDA Certification Preparation Course - 01"
          className={validationErrors.batch_name ? 'border-red-500' : ''}
        />
        {validationErrors.batch_name && (
          <p className="text-sm text-red-500 mt-1">{validationErrors.batch_name}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Training program description..."
          rows={3}
        />
      </div>

      {/* Training Dates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="training_start_date">Start Date *</Label>
          <Input
            id="training_start_date"
            type="date"
            value={formData.training_start_date}
            onChange={(e) => {
              setFormData({ ...formData, training_start_date: e.target.value });
              clearFieldError('training_start_date');
            }}
            className={validationErrors.training_start_date ? 'border-red-500' : ''}
          />
          {validationErrors.training_start_date && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.training_start_date}</p>
          )}
        </div>

        <div>
          <Label htmlFor="training_end_date">End Date *</Label>
          <Input
            id="training_end_date"
            type="date"
            value={formData.training_end_date}
            onChange={(e) => {
              setFormData({ ...formData, training_end_date: e.target.value });
              clearFieldError('training_end_date');
            }}
            className={validationErrors.training_end_date ? 'border-red-500' : ''}
          />
          {validationErrors.training_end_date && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.training_end_date}</p>
          )}
        </div>
      </div>

      {/* Exam Date & Trainer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="exam_date">Exam Date</Label>
          <Input
            id="exam_date"
            type="date"
            value={formData.exam_date || ''}
            onChange={(e) => {
              setFormData({ ...formData, exam_date: e.target.value || null });
              clearFieldError('exam_date');
            }}
            className={validationErrors.exam_date ? 'border-red-500' : ''}
          />
          {validationErrors.exam_date && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.exam_date}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Must be on or after training end date</p>
        </div>

        <div>
          <Label htmlFor="trainer_id">Trainer</Label>
          <Select
            value={formData.trainer_id || 'none'}
            onValueChange={(value) =>
              setFormData({ ...formData, trainer_id: value === 'none' ? null : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select trainer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No trainer assigned</SelectItem>
              {trainers?.map((trainer) => (
                <SelectItem key={trainer.id} value={trainer.id}>
                  {trainer.first_name} {trainer.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Training Mode & Capacity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="training_mode">Training Mode *</Label>
          <Select
            value={formData.training_mode}
            onValueChange={(value) =>
              setFormData({ ...formData, training_mode: value as TrainingMode })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_person">In-Person</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="max_capacity">Max Capacity *</Label>
          <Input
            id="max_capacity"
            type="number"
            min={1}
            max={100}
            value={formData.max_capacity}
            onChange={(e) => {
              setFormData({ ...formData, max_capacity: parseInt(e.target.value) || 30 });
              clearFieldError('max_capacity');
            }}
            className={validationErrors.max_capacity ? 'border-red-500' : ''}
          />
          {validationErrors.max_capacity && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.max_capacity}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">1-100 trainees per batch</p>
        </div>
      </div>

      {/* Training Location (conditional) */}
      {formData.training_mode !== 'online' && (
        <div>
          <Label htmlFor="training_location">
            Training Location {formData.training_mode !== 'online' && '*'}
          </Label>
          <Input
            id="training_location"
            value={formData.training_location || ''}
            onChange={(e) => {
              setFormData({ ...formData, training_location: e.target.value });
              clearFieldError('training_location');
            }}
            placeholder="City, Country or Venue name"
            className={validationErrors.training_location ? 'border-red-500' : ''}
          />
          {validationErrors.training_location && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.training_location}</p>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || !formData.batch_name || !formData.training_start_date || !formData.training_end_date}
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {initialData ? 'Update Batch' : 'Create Batch'}
        </Button>
      </div>
    </form>
  );
}
