/**
 * ECP Trainer New Page
 * Register a new certified trainer
 */

import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TrainerForm } from './components/TrainerForm';
import { useCreateTrainer } from '@/entities/ecp';
import type { CreateTrainerDTO } from '@/entities/ecp';

export default function ECPTrainerNew() {
  const navigate = useNavigate();
  const createMutation = useCreateTrainer();

  const handleSubmit = async (data: CreateTrainerDTO) => {
    const result = await createMutation.mutateAsync(data);
    if (!result.error) {
      navigate('/ecp/trainers');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/ecp/trainers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trainers
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold">Add New Trainer</h1>
        <p className="text-gray-600 mt-2">Register a new certified trainer for your ECP partner</p>
      </div>

      <TrainerForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/ecp/trainers')}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
