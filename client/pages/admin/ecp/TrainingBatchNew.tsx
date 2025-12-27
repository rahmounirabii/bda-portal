/**
 * Admin - Create New Training Batch Page
 * Create training batches for ECP partners
 *
 * TODO: Add partner selection dropdown before the form
 */

import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, Building2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateBatch } from '@/entities/ecp';
import { BatchForm } from '../../ecp/components/BatchForm';
import type { CreateBatchDTO } from '@/entities/ecp';

export default function AdminECPTrainingBatchNew() {
  const navigate = useNavigate();
  const createMutation = useCreateBatch();

  const handleSubmit = async (data: CreateBatchDTO) => {
    await createMutation.mutateAsync(data);

    if (!createMutation.isError) {
      navigate('/admin/ecp/trainings');
    }
  };

  const handleCancel = () => {
    navigate('/admin/ecp/trainings');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
              Create Training Batch
            </h1>
            <p className="mt-2 opacity-90">
              Create a new training batch for an ECP partner
            </p>
          </div>
        </div>
      </div>

      {/* Partner Selection Note */}
      <Alert>
        <Building2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Note:</strong> This creates a batch for the current partner context. Full partner selection interface coming soon.
        </AlertDescription>
      </Alert>

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
