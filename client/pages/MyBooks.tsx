import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { BookOpen, Download, Eye } from "lucide-react";

export default function MyBooks() {
  const { t } = useLanguage();
  const [hasBooks] = useState(false); // Toggle this to see different states

  // Sample books data
  const books = [
    {
      id: 1,
      title: "Professional Training Fundamentals",
      thumbnail: "/placeholder.svg",
      type: "PDF",
      size: "2.5 MB",
      purchaseDate: "2024-01-15",
    },
    {
      id: 2,
      title: "Advanced Certification Guide",
      thumbnail: "/placeholder.svg",
      type: "PDF",
      size: "3.8 MB",
      purchaseDate: "2024-02-20",
    },
    {
      id: 3,
      title: "Exam Preparation Manual",
      thumbnail: "/placeholder.svg",
      type: "PDF",
      size: "4.2 MB",
      purchaseDate: "2024-03-10",
    },
  ];

  if (!hasBooks) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("nav.myBooks")}
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your purchased and registered books
          </p>
        </div>

        {/* Empty state */}
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No books available
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              You haven't purchased or registered any books yet. Get started by
              purchasing a new book or registering an existing one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="bg-secondary hover:bg-secondary/90">
                {t("dashboard.purchaseNewBook")}
              </Button>
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary/5"
              >
                {t("dashboard.registerBook")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("nav.myBooks")}</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your purchased and registered books
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="bg-secondary hover:bg-secondary/90">
          {t("dashboard.purchaseNewBook")}
        </Button>
        <Button
          variant="outline"
          className="border-primary text-primary hover:bg-primary/5"
        >
          {t("dashboard.registerBook")}
        </Button>
      </div>

      {/* Books grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <Card
            key={book.id}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader className="pb-4">
              <div className="aspect-[3/4] bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <CardTitle className="text-lg font-medium line-clamp-2">
                {book.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span>{book.type}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{book.size}</span>
                </div>
                <div className="flex justify-between">
                  <span>Purchased:</span>
                  <span>{book.purchaseDate}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Open
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
