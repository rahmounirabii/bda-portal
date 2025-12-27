/**
 * ECP Performance Reports
 *
 * Generate and export performance reports filtered by program, date, trainer, location
 * Export to PDF and Excel formats
 */

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Download,
  Calendar,
  Users,
  Award,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  FileSpreadsheet,
  BookOpen,
} from "lucide-react";
import {
  usePerformanceMetrics,
  useBatches,
  useTrainers,
  useTrainees,
} from "@/entities/ecp";
import type { PerformanceMetrics, CertificationType } from "@/entities/ecp";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useLanguage } from "@/contexts/LanguageContext";

// ============================================================================
// Translations
// ============================================================================

const translations = {
  en: {
    // Header
    title: 'Performance Reports',
    subtitle: 'Track success rates, training hours, and candidate progress',
    exportExcel: 'Export Excel',
    exportPdf: 'Export PDF',
    // Summary cards
    totalTrainees: 'Total Trainees',
    passRate: 'Pass Rate',
    certified: 'Certified',
    trainingHours: 'Training Hours',
    batches: 'Batches',
    // Success rate overview
    successRateOverview: 'Success Rate Overview',
    overallPassRate: 'Overall Pass Rate',
    passed: 'Passed',
    failed: 'Failed',
    // Filters
    reportFilters: 'Report Filters',
    periodType: 'Period Type',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
    program: 'Program',
    allPrograms: 'All Programs',
    trainer: 'Trainer',
    allTrainers: 'All Trainers',
    fromDate: 'From Date',
    toDate: 'To Date',
    // Batch performance table
    batchPerformanceReport: 'Batch Performance Report',
    batchPerformanceDesc: 'Performance breakdown by training batch',
    batch: 'Batch',
    location: 'Location',
    trainees: 'Trainees',
    avgScore: 'Avg Score',
    hours: 'Hours',
    noCompletedBatches: 'No completed batches found',
    completeBatchesHint: 'Complete some training batches to see performance data',
    // Trainer performance
    trainerPerformanceSummary: 'Trainer Performance Summary',
    trainerPerformanceDesc: 'Performance metrics by trainer',
    batchSingular: 'batch',
    batchPlural: 'batches',
    passRateLabel: 'pass rate',
    ofCandidatesCertified: (certified: number, total: number) => `${certified} of ${total} candidates certified`,
    noTrainerData: 'No trainer performance data available',
    assignTrainersHint: 'Assign trainers to batches to see their performance',
    // Historical metrics
    historicalMetrics: 'Historical Performance Metrics',
    historicalMetricsDesc: (period: string) => `Aggregated performance data by ${period} period`,
    period: 'Period',
    examsTaken: 'Exams Taken',
    certifications: 'Certifications',
    // Toast messages
    pdfExported: 'PDF Exported',
    pdfSavedAs: (filename: string) => `Report saved as ${filename}`,
    excelExported: 'Excel Exported',
    excelSavedAs: (filename: string) => `Report saved as ${filename}`,
    // Export labels
    unassigned: 'Unassigned',
    na: 'N/A',
  },
  ar: {
    // Header
    title: 'تقارير الأداء',
    subtitle: 'تتبع معدلات النجاح وساعات التدريب وتقدم المرشحين',
    exportExcel: 'تصدير Excel',
    exportPdf: 'تصدير PDF',
    // Summary cards
    totalTrainees: 'إجمالي المتدربين',
    passRate: 'معدل النجاح',
    certified: 'معتمدون',
    trainingHours: 'ساعات التدريب',
    batches: 'الدفعات',
    // Success rate overview
    successRateOverview: 'نظرة عامة على معدل النجاح',
    overallPassRate: 'معدل النجاح الإجمالي',
    passed: 'ناجحون',
    failed: 'راسبون',
    // Filters
    reportFilters: 'فلاتر التقرير',
    periodType: 'نوع الفترة',
    monthly: 'شهري',
    quarterly: 'ربع سنوي',
    yearly: 'سنوي',
    program: 'البرنامج',
    allPrograms: 'جميع البرامج',
    trainer: 'المدرب',
    allTrainers: 'جميع المدربين',
    fromDate: 'من تاريخ',
    toDate: 'إلى تاريخ',
    // Batch performance table
    batchPerformanceReport: 'تقرير أداء الدفعات',
    batchPerformanceDesc: 'تحليل الأداء حسب دفعة التدريب',
    batch: 'الدفعة',
    location: 'الموقع',
    trainees: 'المتدربون',
    avgScore: 'متوسط الدرجات',
    hours: 'الساعات',
    noCompletedBatches: 'لم يتم العثور على دفعات مكتملة',
    completeBatchesHint: 'أكمل بعض دفعات التدريب لرؤية بيانات الأداء',
    // Trainer performance
    trainerPerformanceSummary: 'ملخص أداء المدربين',
    trainerPerformanceDesc: 'مقاييس الأداء حسب المدرب',
    batchSingular: 'دفعة',
    batchPlural: 'دفعات',
    passRateLabel: 'معدل النجاح',
    ofCandidatesCertified: (certified: number, total: number) => `${certified} من ${total} مرشح معتمد`,
    noTrainerData: 'لا تتوفر بيانات أداء المدربين',
    assignTrainersHint: 'قم بتعيين مدربين للدفعات لرؤية أدائهم',
    // Historical metrics
    historicalMetrics: 'مقاييس الأداء التاريخية',
    historicalMetricsDesc: (period: string) => `بيانات الأداء المجمعة حسب الفترة ${period === 'monthly' ? 'الشهرية' : period === 'quarterly' ? 'الربع سنوية' : 'السنوية'}`,
    period: 'الفترة',
    examsTaken: 'الامتحانات المقدمة',
    certifications: 'الشهادات',
    // Toast messages
    pdfExported: 'تم تصدير PDF',
    pdfSavedAs: (filename: string) => `تم حفظ التقرير باسم ${filename}`,
    excelExported: 'تم تصدير Excel',
    excelSavedAs: (filename: string) => `تم حفظ التقرير باسم ${filename}`,
    // Export labels
    unassigned: 'غير معين',
    na: 'غير متوفر',
  },
};

