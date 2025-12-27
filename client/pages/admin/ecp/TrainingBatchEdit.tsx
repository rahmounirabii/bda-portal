/**
 * Admin - Edit Training Batch Page
 * Edit training batches for any ECP partner
 */

import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useBatch, useUpdateBatch } from '@/entities/ecp';
import { BatchForm } from '../../ecp/components/BatchForm';
import type { CreateBatchDTO } from '@/entities/ecp';

export default function AdminECPTrainingBatchEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: batch, isLoading, error } = useBatch(id!);
  const updateMutation = useUpdateBatch();

  const handleSubmit = async (data: CreateBatchDTO) => {
    if (!id) return;

    await updateMutation.mutateAsync({
      id,
      dto: data,
    });

    if (!updateMutation.isError) {
      navigate(`/admin/ecp/trainings/${id}`);
    }
  };

  const handleCancel = () => {
    navigate(id ? `/admin/ecp/trainings/${id}` : '/admin/ecp/trainings');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/ecp/trainings')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                Edit Training Batch
              </h1>
            </div>
          </div>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Training batch not found.
          </AlertDescription>
        </Alert>

        <Button onClick={() => navigate('/admin/ecp/trainings')}>
          Back to Training Batches
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/admin/ecp/trainings/${id}`)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Edit Training Batch
            </h1>
            <p className="mt-2 opacity-90">
              Update the training batch details
            </p>
          </div>
        </div>
      </div>

      {/* Partner & Batch Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-500">ECP Partner</span>
              </div>
              <CardTitle>{batch.batch_name}</CardTitle>
              <CardDescription className="font-mono">{batch.batch_code}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Information</CardTitle>
          <CardDescription>
            Update the training batch details. All required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BatchForm
            initialData={batch}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
