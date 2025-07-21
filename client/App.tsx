import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PageTitleManager } from "@/components/PageTitleManager";

// Auth pages
import Login from "./pages/Login";
import RegisterType from "./pages/RegisterType";

// Dashboard pages
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import MockExams from "./pages/MockExams";
import AuthorizedProviders from "./pages/AuthorizedProviders";
import ExamInstructions from "./pages/ExamInstructions";
import ExamTest from "./pages/ExamTest";
import ExamResults from "./pages/ExamResults";

// Placeholder components for other pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Placeholder components for pages to be implemented later
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
    <p className="text-gray-600">
      This page will be implemented in the next phase.
    </p>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <PageTitleManager />
            <Routes>
            {/* Auth routes */}
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } 
            />
            <Route path="/register-type" element={<RegisterType />} />
            <Route
              path="/register"
              element={<PlaceholderPage title="Register Form" />}
            />
            <Route
              path="/forgot-password"
              element={<PlaceholderPage title="Forgot Password" />}
            />

            {/* Dashboard routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/exam-applications"
              element={
                <DashboardLayout>
                  <PlaceholderPage title="Exam Applications" />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/mock-exams"
              element={
                <DashboardLayout>
                  <MockExams />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/certifications"
              element={
                <DashboardLayout>
                  <PlaceholderPage title="My Certifications" />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/recognitions"
              element={
                <DashboardLayout>
                  <PlaceholderPage title="My Recognitions" />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/idus"
              element={
                <DashboardLayout>
                  <PlaceholderPage title="IDUs" />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/awards"
              element={
                <DashboardLayout>
                  <PlaceholderPage title="Award Applications" />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/providers"
              element={
                <DashboardLayout>
                  <AuthorizedProviders />
                </DashboardLayout>
              }
            />
            <Route
              path="/dashboard/help"
              element={
                <DashboardLayout>
                  <PlaceholderPage title="Help Center" />
                </DashboardLayout>
              }
            />

            {/* Exam flow routes */}
            <Route
              path="/dashboard/exam/:examId/instructions"
              element={<ExamInstructions />}
            />
            <Route path="/dashboard/exam/:examId/test" element={<ExamTest />} />
            <Route
              path="/dashboard/exam/:examId/results"
              element={<ExamResults />}
            />

            {/* Default redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </LanguageProvider>
</QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
