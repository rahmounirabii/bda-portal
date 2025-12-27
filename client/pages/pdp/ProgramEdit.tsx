/**
 * PDP Program Edit Page
 * Edit an existing PDP program
 */

import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProgramForm } from './components/ProgramForm';
import { useProgram, useUpdateProgram } from '@/entities/pdp';
import type { CreateProgramDTO } from '@/entities/pdp';

export default function PDPProgramEdit() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: program, isLoading, error } = useProgram(id!);
  const updateMutation = useUpdateProgram();

  const handleSubmit = async (data: CreateProgramDTO) => {
    if (!id) return;

    const result = await updateMutation.mutateAsync({ id, dto: data });
    if (!result.error) {
      navigate(`/pdp/programs/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pdp/programs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Edit Program</h1>
          <p className="text-gray-600 mt-2">Edit an existing program</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Program not found or you don't have permission to edit it.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (program.status !== 'draft' && program.status !== 'rejected') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/pdp/programs')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Programs
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">Edit Program</h1>
          <p className="text-gray-600 mt-2">Edit an existing program</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You cannot edit a program that is {program.status}. Only draft and rejected programs can be edited.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/pdp/programs/${id}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Program
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Edit Program</h1>
        <p className="text-gray-600 mt-2">Update your program details</p>
      </div>

      <ProgramForm
        initialData={program}
        onSubmit={handleSubmit}
        onCancel={() => navigate(`/pdp/programs/${id}`)}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
