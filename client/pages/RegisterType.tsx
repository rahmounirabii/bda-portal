import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RegisterType() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {t("auth.registerAs")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Link to="/register?type=individual" className="block">
            <Button
              variant="outline"
              className="w-full h-16 text-lg font-medium border-2 hover:bg-primary/5 hover:border-primary"
            >
              {t("auth.registerAsIndividual")}
            </Button>
          </Link>
          <Link to="/register?type=provider" className="block">
            <Button
              variant="outline"
              className="w-full h-16 text-lg font-medium border-2 hover:bg-primary/5 hover:border-primary"
            >
              {t("auth.registerAsProvider")}
            </Button>
          </Link>
          <div className="text-center mt-6">
            <Link to="/login" className="text-sm text-gray-600 hover:underline">
              {t("auth.login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
