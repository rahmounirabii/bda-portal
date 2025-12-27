import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CertificationExamService, type CertificationExam } from '@/entities/certification-exam';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff, BarChart3, ListChecks } from 'lucide-react';
import CertificationExamForm from './components/CertificationExamForm';
import { useLanguage } from '@/contexts/LanguageContext';

export default function CertificationExamsAdmin() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<CertificationExam | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<'all' | 'CP' | 'SCP'>('all');

  // Fetch exams
  const { data: exams, isLoading, refetch } = useQuery({
    queryKey: ['certification-exams'],
    queryFn: async () => {
      const result = await CertificationExamService.getAllCertificationExams();
      if (result.error) throw result.error;
      return result.data || [];
    },
  });

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      CertificationExamService.toggleExamActive(id, isActive),
    onSuccess: () => {
      toast({
        title: t('certificationExams.statusUpdated'),
        description: t('certificationExams.statusUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['certification-exams'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('certificationExams.statusUpdateError'),
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => CertificationExamService.deleteCertificationExam(id),
    onSuccess: () => {
      toast({
        title: t('certificationExams.examDeleted'),
        description: t('certificationExams.examDeletedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['certification-exams'] });
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('certificationExams.deleteError'),
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm(t('certificationExams.deleteConfirm'))) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ id, isActive: !currentStatus });
  };

  const filteredExams = exams?.filter((exam) => {
    if (filter === 'all') return true;
    return exam.certification_type === filter;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ListChecks className="h-8 w-8" />
              {t('certificationExams.title')}
            </h1>
            <p className="mt-2 opacity-90">{t('certificationExams.subtitle')}</p>
          </div>
          <button
            onClick={() => {
              setSelectedExam(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition font-medium"
          >
            <Plus size={20} />
            {t('certificationExams.createNew')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {t('certificationExams.allExams')} ({exams?.length || 0})
        </button>
        <button
          onClick={() => setFilter('CP')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'CP'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          CP™ ({exams?.filter(e => e.certification_type === 'CP').length || 0})
        </button>
        <button
          onClick={() => setFilter('SCP')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'SCP'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          SCP™ ({exams?.filter(e => e.certification_type === 'SCP').length || 0})
        </button>
      </div>

      {/* Exams List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExams?.map((exam) => (
          <div
            key={exam.id}
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 transition hover:shadow-lg ${
              exam.certification_type === 'CP'
                ? 'border-green-500'
                : 'border-purple-500'
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      exam.certification_type === 'CP'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {exam.certification_type}™
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded ${
                      exam.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {exam.is_active ? t('common.active') : t('common.inactive')}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">{exam.title}</h3>
              </div>
            </div>

            {/* Description */}
            {exam.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {exam.description}
              </p>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-gray-500">{t('certificationExams.questions')}</p>
                <p className="font-semibold text-gray-900">{exam.question_count || 0}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('certificationExams.duration')}</p>
                <p className="font-semibold text-gray-900">{exam.time_limit_minutes} {t('common.min')}</p>
              </div>
              <div>
                <p className="text-gray-500">{t('certificationExams.passScore')}</p>
                <p className="font-semibold text-gray-900">{exam.passing_score_percentage}%</p>
              </div>
              <div>
                <p className="text-gray-500">{t('certificationExams.difficulty')}</p>
                <p className="font-semibold text-gray-900">
                  {exam.difficulty_level === 'easy'
                    ? t('certificationExams.difficultyEasy')
                    : exam.difficulty_level === 'medium'
                    ? t('certificationExams.difficultyMedium')
                    : t('certificationExams.difficultyHard')}
                </p>
              </div>
            </div>

            {/* Questions Button */}
            <button
              onClick={() => navigate(`/admin/certification-exams/${exam.id}/questions`)}
              className={`w-full mb-3 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                exam.certification_type === 'CP'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
            >
              <ListChecks size={16} />
              {t('certificationExams.manageQuestions')} ({exam.question_count || 0})
            </button>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleToggleActive(exam.id, exam.is_active)}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  exam.is_active
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
                title={exam.is_active ? t('common.deactivate') : t('common.activate')}
              >
                {exam.is_active ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => {
                  setSelectedExam(exam);
                  setShowForm(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition"
                title={t('common.edit')}
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => handleDelete(exam.id)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition"
                title={t('common.delete')}
              >
                <Trash2 size={16} />
              </button>
              <button
                onClick={() => {
                  // TODO: Navigate to stats page
                  toast({
                    title: t('common.comingSoon'),
                    description: t('certificationExams.statsComingSoon'),
                  });
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 text-sm font-medium transition"
                title={t('common.statistics')}
              >
                <BarChart3 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredExams?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">{t('certificationExams.noExamsFound')}</p>
          <button
            onClick={() => {
              setSelectedExam(null);
              setShowForm(true);
            }}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            {t('certificationExams.createFirst')}
          </button>
        </div>
      )}

      {/* Exam Form Modal */}
      {showForm && (
        <CertificationExamForm
          exam={selectedExam}
          onClose={() => {
            setShowForm(false);
            setSelectedExam(null);
          }}
        />
      )}
    </div>
  );
}