export default function ECPReports() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const texts = translations[language];

  // Filters
  const [periodType, setPeriodType] = useState<'monthly' | 'quarterly' | 'yearly'>('quarterly');
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [trainerFilter, setTrainerFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Fetch data from database
  const { data: metrics, isLoading: metricsLoading } = usePerformanceMetrics(periodType);
  const { data: batches, isLoading: batchesLoading } = useBatches({});
  const { data: trainers, isLoading: trainersLoading } = useTrainers({});
  const { data: trainees, isLoading: traineesLoading } = useTrainees({});

  const isLoading = metricsLoading || batchesLoading || trainersLoading || traineesLoading;

  // Calculate aggregated stats from trainees
  const aggregatedStats = useMemo(() => {
    if (!trainees) return { total: 0, passed: 0, failed: 0, certified: 0, hours: 0 };

    const certified = trainees.filter(t => t.certified).length;
    const passed = trainees.filter(t => t.exam_passed === true).length;
    const failed = trainees.filter(t => t.exam_passed === false).length;
    const total = trainees.length;

    // Estimate training hours from batches
    const hours = batches?.reduce((acc, batch) => {
      if (batch.status === 'completed' || batch.status === 'in_progress') {
        const start = new Date(batch.training_start_date);
        const end = new Date(batch.training_end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return acc + (days * 8); // Assume 8 hours per day
      }
      return acc;
    }, 0) || 0;

    return { total, passed, failed, certified, hours };
  }, [trainees, batches]);

  // Filter metrics by date range
  const filteredMetrics = useMemo(() => {
    if (!metrics) return [];

    return metrics.filter(m => {
      const matchesDateFrom = !dateFrom || m.period_start >= dateFrom;
      const matchesDateTo = !dateTo || m.period_end <= dateTo;
      return matchesDateFrom && matchesDateTo;
    });
  }, [metrics, dateFrom, dateTo]);

  // Calculate totals from metrics
  const metricsTotals = useMemo(() => {
    return filteredMetrics.reduce(
      (acc, m) => ({
        trainees: acc.trainees + (m.trainees_trained || 0),
        passed: acc.passed + (m.exams_passed || 0),
        failed: acc.failed + ((m.exams_taken || 0) - (m.exams_passed || 0)),
        certifications: acc.certifications + (m.certifications_issued || 0),
        batches: acc.batches + (m.batches_conducted || 0),
        cpCerts: acc.cpCerts + (m.cp_certifications || 0),
        scpCerts: acc.scpCerts + (m.scp_certifications || 0),
      }),
      { trainees: 0, passed: 0, failed: 0, certifications: 0, batches: 0, cpCerts: 0, scpCerts: 0 }
    );
  }, [filteredMetrics]);

  // Use real data or fallback to aggregated stats
  const displayStats = {
    candidates: metricsTotals.trainees || aggregatedStats.total,
    passed: metricsTotals.passed || aggregatedStats.passed,
    failed: metricsTotals.failed || aggregatedStats.failed,
    certified: metricsTotals.certifications || aggregatedStats.certified,
    hours: aggregatedStats.hours,
  };

  const overallPassRate = displayStats.candidates > 0
    ? (displayStats.passed / (displayStats.passed + displayStats.failed || 1)) * 100
    : 0;

  // Get trainer performance data
  const trainerPerformance = useMemo(() => {
    if (!trainers || !batches || !trainees) return [];

    return trainers.map(trainer => {
      const trainerBatches = batches.filter(b => b.trainer_id === trainer.id);
      const batchIds = trainerBatches.map(b => b.id);
      const trainerTrainees = trainees.filter(t => t.batch_id && batchIds.includes(t.batch_id));

      const total = trainerTrainees.length;
      const passed = trainerTrainees.filter(t => t.exam_passed === true).length;
      const certified = trainerTrainees.filter(t => t.certified).length;
      const passRate = total > 0 ? (passed / total) * 100 : 0;

      return {
        id: trainer.id,
        name: `${trainer.first_name} ${trainer.last_name}`,
        total,
        passed,
        certified,
        passRate,
        batchCount: trainerBatches.length,
      };
    }).filter(t => t.total > 0);
  }, [trainers, batches, trainees]);

  // Batch performance data for table
  const batchPerformance = useMemo(() => {
    if (!batches || !trainees || !trainers) return [];

    return batches
      .filter(b => b.status === 'completed' || b.status === 'in_progress')
      .map(batch => {
        const batchTrainees = trainees.filter(t => t.batch_id === batch.id);
        const trainer = trainers.find(t => t.id === batch.trainer_id);

        const total = batchTrainees.length;
        const passed = batchTrainees.filter(t => t.exam_passed === true).length;
        const failed = batchTrainees.filter(t => t.exam_passed === false).length;
        const passRate = total > 0 ? (passed / total) * 100 : 0;
        const avgScore = batchTrainees.reduce((acc, t) => acc + (t.exam_score || 0), 0) / (total || 1);

        const start = new Date(batch.training_start_date);
        const end = new Date(batch.training_end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const hours = days * 8;

        return {
          id: batch.id,
          name: batch.batch_name,
          code: batch.batch_code,
          program: batch.certification_type,
          trainer: trainer ? `${trainer.first_name} ${trainer.last_name}` : 'Unassigned',
          location: batch.training_location || 'N/A',
          period: `${new Date(batch.training_start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
          total,
          passed,
          failed,
          passRate,
          avgScore,
          hours,
          status: batch.status,
        };
      })
      .filter(b => {
        const matchesProgram = programFilter === 'all' || b.program === programFilter;
        const matchesTrainer = trainerFilter === 'all' || b.trainer === trainerFilter;
        return matchesProgram && matchesTrainer;
      });
  }, [batches, trainees, trainers, programFilter, trainerFilter]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("ECP Performance Report", pageWidth / 2, 20, { align: "center" });

    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated on ${dateStr}`, pageWidth / 2, 28, { align: "center" });

    // Summary Stats
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Summary Statistics", 14, 40);

    autoTable(doc, {
      startY: 45,
      head: [['Metric', 'Value']],
      body: [
        ['Total Trainees', displayStats.candidates.toString()],
        ['Pass Rate', `${overallPassRate.toFixed(1)}%`],
        ['Certified', displayStats.certified.toString()],
        ['Training Hours', displayStats.hours.toString()],
        ['Total Batches', (batches?.length || 0).toString()],
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
    });

    // Batch Performance
    if (batchPerformance.length > 0) {
      doc.setFontSize(14);
      doc.text("Batch Performance", 14, (doc as any).lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 20,
        head: [['Batch', 'Program', 'Trainer', 'Trainees', 'Passed', 'Failed', 'Pass Rate', 'Avg Score']],
        body: batchPerformance.map(row => [
          row.name,
          row.program,
          row.trainer,
          row.total.toString(),
          row.passed.toString(),
          row.failed.toString(),
          `${row.passRate.toFixed(1)}%`,
          `${row.avgScore.toFixed(1)}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    // Trainer Performance
    if (trainerPerformance.length > 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.text("Trainer Performance", 14, 20);

      autoTable(doc, {
        startY: 25,
        head: [['Trainer', 'Batches', 'Total Trainees', 'Passed', 'Certified', 'Pass Rate']],
        body: trainerPerformance.map(trainer => [
          trainer.name,
          trainer.batchCount.toString(),
          trainer.total.toString(),
          trainer.passed.toString(),
          trainer.certified.toString(),
          `${trainer.passRate.toFixed(1)}%`,
        ]),
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
    }

    // Save the PDF
    const filename = `ECP_Performance_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    toast({
      title: texts.pdfExported,
      description: texts.pdfSavedAs(filename),
    });
  };

  const handleExportExcel = () => {
    // Create a new workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['ECP Performance Report'],
      [`Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`],
      [],
      ['Summary Statistics'],
      ['Metric', 'Value'],
      ['Total Trainees', displayStats.candidates],
      ['Pass Rate', `${overallPassRate.toFixed(1)}%`],
      ['Certified', displayStats.certified],
      ['Training Hours', displayStats.hours],
      ['Total Batches', batches?.length || 0],
      ['Passed', displayStats.passed],
      ['Failed', displayStats.failed],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Batch Performance Sheet
    if (batchPerformance.length > 0) {
      const batchData = [
        ['Batch Performance Report'],
        [],
        ['Batch Name', 'Code', 'Program', 'Trainer', 'Location', 'Period', 'Total', 'Passed', 'Failed', 'Pass Rate', 'Avg Score', 'Hours', 'Status'],
        ...batchPerformance.map(row => [
          row.name,
          row.code,
          row.program,
          row.trainer,
          row.location,
          row.period,
          row.total,
          row.passed,
          row.failed,
          `${row.passRate.toFixed(1)}%`,
          `${row.avgScore.toFixed(1)}%`,
          row.hours,
          row.status,
        ]),
      ];
      const batchWs = XLSX.utils.aoa_to_sheet(batchData);
      XLSX.utils.book_append_sheet(wb, batchWs, 'Batch Performance');
    }

    // Trainer Performance Sheet
    if (trainerPerformance.length > 0) {
      const trainerData = [
        ['Trainer Performance Report'],
        [],
        ['Trainer Name', 'Batches', 'Total Trainees', 'Passed', 'Certified', 'Pass Rate'],
        ...trainerPerformance.map(trainer => [
          trainer.name,
          trainer.batchCount,
          trainer.total,
          trainer.passed,
          trainer.certified,
          `${trainer.passRate.toFixed(1)}%`,
        ]),
      ];
      const trainerWs = XLSX.utils.aoa_to_sheet(trainerData);
      XLSX.utils.book_append_sheet(wb, trainerWs, 'Trainer Performance');
    }

    // Historical Metrics Sheet
    if (filteredMetrics && filteredMetrics.length > 0) {
      const metricsData = [
        ['Historical Performance Metrics'],
        [`Period Type: ${periodType}`],
        [],
        ['Period Start', 'Period End', 'Batches', 'Trainees', 'Exams Taken', 'Passed', 'Pass Rate', 'Avg Score', 'CP Certs', 'SCP Certs'],
        ...filteredMetrics.map(m => [
          new Date(m.period_start).toLocaleDateString(),
          new Date(m.period_end).toLocaleDateString(),
          m.batches_conducted,
          m.trainees_trained,
          m.exams_taken,
          m.exams_passed,
          `${(m.pass_rate || 0).toFixed(1)}%`,
          `${(m.average_score || 0).toFixed(1)}%`,
          m.cp_certifications,
          m.scp_certifications,
        ]),
      ];
      const metricsWs = XLSX.utils.aoa_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(wb, metricsWs, 'Historical Metrics');
    }

    // Save the Excel file
    const filename = `ECP_Performance_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);

    toast({
      title: texts.excelExported,
      description: texts.excelSavedAs(filename),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${language === 'ar' ? 'from-navy-800 via-royal-600 to-sky-500' : 'from-sky-500 via-royal-600 to-navy-800'} rounded-lg p-6 text-white`}>
        <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${language === 'ar' ? 'sm:flex-row-reverse' : ''}`}>
          <div className={language === 'ar' ? 'text-right' : ''}>
            <h1 className={`text-3xl font-bold flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <BarChart3 className="h-8 w-8" />
              {texts.title}
            </h1>
            <p className="mt-2 opacity-90">
              {texts.subtitle}
            </p>
          </div>
          <div className={`flex gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Button variant="secondary" size="sm" onClick={handleExportExcel} className={language === 'ar' ? 'flex-row-reverse' : ''}>
              <FileSpreadsheet className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {texts.exportExcel}
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportPDF} className={language === 'ar' ? 'flex-row-reverse' : ''}>
              <Download className={`h-4 w-4 ${language === 'ar' ? 'ml-2' : 'mr-2'}`} />
              {texts.exportPdf}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div className={language === 'ar' ? 'text-right' : ''}>
                <p className="text-sm text-gray-600">{texts.totalTrainees}</p>
                <p className="text-2xl font-bold">{displayStats.candidates}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-green-100">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div className={language === 'ar' ? 'text-right' : ''}>
                <p className="text-sm text-gray-600">{texts.passRate}</p>
                <p className="text-2xl font-bold text-green-600">{overallPassRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-purple-100">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div className={language === 'ar' ? 'text-right' : ''}>
                <p className="text-sm text-gray-600">{texts.certified}</p>
                <p className="text-2xl font-bold text-purple-600">{displayStats.certified}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className={language === 'ar' ? 'text-right' : ''}>
                <p className="text-sm text-gray-600">{texts.trainingHours}</p>
                <p className="text-2xl font-bold">{displayStats.hours}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={`flex items-center gap-3 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-indigo-100">
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </div>
              <div className={language === 'ar' ? 'text-right' : ''}>
                <p className="text-sm text-gray-600">{texts.batches}</p>
                <p className="text-2xl font-bold">{batches?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pass Rate Progress */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <BarChart3 className="h-5 w-5 text-primary" />
            {texts.successRateOverview}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className={`flex justify-between mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                <span className="text-sm font-medium">{texts.overallPassRate}</span>
                <span className="text-sm font-bold text-green-600">{overallPassRate.toFixed(1)}%</span>
              </div>
              <Progress value={overallPassRate} className="h-4" />
            </div>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className={`flex items-center justify-center gap-1 mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">{texts.passed}</span>
                </div>
                <p className="text-xl font-bold text-green-600">{displayStats.passed}</p>
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-1 mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm text-gray-600">{texts.failed}</span>
                </div>
                <p className="text-xl font-bold text-red-600">{displayStats.failed}</p>
              </div>
              <div className="text-center">
                <div className={`flex items-center justify-center gap-1 mb-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                  <Award className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-gray-600">{texts.certified}</span>
                </div>
                <p className="text-xl font-bold text-purple-600">{displayStats.certified}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
            <Filter className="h-5 w-5 text-primary" />
            {texts.reportFilters}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>{texts.periodType}</Label>
              <Select value={periodType} onValueChange={(v) => setPeriodType(v as 'monthly' | 'quarterly' | 'yearly')}>
                <SelectTrigger>
                  <SelectValue placeholder={texts.periodType} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{texts.monthly}</SelectItem>
                  <SelectItem value="quarterly">{texts.quarterly}</SelectItem>
                  <SelectItem value="yearly">{texts.yearly}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{texts.program}</Label>
              <Select value={programFilter} onValueChange={setProgramFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={texts.allPrograms} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allPrograms}</SelectItem>
                  <SelectItem value="CP">CP</SelectItem>
                  <SelectItem value="SCP">SCP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{texts.trainer}</Label>
              <Select value={trainerFilter} onValueChange={setTrainerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={texts.allTrainers} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allTrainers}</SelectItem>
                  {trainers?.map((trainer) => (
                    <SelectItem key={trainer.id} value={`${trainer.first_name} ${trainer.last_name}`}>
                      {trainer.first_name} {trainer.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{texts.fromDate}</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{texts.toDate}</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Report Table */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.batchPerformanceReport}</CardTitle>
          <CardDescription>
            {texts.batchPerformanceDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{texts.batch}</TableHead>
                <TableHead>{texts.program}</TableHead>
                <TableHead>{texts.trainer}</TableHead>
                <TableHead>{texts.location}</TableHead>
                <TableHead className="text-center">{texts.trainees}</TableHead>
                <TableHead className="text-center">{texts.passed}</TableHead>
                <TableHead className="text-center">{texts.failed}</TableHead>
                <TableHead className="text-center">{texts.passRate}</TableHead>
                <TableHead className="text-center">{texts.avgScore}</TableHead>
                <TableHead className="text-center">{texts.hours}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batchPerformance.length > 0 ? (
                batchPerformance.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{row.name}</div>
                        <div className="text-xs text-gray-500">{row.code}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          row.program === "CP"
                            ? "bg-green-50 text-green-700"
                            : "bg-purple-50 text-purple-700"
                        }
                      >
                        {row.program}
                      </Badge>
                    </TableCell>
                    <TableCell>{row.trainer}</TableCell>
                    <TableCell>{row.location}</TableCell>
                    <TableCell className="text-center">{row.total}</TableCell>
                    <TableCell className="text-center text-green-600 font-medium">
                      {row.passed}
                    </TableCell>
                    <TableCell className="text-center text-red-600 font-medium">
                      {row.failed}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          row.passRate >= 80
                            ? "bg-green-100 text-green-700"
                            : row.passRate >= 70
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {row.passRate.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{row.avgScore.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{row.hours}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{texts.noCompletedBatches}</p>
                    <p className="text-sm mt-1">{texts.completeBatchesHint}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trainer Performance */}
      <Card>
        <CardHeader>
          <CardTitle>{texts.trainerPerformanceSummary}</CardTitle>
          <CardDescription>{texts.trainerPerformanceDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          {trainerPerformance.length > 0 ? (
            <div className="space-y-4">
              {trainerPerformance.map((trainer) => (
                <div key={trainer.id} className="p-4 border rounded-lg">
                  <div className={`flex items-center justify-between mb-2 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                    <div className={language === 'ar' ? 'text-right' : ''}>
                      <span className="font-medium">{trainer.name}</span>
                      <span className={`text-sm text-gray-500 ${language === 'ar' ? 'mr-2' : 'ml-2'}`}>
                        ({trainer.batchCount} {trainer.batchCount !== 1 ? texts.batchPlural : texts.batchSingular})
                      </span>
                    </div>
                    <Badge
                      className={
                        trainer.passRate >= 80
                          ? "bg-green-100 text-green-700"
                          : trainer.passRate >= 70
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }
                    >
                      {trainer.passRate.toFixed(1)}% {texts.passRateLabel}
                    </Badge>
                  </div>
                  <Progress value={trainer.passRate} className="h-2" />
                  <p className={`text-sm text-gray-500 mt-2 ${language === 'ar' ? 'text-right' : ''}`}>
                    {texts.ofCandidatesCertified(trainer.certified, trainer.total)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{texts.noTrainerData}</p>
              <p className="text-sm mt-1">{texts.assignTrainersHint}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics from Database */}
      {filteredMetrics && filteredMetrics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{texts.historicalMetrics}</CardTitle>
            <CardDescription>
              {texts.historicalMetricsDesc(periodType)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{texts.period}</TableHead>
                  <TableHead className="text-center">{texts.batches}</TableHead>
                  <TableHead className="text-center">{texts.trainees}</TableHead>
                  <TableHead className="text-center">{texts.examsTaken}</TableHead>
                  <TableHead className="text-center">{texts.passed}</TableHead>
                  <TableHead className="text-center">{texts.passRate}</TableHead>
                  <TableHead className="text-center">{texts.avgScore}</TableHead>
                  <TableHead className="text-center">{texts.certifications}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMetrics.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {new Date(m.period_start).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', year: 'numeric' })}
                      {' - '}
                      {new Date(m.period_end).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="text-center">{m.batches_conducted}</TableCell>
                    <TableCell className="text-center">{m.trainees_trained}</TableCell>
                    <TableCell className="text-center">{m.exams_taken}</TableCell>
                    <TableCell className="text-center text-green-600">{m.exams_passed}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        className={
                          (m.pass_rate || 0) >= 80
                            ? "bg-green-100 text-green-700"
                            : (m.pass_rate || 0) >= 70
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {(m.pass_rate || 0).toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{(m.average_score || 0).toFixed(1)}%</TableCell>
                    <TableCell className="text-center">
                      <div className={`flex justify-center gap-1 ${language === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {m.cp_certifications} CP
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700">
                          {m.scp_certifications} SCP
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
