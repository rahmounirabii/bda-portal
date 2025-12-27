import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QuizService } from './quiz.service';
import type {
  Quiz,
  QuizWithStats,
  QuizWithQuestions,
  QuestionWithAnswers,
  QuizAnswer,
  QuizAttempt,
  CreateQuizDTO,
  UpdateQuizDTO,
  CreateQuestionDTO,
  UpdateQuestionDTO,
  CreateAnswerDTO,
  UpdateAnswerDTO,
  QuizFilters,
  QueryOptions,
} from './quiz.types';

/**
 * React hooks for Quiz operations
 * Uses React Query for data fetching and caching
 */

// =============================================================================
// QUERY KEYS
// =============================================================================

export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (filters?: QuizFilters, options?: QueryOptions) =>
    [...quizKeys.lists(), { filters, options }] as const,
  details: () => [...quizKeys.all, 'detail'] as const,
  detail: (id: string) => [...quizKeys.details(), id] as const,
  questions: (quizId: string) => [...quizKeys.all, 'questions', quizId] as const,
  attempts: () => [...quizKeys.all, 'attempts'] as const,
  userAttempts: () => [...quizKeys.attempts(), 'user'] as const,
};

// =============================================================================
// PUBLIC QUIZ HOOKS (User-facing)
// =============================================================================

/**
 * Hook to fetch active quizzes
 */
export const useActiveQuizzes = (filters?: QuizFilters, options?: QueryOptions) => {
  return useQuery({
    queryKey: quizKeys.list(filters, options),
    queryFn: async () => {
      const result = await QuizService.getActiveQuizzes(filters, options);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch a single quiz with questions
 */
export const useQuiz = (id: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: quizKeys.detail(id),
    queryFn: async () => {
      const result = await QuizService.getQuizById(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to fetch user's quiz attempts
 */
export const useUserAttempts = () => {
  return useQuery({
    queryKey: quizKeys.userAttempts(),
    queryFn: async () => {
      const result = await QuizService.getUserAttempts();
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to start a quiz attempt
 */
export const useStartQuizAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (quizId: string) => {
      const result = await QuizService.startQuizAttempt(quizId);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: () => {
      // Invalidate user attempts to refresh the list
      queryClient.invalidateQueries({ queryKey: quizKeys.userAttempts() });
    },
  });
};

/**
 * Hook to complete a quiz attempt
 */
export const useCompleteQuizAttempt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attemptId: string) => {
      const result = await QuizService.completeQuizAttempt(attemptId);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: () => {
      // Invalidate user attempts
      queryClient.invalidateQueries({ queryKey: quizKeys.userAttempts() });
    },
  });
};

// =============================================================================
// ADMIN QUIZ HOOKS (Quiz Management)
// =============================================================================

/**
 * Hook to fetch all quizzes (admin)
 */
export const useAllQuizzes = (filters?: QuizFilters, options?: QueryOptions) => {
  return useQuery({
    queryKey: quizKeys.list(filters, options),
    queryFn: async () => {
      const result = await QuizService.getAllQuizzes(filters, options);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create a new quiz (admin)
 */
export const useCreateQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateQuizDTO) => {
      const result = await QuizService.createQuiz(dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: () => {
      // Invalidate quiz lists
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
};

/**
 * Hook to update a quiz (admin)
 */
export const useUpdateQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateQuizDTO }) => {
      const result = await QuizService.updateQuiz(id, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Invalidate specific quiz and lists
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
};

/**
 * Hook to delete a quiz (admin)
 */
export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await QuizService.deleteQuiz(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return id;
    },
    onSuccess: (id) => {
      // Invalidate specific quiz and lists
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
};

/**
 * Hook to toggle quiz active status (admin)
 */
export const useToggleQuizActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const result = await QuizService.toggleQuizActive(id, isActive);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Invalidate specific quiz and lists
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
  });
};

// =============================================================================
// QUESTION HOOKS (Admin)
// =============================================================================

/**
 * Hook to fetch questions for a quiz (admin)
 */
export const useQuizQuestions = (quizId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: quizKeys.questions(quizId),
    queryFn: async () => {
      const result = await QuizService.getQuizQuestions(quizId);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

/**
 * Hook to create a question with answers (admin)
 */
export const useCreateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateQuestionDTO) => {
      const result = await QuizService.createQuestion(dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Invalidate quiz questions and quiz detail
      queryClient.invalidateQueries({ queryKey: quizKeys.questions(data.quiz_id) });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(data.quiz_id) });
    },
  });
};

/**
 * Hook to update a question (admin)
 */
export const useUpdateQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateQuestionDTO }) => {
      const result = await QuizService.updateQuestion(id, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return result.data!;
    },
    onSuccess: (data) => {
      // Invalidate quiz questions and quiz detail
      queryClient.invalidateQueries({ queryKey: quizKeys.questions(data.quiz_id) });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(data.quiz_id) });
    },
  });
};

/**
 * Hook to delete a question (admin)
 */
export const useDeleteQuestion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quizId }: { id: string; quizId: string }) => {
      const result = await QuizService.deleteQuestion(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return { id, quizId };
    },
    onSuccess: ({ quizId }) => {
      // Invalidate quiz questions and quiz detail
      queryClient.invalidateQueries({ queryKey: quizKeys.questions(quizId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(quizId) });
    },
  });
};

// =============================================================================
// ANSWER HOOKS (Admin)
// =============================================================================

/**
 * Hook to create an answer (admin)
 */
export const useCreateAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      questionId,
      quizId,
      dto,
    }: {
      questionId: string;
      quizId: string;
      dto: CreateAnswerDTO;
    }) => {
      const result = await QuizService.createAnswer(questionId, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return { data: result.data!, quizId };
    },
    onSuccess: ({ quizId }) => {
      // Invalidate quiz questions
      queryClient.invalidateQueries({ queryKey: quizKeys.questions(quizId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(quizId) });
    },
  });
};

/**
 * Hook to update an answer (admin)
 */
export const useUpdateAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quizId, dto }: { id: string; quizId: string; dto: UpdateAnswerDTO }) => {
      const result = await QuizService.updateAnswer(id, dto);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return { data: result.data!, quizId };
    },
    onSuccess: ({ quizId }) => {
      // Invalidate quiz questions
      queryClient.invalidateQueries({ queryKey: quizKeys.questions(quizId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(quizId) });
    },
  });
};

/**
 * Hook to delete an answer (admin)
 */
export const useDeleteAnswer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, quizId }: { id: string; quizId: string }) => {
      const result = await QuizService.deleteAnswer(id);
      if (result.error) {
        throw new Error(result.error.message);
      }
      return { id, quizId };
    },
    onSuccess: ({ quizId }) => {
      // Invalidate quiz questions
      queryClient.invalidateQueries({ queryKey: quizKeys.questions(quizId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.detail(quizId) });
    },
  });
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to prefetch a quiz (for optimistic loading)
 */
export const usePrefetchQuiz = () => {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: quizKeys.detail(id),
      queryFn: async () => {
        const result = await QuizService.getQuizById(id);
        if (result.error) {
          throw new Error(result.error.message);
        }
        return result.data!;
      },
      staleTime: 5 * 60 * 1000,
    });
  };
};
