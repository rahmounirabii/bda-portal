/**
 * Create New Training Batch Page
 * Dedicated page for creating new training batches
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCreateBatch } from '@/entities/ecp';
import { BatchForm } from './components/BatchForm';
import type { CreateBatchDTO } from '@/entities/ecp';

export default function ECPTrainingBatchNew() {
  const navigate = useNavigate();
  const createMutation = useCreateBatch();

  const handleSubmit = async (data: CreateBatchDTO) => {
    await createMutation.mutateAsync(data);

    if (!createMutation.isError) {
      navigate('/ecp/trainings');
    }
  };

  const handleCancel = () => {
    navigate('/ecp/trainings');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/ecp/trainings')}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Create Training Batch
            </h1>
            <p className="mt-2 opacity-90">
              Schedule a new training cohort for certification
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Batch Information</CardTitle>
          <CardDescription>
            Fill in the details for the new training batch. All required fields are marked with an asterisk (*).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BatchForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isSubmitting={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
