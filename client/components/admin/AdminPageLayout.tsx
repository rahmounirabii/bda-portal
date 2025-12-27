import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface AdminPageLayoutProps {
  title: string;
  subtitle?: string;
  backTo: string;
  backLabel?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  headerColor?: string;
}

/**
 * Shared layout component for admin detail/edit pages
 * Provides consistent header with back button, title, and optional actions
 */
export function AdminPageLayout({
  title,
  subtitle,
  backTo,
  backLabel = "Back to list",
  children,
  actions,
  headerColor = "from-sky-500 via-royal-600 to-navy-800",
}: AdminPageLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`bg-gradient-to-r ${headerColor} rounded-lg p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(backTo)}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backLabel}
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{title}</h1>
              {subtitle && <p className="mt-1 opacity-90">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}
