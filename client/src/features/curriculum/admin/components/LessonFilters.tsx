/**
 * Lesson Filters Component
 * Filters for lesson search
 */

import { useQuery } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { CurriculumService, curriculumKeys } from '@/entities/curriculum';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { LessonFilters, CertificationType } from '@/entities/curriculum';

interface LessonFiltersProps {
  filters: LessonFilters;
  onFiltersChange: (filters: LessonFilters) => void;
  certType?: CertificationType;
}

export function LessonFilters({ filters, onFiltersChange, certType }: LessonFiltersProps) {
  const { t } = useLanguage();

  // Load all modules (admin view - all CP + SCP modules)
  const { data: modulesData } = useQuery({
    queryKey: curriculumKeys.modulesList(certType ? { certification_type: certType } : {}),
    queryFn: async () => {
      const result = await CurriculumService.getModules(
        certType ? { certification_type: certType } : {}
      );
      return result.data || [];
    },
  });

  const handleModuleChange = (value: string) => {
    onFiltersChange({
      ...filters,
      module_id: value === 'all' ? undefined : value,
    });
  };

  const handleOrderIndexChange = (value: string) => {
    onFiltersChange({
      ...filters,
      order_index: value === 'all' ? undefined : (parseInt(value) as 1 | 2 | 3),
    });
  };

  const handleQuizStatusChange = (value: string) => {
    if (value === 'all') {
      const { has_quiz, ...rest } = filters;
      onFiltersChange(rest);
    } else {
      onFiltersChange({
        ...filters,
        has_quiz: value === 'with-quiz',
      });
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Filter by module */}
      <div className="space-y-2">
        <Label htmlFor="module-filter">{t('lessons.moduleCompetency')}</Label>
        <Select
          value={filters.module_id || 'all'}
          onValueChange={handleModuleChange}
        >
          <SelectTrigger id="module-filter">
            <SelectValue placeholder={t('lessons.allModules')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('lessons.allModules')}</SelectItem>
            {modulesData?.map((module) => (
              <SelectItem key={module.id} value={module.id}>
                {module.competency_name}
                {module.competency_name_ar && ` / ${module.competency_name_ar}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Filter by order (1, 2, 3) */}
      <div className="space-y-2">
        <Label htmlFor="order-filter">{t('lessons.orderInModule')}</Label>
        <Select
          value={filters.order_index?.toString() || 'all'}
          onValueChange={handleOrderIndexChange}
        >
          <SelectTrigger id="order-filter">
            <SelectValue placeholder={t('lessons.allOrders')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('lessons.allOrders')}</SelectItem>
            <SelectItem value="1">{t('lessons.lesson1')}</SelectItem>
            <SelectItem value="2">{t('lessons.lesson2')}</SelectItem>
            <SelectItem value="3">{t('lessons.lesson3')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter by quiz status */}
      <div className="space-y-2">
        <Label htmlFor="quiz-filter">{t('lessons.quizStatus')}</Label>
        <Select
          value={
            filters.has_quiz === undefined
              ? 'all'
              : filters.has_quiz
              ? 'with-quiz'
              : 'without-quiz'
          }
          onValueChange={handleQuizStatusChange}
        >
          <SelectTrigger id="quiz-filter">
            <SelectValue placeholder={t('common.all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('common.all')}</SelectItem>
            <SelectItem value="with-quiz">{t('lessons.withQuizFilter')}</SelectItem>
            <SelectItem value="without-quiz">{t('lessons.withoutQuiz')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
