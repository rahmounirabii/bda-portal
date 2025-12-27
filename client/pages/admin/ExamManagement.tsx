import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Power,
  PowerOff,
  GraduationCap,
  Clock,
  Target,
  TrendingUp,
  Crown,
  Globe,
  LayoutList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  useExamsAdmin,
  useDeleteExam,
  useToggleExamActive,
} from '@/entities/mock-exam';
import {
  EXAM_CATEGORY_LABELS,
  EXAM_DIFFICULTY_LABELS,
  EXAM_LANGUAGE_LABELS,
  ExamCategory,
  ExamDifficulty,
} from '@/entities/mock-exam/mock-exam.types';
import { cn } from '@/shared/utils/cn';
import { useToast } from '@/components/ui/use-toast';
import { useConfirm } from '@/contexts/ConfirmDialogContext';
import { formatDistanceToNow } from 'date-fns';

/**
 * ExamManagement Page
 * Admin page for managing mock exams (CRUD operations)
 */

export default function ExamManagement() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { confirm } = useConfirm();

  // Filters state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExamCategory | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<ExamDifficulty | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Build filters object
  const filters = {
    search: search || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
    difficulty: difficultyFilter !== 'all' ? difficultyFilter : undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
  };

  // Data fetching
  const { data: exams, isLoading } = useExamsAdmin(filters);
  const deleteExamMutation = useDeleteExam();
  const toggleActiveMutation = useToggleExamActive();

  // Calculate summary statistics
  const totalExams = exams?.length || 0;
  const activeExams = exams?.filter((e) => e.is_active).length || 0;
  const totalQuestions = exams?.reduce((sum, e) => sum + e.total_questions, 0) || 0;
  const avgPassRate =
    exams && exams.length > 0
      ? Math.round(exams.reduce((sum, e) => sum + e.pass_rate, 0) / exams.length)
      : 0;

  // Handlers
  const handleDelete = async (id: string, title: string) => {
    const confirmed = await confirm({
      title: t('examMgmt.deleteExam'),
      description: t('examMgmt.deleteConfirmDesc').replace('{title}', title),
      confirmText: t('common.delete'),
      variant: 'destructive',
    });

    if (!confirmed) return;

    const { error } = await deleteExamMutation.mutateAsync(id);

    if (error) {
      toast({
        title: t('common.error'),
        description: t('examMgmt.deleteError'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.success'),
        description: t('examMgmt.deleteSuccess'),
      });
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean, title: string) => {
    const newStatus = !currentStatus;

    const confirmed = await confirm({
      title: newStatus ? t('examMgmt.activateExam') : t('examMgmt.deactivateExam'),
      description: (newStatus ? t('examMgmt.activateConfirmDesc') : t('examMgmt.deactivateConfirmDesc')).replace('{title}', title),
      confirmText: newStatus ? t('common.activate') : t('common.deactivate'),
    });

    if (!confirmed) return;

    const { error } = await toggleActiveMutation.mutateAsync({ id, isActive: newStatus });

    if (error) {
      toast({
        title: t('common.error'),
        description: newStatus ? t('examMgmt.activateError') : t('examMgmt.deactivateError'),
        variant: 'destructive',
      });
    } else {
      toast({
        title: t('common.success'),
        description: newStatus ? t('examMgmt.activateSuccess') : t('examMgmt.deactivateSuccess'),
      });
    }
  };

  const getDifficultyColor = (difficulty: ExamDifficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-700 bg-green-100 border-green-300';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'hard':
        return 'text-red-700 bg-red-100 border-red-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <GraduationCap className="h-8 w-8" />
          {t('examMgmt.title')}
        </h1>
        <p className="mt-2 opacity-90">
          {t('examMgmt.subtitle')}
        </p>
        <div className="mt-4">
          <Button
            onClick={() => navigate('/admin/exams/new')}
            variant="secondary"
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('examMgmt.createNewExam')}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100">
                <GraduationCap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalExams}</p>
                <p className="text-sm font-medium text-gray-600">{t('examMgmt.totalExams')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100">
                <Power className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{activeExams}</p>
                <p className="text-sm font-medium text-gray-600">{t('examMgmt.activeExams')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100">
                <Target className="h-6 w-6 text-royal-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{totalQuestions}</p>
                <p className="text-sm font-medium text-gray-600">{t('examMgmt.totalQuestions')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-100">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{avgPassRate}%</p>
                <p className="text-sm font-medium text-gray-600">{t('examMgmt.avgPassRate')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t('examMgmt.searchExams')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as ExamCategory | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('examMgmt.category')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('examMgmt.allCategories')}</SelectItem>
                <SelectItem value="cp">{t('examMgmt.cpExam')}</SelectItem>
                <SelectItem value="scp">{t('examMgmt.scpExam')}</SelectItem>
                <SelectItem value="general">{t('examMgmt.generalKnowledge')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={difficultyFilter}
              onValueChange={(value) => setDifficultyFilter(value as ExamDifficulty | 'all')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('examMgmt.difficulty')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('examMgmt.allDifficulties')}</SelectItem>
                <SelectItem value="easy">{t('examMgmt.easy')}</SelectItem>
                <SelectItem value="medium">{t('examMgmt.medium')}</SelectItem>
                <SelectItem value="hard">{t('examMgmt.hard')}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | 'active' | 'inactive')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('common.status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('examMgmt.allStatus')}</SelectItem>
                <SelectItem value="active">{t('common.active')}</SelectItem>
                <SelectItem value="inactive">{t('common.inactive')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Exams Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('examMgmt.examsList')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-600">{t('examMgmt.loadingExams')}</p>
            </div>
          ) : !exams || exams.length === 0 ? (
            <div className="text-center py-12">
              <GraduationCap className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{t('examMgmt.noExamsFound')}</p>
              <Button onClick={() => navigate('/admin/exams/new')} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                {t('examMgmt.createFirstExam')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('examMgmt.tableTitle')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('examMgmt.category')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                      {t('examMgmt.difficulty')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {t('examMgmt.questions')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {t('examMgmt.duration')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {t('examMgmt.passRate')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                      {t('common.status')}
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{exam.title}</p>
                            {exam.is_premium && (
                              <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                {t('examMgmt.premium')}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {EXAM_LANGUAGE_LABELS[exam.language]}
                            </span>
                            <span>•</span>
                            <span>{exam.total_attempts} {t('examMgmt.attempts')}</span>
                            {exam.last_attempt_date && (
                              <>
                                <span>•</span>
                                <span>Last: {formatDistanceToNow(
                                  new Date(exam.last_attempt_date),
                                  { addSuffix: true }
                                )}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">
                          {EXAM_CATEGORY_LABELS[exam.category]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={cn('border', getDifficultyColor(exam.difficulty))}>
                          {EXAM_DIFFICULTY_LABELS[exam.difficulty]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-medium">{exam.total_questions}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span>{exam.duration_minutes}m</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'font-medium',
                            exam.pass_rate >= 70
                              ? 'text-green-600'
                              : exam.pass_rate >= 50
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          )}
                        >
                          {exam.pass_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {exam.is_active ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300">
                            <Power className="h-3 w-3 mr-1" />
                            {t('common.active')}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-700 border-gray-300">
                            <PowerOff className="h-3 w-3 mr-1" />
                            {t('common.inactive')}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/admin/exams/${exam.id}/questions`)}
                            title={t('examMgmt.manageQuestions')}
                          >
                            <LayoutList className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/admin/exams/${exam.id}/edit`)}
                            title={t('common.edit')}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(exam.id, exam.is_active, exam.title)}
                            title={exam.is_active ? t('common.deactivate') : t('common.activate')}
                          >
                            {exam.is_active ? (
                              <PowerOff className="h-4 w-4 text-orange-600" />
                            ) : (
                              <Power className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(exam.id, exam.title)}
                            title={t('common.delete')}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

ExamManagement.displayName = 'ExamManagement';
