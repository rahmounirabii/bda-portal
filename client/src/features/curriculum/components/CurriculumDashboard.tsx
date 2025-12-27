import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Award, TrendingUp, ArrowLeft, BookOpen } from 'lucide-react';
import { ModuleCard } from './ModuleCard';
import type {
  UserCurriculumAccess,
  CurriculumModuleWithStatus,
} from '@/entities/curriculum';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';

interface CurriculumDashboardProps {
  access: UserCurriculumAccess;
  knowledgeModules: CurriculumModuleWithStatus[];
  behavioralModules: CurriculumModuleWithStatus[];
  overallProgress?: {
    completed: number;
    total: number;
    percentage: number;
    totalTimeSpent: number;
  };
  nextModule?: CurriculumModuleWithStatus | null;
}

/**
 * Main Curriculum Dashboard
 * Shows access info, progress, and 14 BoCK modules
 */
export function CurriculumDashboard({
  access,
  knowledgeModules,
  behavioralModules,
  overallProgress,
  nextModule,
}: CurriculumDashboardProps) {
  const navigate = useNavigate();

  const expiryDate = new Date(access.expires_at);
  const daysUntilExpiry = Math.ceil(
    (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const isExpiringSoon = daysUntilExpiry <= 30;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="mb-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/learning-system')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Learning System
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Training Kits
            </h1>
            <p className="text-gray-600">
              BDA Body of Competency Knowledge (BoCK) - Complete Curriculum
            </p>
          </div>
        </div>
      </div>

      {/* Access Banner */}
      <div
        className={`mb-6 p-4 rounded-lg border ${
          isExpiringSoon
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-blue-50 border-blue-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar
              className={`w-5 h-5 ${
                isExpiringSoon ? 'text-yellow-600' : 'text-blue-600'
              }`}
            />
            <div>
              <p className="font-medium text-gray-900">
                Access valid until {format(expiryDate, 'MMMM d, yyyy')}
              </p>
              <p
                className={`text-sm ${
                  isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'
                }`}
              >
                {daysUntilExpiry} days remaining
                {isExpiringSoon && ' - Consider renewing soon'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      {overallProgress && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-700">Overall Progress</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {overallProgress.percentage}%
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {overallProgress.completed} of {overallProgress.total} completed
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-700">Completed</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {overallProgress.completed}
            </p>
            <p className="text-sm text-gray-500 mt-1">modules finished</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-700">Time Spent</h3>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {Math.floor(overallProgress.totalTimeSpent / 60)}h
            </p>
            <p className="text-sm text-gray-500 mt-1">learning time</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-3 mb-2">
              <Award className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-700">In Progress</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">
              {overallProgress.total -
                overallProgress.completed -
                (overallProgress.total - knowledgeModules.length - behavioralModules.length)}
            </p>
            <p className="text-sm text-gray-500 mt-1">modules active</p>
          </div>
        </div>
      )}

      {/* Next Module CTA */}
      {nextModule && (
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 mb-1">
                Continue Learning
              </p>
              <h3 className="text-xl font-bold mb-2">
                {nextModule.competency_name}
              </h3>
              <p className="text-sm opacity-90">
                Module {nextModule.order_index} •{' '}
                {Math.ceil((nextModule.estimated_minutes || 120) / 60)} hours estimated
              </p>
            </div>
            <button
              onClick={() => navigate(`/learning-system/module/${nextModule.id}`)}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Knowledge-Based Competencies Section */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">🧠</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Knowledge-Based Competencies
            </h2>
            <p className="text-sm text-gray-600">
              7 core competencies for business development expertise
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {knowledgeModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onClick={() => navigate(`/learning-system/module/${module.id}`)}
            />
          ))}
        </div>
      </div>

      {/* Behavioral Competencies Section */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <span className="text-xl">💼</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Behavioral Competencies
            </h2>
            <p className="text-sm text-gray-600">
              7 essential soft skills for professional excellence
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {behavioralModules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onClick={() => navigate(`/learning-system/module/${module.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
