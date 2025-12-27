/**
 * Hook pour compter dynamiquement les éléments dans la navigation
 */

import { useQuery } from '@tanstack/react-query';
import { CurriculumService } from '@/entities/curriculum';
import { LessonService } from '@/entities/curriculum';

export function useNavigationCounts() {
  // Compter les modules
  const { data: modulesCP } = useQuery({
    queryKey: ['navigation-counts', 'modules', 'CP'],
    queryFn: async () => {
      const result = await CurriculumService.getModules({ certification_type: 'CP' });
      return result.data?.length || 0;
    },
  });

  const { data: modulesSCP } = useQuery({
    queryKey: ['navigation-counts', 'modules', 'SCP'],
    queryFn: async () => {
      const result = await CurriculumService.getModules({ certification_type: 'SCP' });
      return result.data?.length || 0;
    },
  });

  // Compter les leçons
  const { data: lessonsTotal } = useQuery({
    queryKey: ['navigation-counts', 'lessons'],
    queryFn: async () => {
      const result = await LessonService.getLessons({});
      return result.data?.length || 0;
    },
  });

  return {
    modulesTotal: (modulesCP || 0) + (modulesSCP || 0),
    modulesCP: modulesCP || 0,
    modulesSCP: modulesSCP || 0,
    lessonsTotal: lessonsTotal || 0,
  };
}
