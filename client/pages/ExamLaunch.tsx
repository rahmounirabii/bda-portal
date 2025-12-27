/**
 * Exam Launch Page
 *
 * Pre-launch checklist and exam access workflow
 * DEV MODE: Simplified for testing - bypasses all checks
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthContext } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  PlayCircle,
  ArrowLeft,
  Monitor,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase } from '@/shared/config/supabase.config';
import TechCheckWidget, { TechCheckResult } from '@/components/TechCheckWidget';

// DEV MODE: Set to true to bypass all pre-launch checks for testing
// WARNING: Set to false for production!
const DEV_MODE_SKIP_ALL_CHECKS = false;

export default function ExamLaunch() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const bookingId = searchParams.get('booking_id');
  const quizId = searchParams.get('quiz_id');

  const [isLoading, setIsLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [voucher, setVoucher] = useState<any>(null);
  const [techCheckPassed, setTechCheckPassed] = useState(DEV_MODE_SKIP_ALL_CHECKS);
  const [techCheckCompleted, setTechCheckCompleted] = useState(DEV_MODE_SKIP_ALL_CHECKS);
  const [techCheckExpanded, setTechCheckExpanded] = useState(!DEV_MODE_SKIP_ALL_CHECKS);
  const [techCheckResults, setTechCheckResults] = useState<TechCheckResult[]>([]);

  useEffect(() => {
    loadData();
  }, [bookingId, quizId]);

  const handleTechCheckComplete = (results: TechCheckResult[], allPassed: boolean) => {
    setTechCheckPassed(allPassed);
    setTechCheckCompleted(true);
    setTechCheckResults(results);

    // Auto-collapse after 3.5 seconds to show compact view
    setTimeout(() => {
      setTechCheckExpanded(false);
    }, 3500);
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load booking if provided
      if (bookingId) {
        const { data: bookingData, error: bookingError } = await supabase
          .from('exam_bookings')
          .select('*, quiz:quizzes(*)')
          .eq('id', bookingId)
          .single();

        if (!bookingError && bookingData) {
          setBooking(bookingData);
          setQuiz(bookingData.quiz);

          // Get voucher if linked
          if (bookingData.voucher_id) {
            const { data: voucherData } = await supabase
              .from('exam_vouchers')
              .select('*')
              .eq('id', bookingData.voucher_id)
              .single();
            if (voucherData) setVoucher(voucherData);
          }
        }
      }

      // Load quiz if provided directly
      if (quizId && !quiz) {
        const { data: quizData, error: quizError } = await supabase
          .from('quizzes')
          .select('*')
          .eq('id', quizId)
          .single();

        if (!quizError && quizData) {
          setQuiz(quizData);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchExam = async () => {
    const targetQuizId = booking?.quiz_id || quizId;

    if (!targetQuizId) {
      toast({
        title: 'Error',
        description: 'No exam found to launch',
        variant: 'destructive',
      });
      return;
    }

    // Create exam attempt
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        toast({
          title: 'Error',
          description: 'You must be logged in to take the exam',
          variant: 'destructive',
        });
        return;
      }

      // Create the attempt
      const { data: attempt, error: attemptError } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: targetQuizId,
          user_id: authUser.id,
          exam_type: 'certification',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      // Update voucher status to 'used' if we have a voucher (can be 'available' or 'assigned')
      if (voucher && (voucher.status === 'available' || voucher.status === 'assigned')) {
        await supabase
          .from('exam_vouchers')
          .update({
            status: 'used',
            used_at: new Date().toISOString(),
            attempt_id: attempt.id,
          })
          .eq('id', voucher.id);
      }

      // Update booking with attempt_id (keep status as scheduled until exam is completed)
      if (booking) {
        await supabase
          .from('exam_bookings')
          .update({
            attempt_id: attempt.id,
          })
          .eq('id', booking.id);
      }

      toast({
        title: 'Exam Started',
        description: 'Good luck on your certification exam!',
      });

      // Navigate to the actual exam taking page
      navigate(`/certification/exam/${targetQuizId}/attempt/${attempt.id}`);
    } catch (error) {
      console.error('Error starting exam:', error);
      toast({
        title: 'Error',
        description: 'Failed to start exam. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Exam Not Found</AlertTitle>
            <AlertDescription>
              The exam you're trying to launch could not be found.
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate('/certification-exams')} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Certification Exams
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Ready to Launch</h1>
          <p className="text-lg text-gray-600">
            Your certification exam is ready to begin
          </p>
        </div>

        {/* Exam Details Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{quiz.title}</CardTitle>
            <CardDescription>
              {quiz.certification_type}™ Certification Exam
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">Duration</p>
                <p className="font-semibold">{quiz.time_limit_minutes} minutes</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-gray-500">Passing Score</p>
                <p className="font-semibold">{quiz.passing_score_percentage}%</p>
              </div>
            </div>

            {booking && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600">Confirmation Code</p>
                <p className="font-mono font-bold text-blue-800">{booking.confirmation_code}</p>
              </div>
            )}

            {voucher && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <p className="text-sm text-green-600">Voucher</p>
                <p className="font-mono font-bold text-green-800">{voucher.code}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DEV MODE Notice */}
        {DEV_MODE_SKIP_ALL_CHECKS && (
          <Alert className="mb-6 bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-800">DEV MODE</AlertTitle>
            <AlertDescription className="text-yellow-700">
              All pre-launch checks are bypassed for testing purposes.
            </AlertDescription>
          </Alert>
        )}

        {/* Tech Check - Collapsible */}
        {!DEV_MODE_SKIP_ALL_CHECKS && (
          <Card className="mb-6 animate-in fade-in-0 slide-in-from-top-4 duration-500">
            {/* Header - Always Visible */}
            <div
              className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                techCheckCompleted ? 'border-b' : ''
              }`}
              onClick={() => setTechCheckExpanded(!techCheckExpanded)}
            >
              <div className="flex items-center gap-3">
                {!techCheckCompleted ? (
                  <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                ) : techCheckPassed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">System Compatibility Check</h3>
                  <p className="text-sm text-gray-600">
                    {!techCheckCompleted
                      ? 'Running checks...'
                      : techCheckPassed
                      ? `All checks passed (${techCheckResults.filter(r => r.status === 'pass').length}/${techCheckResults.length})`
                      : 'Some checks failed - please review'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                {techCheckExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Expandable Content */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                techCheckExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <CardContent className="pt-4 pb-4">
                <TechCheckWidget
                  onComplete={handleTechCheckComplete}
                  autoStart={!techCheckCompleted}
                />
                {!techCheckPassed && techCheckCompleted && (
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTechCheckExpanded(false);
                        setTechCheckPassed(true);
                      }}
                      className="text-gray-600"
                    >
                      Skip System Check (Not Recommended)
                    </Button>
                  </div>
                )}
              </CardContent>
            </div>
          </Card>
        )}

        {/* Ready Alert */}
        <Alert className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Ready to Begin</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Ensure you have a stable internet connection</li>
              <li>Find a quiet place free from distractions</li>
              <li>The timer will start once you click "Launch Exam"</li>
              <li>You cannot pause or restart the exam once started</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleLaunchExam}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Launch Exam Now
          </Button>

          <Button
            onClick={() => navigate('/certification-exams')}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Certification Exams
          </Button>
        </div>
      </div>
    </div>
  );
}
