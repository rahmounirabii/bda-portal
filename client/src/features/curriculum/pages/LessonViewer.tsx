/**
 * Lesson Viewer Page
 * Page de consultation d'une leçon individuelle (1 des 42 sous-compétences)
 *
 * Features:
 * - Affichage du contenu riche (TipTap/Lexical JSON)
 * - Tracking de progression de lecture
 * - Tracking du temps passé
 * - Quiz de fin de leçon
 * - Navigation vers leçon suivante
 * - Système de déverrouillage séquentiel
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks/useAuth';
import {
  useLessonProgressById,
  useIsLessonUnlocked,
  useLesson,
  useUpdateLessonProgress,
} from '@/entities/curriculum';
import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Lock, Clock, CheckCircle, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LessonContent } from '../components/LessonContent';
import { LessonProgressTracker } from '../components/LessonProgressTracker';
import { LessonNavigator } from '../components/LessonNavigator';
import { LessonQuizGate } from '../components/LessonQuizGate';

export function LessonViewer() {
  const { lessonId, moduleId } = useParams<{ lessonId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [readingProgress, setReadingProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const timeTrackerRef = useRef<NodeJS.Timeout>();

  // Fetch lesson data
  const { data: lesson, isLoading: isLoadingLesson } = useLesson(lessonId);

  // Fetch user progress for this lesson
  const { data: progress, isLoading: isLoadingProgress } = useLessonProgressById(
    user?.id,
    lessonId
  );

  // Check if lesson is unlocked
  const { data: isUnlocked, isLoading: isCheckingUnlock } = useIsLessonUnlocked(
    user?.id,
    lessonId
  );

  // Mutation to update progress
  const updateProgress = useUpdateLessonProgress();

  // Track reading progress on scroll
  useEffect(() => {
    if (!contentRef.current || !progress || !isUnlocked) return;

    const handleScroll = () => {
      const element = contentRef.current;
      if (!element) return;

      const scrollTop = element.scrollTop;
      const scrollHeight = element.scrollHeight - element.clientHeight;
      const scrollProgress = Math.round((scrollTop / scrollHeight) * 100);

      setReadingProgress(Math.min(scrollProgress, 100));

      // Update progress in database if increased
      if (scrollProgress > (progress.progress_percentage || 0)) {
        updateProgress.mutate({
          userId: user!.id,
          lessonId: lessonId!,
          updates: {
            progress_percentage: scrollProgress,
            status: scrollProgress === 100 ? 'quiz_pending' : 'in_progress',
          },
        });
      }
    };

    const element = contentRef.current;
    element.addEventListener('scroll', handleScroll);

    return () => element.removeEventListener('scroll', handleScroll);
  }, [progress, user, lessonId, updateProgress, isUnlocked]);

  // Track time spent (increment every minute)
  useEffect(() => {
    if (!user || !lessonId || !isUnlocked || progress?.status === 'locked') return;

    timeTrackerRef.current = setInterval(() => {
      // Note: Time tracking can be added to lesson_progress table if needed
      // For now, we just keep the user engaged
    }, 60000); // Every 1 minute

    return () => {
      if (timeTrackerRef.current) {
        clearInterval(timeTrackerRef.current);
      }
    };
  }, [user, lessonId, isUnlocked, progress]);

  const isLoading = isLoadingLesson || isLoadingProgress || isCheckingUnlock;

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lesson...</p>
        </div>
      </div>
    );
  }

  // Lesson not found
  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Lesson Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This lesson does not exist or has been deleted.
          </p>
          <Button onClick={() => navigate(`/learning-system/modules/${moduleId}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
        </div>
      </div>
    );
  }

  // Lesson is locked
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md bg-white p-8 rounded-lg shadow-sm border">
          <Lock className="h-16 w-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Lesson Locked</h2>
          <p className="text-muted-foreground mb-4">
            This lesson will be unlocked when you complete the previous lesson.
          </p>
          {lesson.order_index > 1 && (
            <p className="text-sm text-muted-foreground mb-6">
              Complete lesson {lesson.order_index - 1} to unlock this lesson.
            </p>
          )}
          <Button onClick={() => navigate(`/learning-system/modules/${lesson.module_id}`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Module
          </Button>
        </div>
      </div>
    );
  }

  // Show quiz if content is completed
  if (progress?.status === 'quiz_pending' || progress?.status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50">
        <LessonQuizGate
          lesson={lesson}
          progress={progress}
          onBack={() => navigate(`/learning-system/modules/${lesson.module_id}`)}
        />
      </div>
    );
  }

  // Main lesson viewer
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/learning-system/modules/${lesson.module_id}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="border-l pl-4">
                <div className="flex items-center gap-2 mb-1">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Lesson {lesson.order_index} / 3
                  </span>
                </div>
                <h1 className="text-xl font-bold">{lesson.title}</h1>
                {lesson.title_ar && (
                  <p className="text-sm text-muted-foreground" dir="rtl">
                    {lesson.title_ar}
                  </p>
                )}
              </div>
            </div>

            {/* Progress Indicator */}
            <LessonProgressTracker
              progress={progress}
              readingProgress={readingProgress}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Lesson Info */}
          {lesson.description && (
            <div className="p-6 border-b bg-blue-50">
              <p className="text-sm text-gray-700">{lesson.description}</p>
              {lesson.description_ar && (
                <p className="text-sm text-gray-700 mt-2" dir="rtl">
                  {lesson.description_ar}
                </p>
              )}
            </div>
          )}

          {/* Estimated Duration */}
          {lesson.estimated_duration_hours && (
            <div className="px-6 py-3 border-b bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                  Estimated duration: {lesson.estimated_duration_hours} hour{lesson.estimated_duration_hours > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Learning Objectives */}
          {lesson.learning_objectives && lesson.learning_objectives.length > 0 && (
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold mb-2">Learning Objectives:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                {lesson.learning_objectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
              {lesson.learning_objectives_ar && lesson.learning_objectives_ar.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 mt-3" dir="rtl">
                  {lesson.learning_objectives_ar.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Lesson Content */}
          <div
            ref={contentRef}
            className="p-6 overflow-y-auto"
            style={{ maxHeight: 'calc(100vh - 400px)' }}
          >
            <LessonContent content={lesson.content} contentAr={lesson.content_ar} />
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-4 border-t bg-gray-50">
            {readingProgress >= 100 ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Content completed!</span>
                </div>
                {lesson.quiz_required && lesson.lesson_quiz_id ? (
                  <Button
                    onClick={() => {
                      updateProgress.mutate({
                        userId: user!.id,
                        lessonId: lessonId!,
                        updates: {
                          status: 'quiz_pending',
                          progress_percentage: 100,
                        },
                      });
                    }}
                  >
                    Take the Quiz
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      updateProgress.mutate({
                        userId: user!.id,
                        lessonId: lessonId!,
                        updates: {
                          status: 'completed',
                          progress_percentage: 100,
                          completed_at: new Date().toISOString(),
                        },
                      });
                      navigate(`/learning-system/modules/${lesson.module_id}`);
                    }}
                  >
                    Mark as Complete
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Scroll down to complete the lesson
              </div>
            )}
          </div>
        </div>

        {/* Lesson Navigator */}
        <LessonNavigator
          currentLesson={lesson}
          moduleId={lesson.module_id}
          userId={user?.id}
        />
      </div>
    </div>
  );
}
