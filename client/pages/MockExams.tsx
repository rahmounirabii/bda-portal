import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  PenTool,
  Clock,
  CheckCircle,
  Search,
  Filter,
  Users,
  Star,
  Award,
  BookOpen,
  Target,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface Exam {
  id: string;
  title: string;
  duration: string;
  questions: number;
  difficulty:
    | "Beginner"
    | "Intermediate"
    | "Advanced"
    | "مبتدئ"
    | "متوسط"
    | "متقدم";
  category: string;
  description: string;
  attempts: number;
  averageScore: number;
  passingScore: number;
  lastAttempt?: string;
  bestScore?: number;
  tags: string[];
  isPopular?: boolean;
  isNew?: boolean;
}

export default function MockExams() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedExam, setSelectedExam] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [filterDifficulty, setFilterDifficulty] = useState("all");

  const englishExams: Exam[] = [
    {
      id: "eng-1",
      title: "Professional Training Fundamentals - Practice Test",
      duration: "60 minutes",
      questions: 50,
      difficulty: "Intermediate",
      category: "Training Fundamentals",
      description:
        "Master the core concepts of professional training methodology and best practices.",
      attempts: 1247,
      averageScore: 78,
      passingScore: 70,
      lastAttempt: "2024-01-15",
      bestScore: 85,
      tags: ["Popular", "Core Skills", "Foundation"],
      isPopular: true,
    },
    {
      id: "eng-2",
      title: "Advanced Certification Preparation",
      duration: "90 minutes",
      questions: 75,
      difficulty: "Advanced",
      category: "Certification",
      description:
        "Comprehensive preparation for advanced professional certification exams.",
      attempts: 892,
      averageScore: 72,
      passingScore: 75,
      lastAttempt: "2024-02-20",
      bestScore: 92,
      tags: ["Advanced", "Certification", "High Stakes"],
    },
    {
      id: "eng-3",
      title: "Basic Skills Assessment",
      duration: "45 minutes",
      questions: 30,
      difficulty: "Beginner",
      category: "Skills Assessment",
      description:
        "Evaluate your fundamental skills in professional training environments.",
      attempts: 2156,
      averageScore: 82,
      passingScore: 65,
      tags: ["Beginner Friendly", "Quick Assessment"],
      isNew: true,
    },
    {
      id: "eng-4",
      title: "Leadership in Training Programs",
      duration: "75 minutes",
      questions: 60,
      difficulty: "Advanced",
      category: "Leadership",
      description:
        "Develop leadership skills specific to training program management.",
      attempts: 654,
      averageScore: 76,
      passingScore: 80,
      tags: ["Leadership", "Management", "Strategic"],
    },
    {
      id: "eng-5",
      title: "Digital Learning Technologies",
      duration: "60 minutes",
      questions: 45,
      difficulty: "Intermediate",
      category: "Technology",
      description:
        "Stay current with modern digital learning tools and methodologies.",
      attempts: 1089,
      averageScore: 79,
      passingScore: 70,
      tags: ["Technology", "Digital", "Modern"],
      isNew: true,
    },
  ];

  const arabicExams: Exam[] = [
    {
      id: "ar-1",
      title: "أساسيات التدريب المهني - اختبار تجريبي",
      duration: "60 دقيقة",
      questions: 50,
      difficulty: "متوسط",
      category: "أساسيات التدريب",
      description:
        "إتقان المفاهيم الأساسية لمنهجية التدريب المهني وأفضل الممارسات",
      attempts: 789,
      averageScore: 75,
      passingScore: 70,
      tags: ["أساسي", "شائع", "مهارات جوهرية"],
      isPopular: true,
    },
    {
      id: "ar-2",
      title: "التحضير للشهادة المتقدمة",
      duration: "90 دقيقة",
      questions: 75,
      difficulty: "متقدم",
      category: "شهادات",
      description: "تحضير شامل لامتحانات الشهادات المهنية المتقدمة",
      attempts: 456,
      averageScore: 71,
      passingScore: 75,
      tags: ["متقدم", "شهادة", "عالي المستوى"],
    },
    {
      id: "ar-3",
      title: "تقييم المهارات الأساسية",
      duration: "45 دقيقة",
      questions: 30,
      difficulty: "مبتدئ",
      category: "تقييم المهارات",
      description: "قيم مهاراتك الأساسية في بيئات التدريب المهنية",
      attempts: 1234,
      averageScore: 80,
      passingScore: 65,
      tags: ["مبتدئ", "تقييم سريع", "أساسي"],
      isNew: true,
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    const normalizedDifficulty = difficulty.toLowerCase();
    if (
      normalizedDifficulty.includes("begin") ||
      normalizedDifficulty.includes("مبتدئ")
    ) {
      return "bg-green-100 text-green-700 border-green-200";
    } else if (
      normalizedDifficulty.includes("inter") ||
      normalizedDifficulty.includes("متوسط")
    ) {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    } else {
      return "bg-red-100 text-red-700 border-red-200";
    }
  };

  const getScoreColor = (score: number, passingScore: number) => {
    if (score >= passingScore + 15) return "text-green-600";
    if (score >= passingScore) return "text-blue-600";
    return "text-red-600";
  };

  const ExamCard = ({ exam }: { exam: Exam }) => (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md group">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-1">
            {exam.isPopular && (
              <Badge className="bg-primary/10 text-primary border-primary/20">
                <Star className="h-3 w-3 mr-1" />
                Popular
              </Badge>
            )}
            {exam.isNew && (
              <Badge className="bg-secondary/10 text-secondary border-secondary/20">
                <Calendar className="h-3 w-3 mr-1" />
                New
              </Badge>
            )}
            <Badge
              className={`border ${getDifficultyColor(exam.difficulty)}`}
              variant="outline"
            >
              {exam.difficulty}
            </Badge>
          </div>
        </div>
        <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
          {exam.title}
        </CardTitle>
        <p className="text-sm text-gray-600 line-clamp-2">{exam.description}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Exam Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{exam.duration}</span>
            </div>
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">{exam.questions} questions</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {exam.attempts.toLocaleString()} taken
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Pass: {exam.passingScore}%</span>
            </div>
          </div>

          {/* Performance Indicators */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                Average Score
              </span>
              <span
                className={`font-bold ${getScoreColor(exam.averageScore, exam.passingScore)}`}
              >
                {exam.averageScore}%
              </span>
            </div>
            {exam.bestScore && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Your Best
                </span>
                <span
                  className={`font-bold ${getScoreColor(exam.bestScore, exam.passingScore)}`}
                >
                  {exam.bestScore}%
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {exam.tags.slice(0, 3).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Action Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button
                className="w-full bg-primary hover:bg-primary/90 group-hover:scale-[1.02] transition-transform"
                onClick={() => setSelectedExam(exam.id)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {t("mockExams.startExam")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-6 w-6 text-primary" />
                  {t("mockExams.examReady")}
                </DialogTitle>
                <DialogDescription className="text-left space-y-2">
                  <p>
                    <strong>{exam.title}</strong>
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Duration: {exam.duration}</div>
                    <div>Questions: {exam.questions}</div>
                    <div>Difficulty: {exam.difficulty}</div>
                    <div>Pass Score: {exam.passingScore}%</div>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setSelectedExam(null)}>
                  Cancel
                </Button>
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    navigate(`/dashboard/exam/${selectedExam}/instructions`);
                    setSelectedExam(null);
                  }}
                >
                  {t("mockExams.startExam")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  const filteredExams = (exams: Exam[]) => {
    return exams.filter((exam) => {
      const matchesSearch =
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDifficulty =
        filterDifficulty === "all" ||
        exam.difficulty.toLowerCase().includes(filterDifficulty.toLowerCase());

      return matchesSearch && matchesDifficulty;
    });
  };

  const sortedExams = (exams: Exam[]) => {
    const filtered = filteredExams(exams);
    switch (sortBy) {
      case "popularity":
        return filtered.sort((a, b) => b.attempts - a.attempts);
      case "difficulty":
        return filtered.sort((a, b) => {
          const difficultyOrder = {
            Beginner: 1,
            مبتدئ: 1,
            Intermediate: 2,
            متوسط: 2,
            Advanced: 3,
            متقدم: 3,
          };
          return (
            (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] ||
              0) -
            (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0)
          );
        });
      case "score":
        return filtered.sort((a, b) => b.averageScore - a.averageScore);
      default:
        return filtered;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Award className="h-8 w-8 text-primary" />
            {t("mockExams.title")}
          </h1>
          <p className="mt-2 text-gray-600">
            Practice with our comprehensive mock exams to prepare for your
            certification. Track your progress and improve your skills.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 min-w-0 lg:min-w-[400px]">
          <div className="bg-primary/5 rounded-lg p-3 text-center">
            <BookOpen className="h-5 w-5 text-primary mx-auto mb-1" />
            <div className="text-lg font-bold text-primary">8</div>
            <div className="text-xs text-gray-600">Total Exams</div>
          </div>
          <div className="bg-secondary/5 rounded-lg p-3 text-center">
            <TrendingUp className="h-5 w-5 text-secondary mx-auto mb-1" />
            <div className="text-lg font-bold text-secondary">85%</div>
            <div className="text-xs text-gray-600">Avg Score</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <CheckCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-green-600">3</div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <Clock className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <div className="text-lg font-bold text-yellow-600">2</div>
            <div className="text-xs text-gray-600">In Progress</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search exams by title, description, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={filterDifficulty}
                onValueChange={setFilterDifficulty}
              >
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="difficulty">Difficulty</SelectItem>
                  <SelectItem value="score">Average Score</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exam Tabs */}
      <Tabs defaultValue="english" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="english" className="flex items-center gap-2">
            <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-medium">
              EN
            </span>
            {t("mockExams.english")}
          </TabsTrigger>
          <TabsTrigger value="arabic" className="flex items-center gap-2">
            <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-medium">
              AR
            </span>
            {t("mockExams.arabic")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="english" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedExams(englishExams).map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
          {filteredExams(englishExams).length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No exams found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search or filter criteria.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="arabic" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {sortedExams(arabicExams).map((exam) => (
              <ExamCard key={exam.id} exam={exam} />
            ))}
          </div>
          {filteredExams(arabicExams).length === 0 && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                لم يتم العثور على امتحانات
              </h3>
              <p className="text-gray-600">
                حاول تعديل معايير البحث أو التصفية.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
