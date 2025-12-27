import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight, CheckCircle, Trophy } from 'lucide-react';
import type {
  CurriculumModule,
  UserCurriculumProgress,
} from '@/entities/curriculum';

interface QuizGateProps {
  module: CurriculumModule;
  progress: UserCurriculumProgress;
  isCompleted: boolean;
  nextModule?: CurriculumModule;
  onNextModule?: () => void;
}

/**
 * Quiz Gate Component
 * Shows quiz CTA or completion badge
 */
export function QuizGate({
  module,
  progress,
  isCompleted,
  nextModule,
  onNextModule,
}: QuizGateProps) {
  const navigate = useNavigate();

  if (isCompleted) {
    // Module completed - show success
    return (
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-8">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Trophy className="w-8 h-8 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Module Completed! 🎉
            </h3>

            <p className="text-gray-700 mb-4">
              Congratulations! You've successfully completed this module with a
              score of{' '}
              <strong className="text-green-600">
                {progress.best_quiz_score}%
              </strong>
              .
            </p>

            {progress.quiz_attempts_count > 1 && (
              <p className="text-sm text-gray-600 mb-4">
                It took you {progress.quiz_attempts_count} attempts to pass.
                Great persistence!
              </p>
            )}

            <div className="flex items-center gap-4">
              {nextModule && (
                <button
                  onClick={onNextModule}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
                >
                  Next Module
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}

              <button
                onClick={() => navigate('/learning-system')}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
              >
                Back to Curriculum
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz pending - show quiz CTA
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Award className="w-8 h-8 text-white" />
        </div>

        <div className="flex-1">
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Ready for the Quiz?
          </h3>

          <p className="text-gray-700 mb-4">
            You've completed reading this module! Take the quiz to test your
            understanding and unlock the next module.
          </p>

          <div className="bg-white rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 mb-1">Passing Score</p>
                <p className="font-semibold text-gray-900">
                  {module.quiz_passing_score}%
                </p>
              </div>

              <div>
                <p className="text-gray-600 mb-1">Quiz Type</p>
                <p className="font-semibold text-gray-900">
                  {module.quiz_required ? 'Required' : 'Optional'}
                </p>
              </div>

              {progress.quiz_attempts_count > 0 && (
                <div className="col-span-2">
                  <p className="text-gray-600 mb-1">Previous Attempts</p>
                  <p className="font-semibold text-gray-900">
                    {progress.quiz_attempts_count}{' '}
                    {progress.best_quiz_score && (
                      <span className="text-orange-600">
                        (Best: {progress.best_quiz_score}%)
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {module.quiz_id ? (
              <button
                onClick={() =>
                  navigate(`/quiz/${module.quiz_id}?module=${module.id}`)
                }
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                <CheckCircle className="w-5 h-5" />
                Take Quiz
              </button>
            ) : (
              <div className="text-yellow-600 text-sm">
                Quiz not yet configured by admin
              </div>
            )}

            <button
              onClick={() => navigate('/learning-system')}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
            >
              Save for Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
