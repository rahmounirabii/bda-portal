import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  CheckCircle,
  XCircle,
  Clock,
  Award,
  RotateCcw,
  Download,
  Home,
} from "lucide-react";

export default function ExamResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { examId } = useParams();
  const { t } = useLanguage();

  // Get results from navigation state
  const {
    score = 0,
    correctAnswers = 0,
    totalQuestions = 50,
    timeSpent = 0,
    answers = {},
  } = location.state || {};

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isPassed = score >= 70;
  const performance =
    score >= 90
      ? "excellent"
      : score >= 80
        ? "good"
        : score >= 70
          ? "pass"
          : "fail";

  const getPerformanceColor = () => {
    switch (performance) {
      case "excellent":
        return "text-primary bg-primary/10";
      case "good":
        return "text-secondary bg-secondary/10";
      case "pass":
        return "text-yellow-700 bg-yellow-100";
      default:
        return "text-red-700 bg-red-100";
    }
  };

  const getPerformanceMessage = () => {
    switch (performance) {
      case "excellent":
        return "Outstanding performance! You've demonstrated excellent understanding.";
      case "good":
        return "Good performance! You have a solid understanding of the material.";
      case "pass":
        return "You passed! Consider reviewing some topics to improve your score.";
      default:
        return "You didn't pass this time. Review the material and try again.";
    }
  };

  const handleRetakeExam = () => {
    navigate(`/dashboard/exam/${examId}/instructions`);
  };

  const handleDownloadCertificate = () => {
    // In a real app, this would generate and download a certificate
    console.log("Downloading certificate...");
  };

  const handleReturnToDashboard = () => {
    navigate("/dashboard");
  };

  const handleReturnToMockExams = () => {
    navigate("/dashboard/mock-exams");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-4">
            {isPassed ? (
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            ) : (
              <XCircle className="h-16 w-16 text-red-600 mx-auto" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Exam Complete!
          </h1>
          <p className="text-lg text-gray-600">
            Professional Training Fundamentals - Practice Test
          </p>
        </div>

        {/* Main Results Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Score Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Award className="h-6 w-6 text-primary" />
                Your Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-6xl font-bold text-primary mb-2">
                  {score}%
                </div>
                <Badge
                  className={`text-lg px-4 py-2 ${getPerformanceColor()}`}
                  variant="secondary"
                >
                  {isPassed ? "PASSED" : "FAILED"}
                </Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Overall Score</span>
                    <span>
                      {correctAnswers} / {totalQuestions}
                    </span>
                  </div>
                  <Progress value={score} className="h-3" />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-center text-gray-700">
                    {getPerformanceMessage()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  <span className="font-medium">Correct</span>
                </div>
                <span className="text-lg font-bold text-primary">
                  {correctAnswers}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Incorrect</span>
                </div>
                <span className="text-lg font-bold text-red-600">
                  {totalQuestions - correctAnswers}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Time Spent</span>
                </div>
                <span className="text-lg font-bold text-blue-600">
                  {formatTime(timeSpent)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">Passing Score</span>
                <span className="text-lg font-bold">70%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {Math.round((correctAnswers / totalQuestions) * 100)}%
                </div>
                <p className="text-sm text-gray-600">Accuracy Rate</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {Object.keys(answers).length}
                </div>
                <p className="text-sm text-gray-600">Questions Attempted</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-royal-600 mb-2">
                  {totalQuestions - Object.keys(answers).length}
                </div>
                <p className="text-sm text-gray-600">Questions Skipped</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleRetakeExam}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Retake Exam
          </Button>

          {isPassed && (
            <Button
              onClick={handleDownloadCertificate}
              className="bg-secondary hover:bg-secondary/90 flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Certificate
            </Button>
          )}

          <Button
            onClick={handleReturnToMockExams}
            variant="outline"
            className="flex items-center gap-2"
          >
            Back to Mock Exams
          </Button>

          <Button
            onClick={handleReturnToDashboard}
            className="bg-primary hover:bg-primary/90 flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Return to Dashboard
          </Button>
        </div>

        {/* Next Steps */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Next Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Continue Learning
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Access additional study materials and resources to improve
                  your knowledge.
                </p>
                <Button size="sm" variant="outline">
                  View Resources
                </Button>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Schedule Real Exam
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Ready to take the official exam? Schedule your certification
                  exam now.
                </p>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Schedule Exam
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
