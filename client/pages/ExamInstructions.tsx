import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLanguage } from "@/contexts/LanguageContext";
import { Clock, FileText, AlertCircle } from "lucide-react";

export default function ExamInstructions() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [agreed, setAgreed] = useState(false);

  // Sample exam data - in real app this would come from API
  const examData = {
    "eng-1": {
      title: "Professional Training Fundamentals - Practice Test",
      duration: "01:00:00",
      questions: 50,
      passingScore: 70,
    },
    "eng-2": {
      title: "Advanced Certification Preparation",
      duration: "01:30:00",
      questions: 75,
      passingScore: 75,
    },
    "ar-1": {
      title: "أساسيات التدريب المهني - اختبار تجريبي",
      duration: "01:00:00",
      questions: 50,
      passingScore: 70,
    },
  };

  const exam = examData[examId as keyof typeof examData];

  if (!exam) {
    return <div>Exam not found</div>;
  }

  const handleStartExam = () => {
    if (agreed) {
      navigate(`/dashboard/exam/${examId}/test`);
    }
  };

  const instructions = [
    "This is a timed examination. You have the specified duration to complete all questions.",
    "Each question has only one correct answer. Select the best answer from the given options.",
    "You can navigate between questions using the question navigation panel on the right.",
    "Questions you have answered will be marked in purple in the navigation panel.",
    "Unanswered questions will remain white in the navigation panel.",
    "You can review and change your answers at any time during the exam.",
    "Use the 'Notes' section to jot down any important points during the exam.",
    "Click 'Continue Later' if you need to pause the exam (your progress will be saved).",
    "Click 'Finish Test' when you have completed all questions or when time runs out.",
    "Make sure you have a stable internet connection throughout the exam.",
    "Do not refresh the page or close the browser during the exam.",
    "Ensure you are in a quiet environment with minimal distractions.",
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/mock-exams")}
            className="mb-4"
          >
            ← Back to Mock Exams
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Exam Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Exam Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">{t("mockExams.duration")}</p>
                    <p className="text-sm text-gray-600">{exam.duration}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Questions</p>
                    <p className="text-sm text-gray-600">{exam.questions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Passing Score</p>
                    <p className="text-sm text-gray-600">
                      {exam.passingScore}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  {t("mockExams.instructions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  <div className="space-y-4">
                    {instructions.map((instruction, index) => (
                      <div key={index} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-white rounded-full text-sm flex items-center justify-center font-medium">
                          {index + 1}
                        </span>
                        <p className="text-sm text-gray-700">{instruction}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Agreement Checkbox */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="agreement"
                      checked={agreed}
                      onCheckedChange={(checked) =>
                        setAgreed(checked as boolean)
                      }
                    />
                    <label
                      htmlFor="agreement"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {t("mockExams.agree")}
                    </label>
                  </div>
                </div>

                {/* Start Button */}
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleStartExam}
                    disabled={!agreed}
                    className="bg-primary hover:bg-primary/90 px-8 py-3 text-lg font-semibold"
                    size="lg"
                  >
                    {t("mockExams.startExam")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
