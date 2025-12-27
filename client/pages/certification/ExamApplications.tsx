import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Clock,
  Award,
  ChevronRight,
  Filter,
  ShieldCheck,
  Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useActiveQuizzes, useVoucherCountsByCertType, useUserVouchers } from '@/entities/quiz';
import type { CertificationType, DifficultyLevel, Quiz } from '@/entities/quiz/quiz.types';
import { cn } from '@/shared/utils/cn';

/**
 * ExamApplications Page
 * Lists available certification exams (CP™, SCP™)
 */

const CERTIFICATION_LABELS: Record<CertificationType, string> = {
  CP: 'Certified Professional (CP™)',
  SCP: 'Senior Certified Professional (SCP™)',
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: 'text-green-700 bg-green-100 border-green-300',
  medium: 'text-yellow-700 bg-yellow-100 border-yellow-300',
  hard: 'text-red-700 bg-red-100 border-red-300',
};

export default function ExamApplications() {
  const navigate = useNavigate();

  // Filters
  const [certificationFilter, setCertificationFilter] = useState<CertificationType | 'all'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyLevel | 'all'>('all');

  // Build filters object
  const filters = {
    certification_type: certificationFilter !== 'all' ? certificationFilter : undefined,
    difficulty_level: difficultyFilter !== 'all' ? difficultyFilter : undefined,
  };

  // Fetch data
  const { data: quizzes, isLoading } = useActiveQuizzes(filters);
  const { data: userVouchers, isLoading: vouchersLoading } = useUserVouchers();
  const voucherCounts = useVoucherCountsByCertType();

  // Filter quizzes to show only those for which user has a valid voucher
  const accessibleQuizzes = quizzes?.filter((quiz) => {
    if (!userVouchers) return false;

    const now = new Date();

    // Check if user has a valid voucher for this quiz
    return userVouchers.some((voucher) => {
      // Must be available and not expired
      if (voucher.status !== 'available') return false;
      if (new Date(voucher.expires_at) <= now) return false;

      // Must match certification type
      if (voucher.certification_type !== quiz.certification_type) return false;

      // Either specific quiz match OR wildcard (quiz_id is null)
      return voucher.quiz_id === quiz.id || voucher.quiz_id === null;
    });
  });

  const isLoadingData = isLoading || vouchersLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-8 w-8" />
          Certification Exams
        </h1>
        <p className="mt-2 opacity-90">
          Apply for official BDA certification exams (CP™, SCP™)
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Award className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">
                Voucher Required
              </h3>
              <p className="text-sm text-blue-800">
                You can only see exams for which you have a valid voucher. Purchase a certification book
                from our store to receive exam vouchers. Each book includes voucher(s) for the corresponding
                certification level (CP™ or SCP™).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={certificationFilter}
                onValueChange={(value) => setCertificationFilter(value as CertificationType | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Certification Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="CP">CP™ - Certified Professional</SelectItem>
                  <SelectItem value="SCP">SCP™ - Senior Certified Professional</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={difficultyFilter}
                onValueChange={(value) => setDifficultyFilter(value as DifficultyLevel | 'all')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Difficulty Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exams List */}
      {isLoadingData ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading certification exams...</p>
        </div>
      ) : !accessibleQuizzes || accessibleQuizzes.length === 0 ? (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-12 text-center">
            <Ticket className="h-16 w-16 text-orange-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-orange-900 mb-2">
              No Exams Available
            </h3>
            <p className="text-orange-800 mb-4">
              You don't have any valid exam vouchers yet. Purchase a certification book from our store to get access to exams.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                className="border-orange-300 text-orange-900 hover:bg-orange-100"
                onClick={() => window.open('/store', '_blank')}
              >
                <Ticket className="h-4 w-4 mr-2" />
                Visit Store
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {accessibleQuizzes.map((quiz) => (
            <Card
              key={quiz.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/exam-applications/${quiz.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Title */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-3 rounded-lg bg-indigo-100">
                        <GraduationCap className="h-6 w-6 text-royal-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {quiz.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {quiz.description}
                        </p>
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge variant="outline" className="font-semibold">
                        {CERTIFICATION_LABELS[quiz.certification_type]}
                      </Badge>
                      <Badge className={cn('border', DIFFICULTY_COLORS[quiz.difficulty_level])}>
                        {DIFFICULTY_LABELS[quiz.difficulty_level]}
                      </Badge>
                      {/* Voucher Badge */}
                      {voucherCounts[quiz.certification_type] > 0 ? (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <Ticket className="h-3 w-3 mr-1" />
                          {voucherCounts[quiz.certification_type]} voucher{voucherCounts[quiz.certification_type] > 1 ? 's' : ''} available
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          <Ticket className="h-3 w-3 mr-1" />
                          No voucher
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>{quiz.time_limit_minutes} minutes</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Passing score: <span className="font-semibold">{quiz.passing_score_percentage}%</span>
                      </div>
                    </div>

                    {/* Stats */}
                    {quiz.question_count !== undefined && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">{quiz.question_count}</span> questions
                        {quiz.total_points !== undefined && (
                          <span> • <span className="font-medium">{quiz.total_points}</span> total points</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/exam-applications/${quiz.id}`);
                    }}
                  >
                    View Details
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

ExamApplications.displayName = 'ExamApplications';
