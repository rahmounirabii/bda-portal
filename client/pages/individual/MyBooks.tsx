import { useState } from 'react';
import { BookOpen, Download, Clock, FileText, Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/app/providers/AuthProvider';
import { useUserBooks, useBookDownload } from '@/entities/books';
import type { BookFilters } from '@/entities/books';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * My Books Page
 * Displays user's purchased digital books
 */

export default function MyBooks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();

  const t = {
    en: {
      // Header
      title: 'My Books',
      subtitle: 'Access your purchased digital books and materials',
      // Info Card
      digitalLibrary: 'Digital Library',
      digitalLibraryDesc: 'All books purchased from the BDA Store are available for download here. Most books have a 12-month access period from purchase date.',
      // Filters
      searchPlaceholder: 'Search books...',
      allFormats: 'All Formats',
      allBooks: 'All Books',
      active: 'Active',
      expired: 'Expired',
      // Loading
      loadingBooks: 'Loading your books...',
      // Empty State
      noBooksFound: 'No books found',
      noBooksDesc: 'Purchase books from the BDA Store to access them here',
      visitStore: 'Visit Store',
      // Book Card
      sku: 'SKU',
      expires: 'Expires',
      purchased: 'Purchased',
      pages: 'pages',
      download: 'Download',
      downloading: 'Downloading...',
      // Toast
      downloadStarted: 'Download Started',
      downloadingBook: 'Downloading',
      downloadFailed: 'Download Failed',
      downloadFailedDesc: 'Failed to download book',
    },
    ar: {
      // Header
      title: 'كتبي',
      subtitle: 'الوصول إلى كتبك الرقمية والمواد المشتراة',
      // Info Card
      digitalLibrary: 'المكتبة الرقمية',
      digitalLibraryDesc: 'جميع الكتب المشتراة من متجر BDA متاحة للتحميل هنا. معظم الكتب لها فترة وصول 12 شهراً من تاريخ الشراء.',
      // Filters
      searchPlaceholder: 'البحث في الكتب...',
      allFormats: 'جميع الصيغ',
      allBooks: 'جميع الكتب',
      active: 'نشط',
      expired: 'منتهي الصلاحية',
      // Loading
      loadingBooks: 'جارٍ تحميل كتبك...',
      // Empty State
      noBooksFound: 'لم يتم العثور على كتب',
      noBooksDesc: 'اشترِ كتباً من متجر BDA للوصول إليها هنا',
      visitStore: 'زيارة المتجر',
      // Book Card
      sku: 'رمز المنتج',
      expires: 'ينتهي',
      purchased: 'تاريخ الشراء',
      pages: 'صفحة',
      download: 'تحميل',
      downloading: 'جارٍ التحميل...',
      // Toast
      downloadStarted: 'بدأ التحميل',
      downloadingBook: 'جارٍ تحميل',
      downloadFailed: 'فشل التحميل',
      downloadFailedDesc: 'فشل في تحميل الكتاب',
    }
  };

  const texts = t[language];

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [formatFilter, setFormatFilter] = useState<'all' | 'pdf' | 'epub' | 'mobi'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');

  // Track which book is currently downloading
  const [downloadingBookId, setDownloadingBookId] = useState<string | null>(null);

  // Build filters
  const filters: BookFilters = {
    search: searchQuery || undefined,
    format: formatFilter !== 'all' ? formatFilter : undefined,
    expired: statusFilter === 'expired' ? true : statusFilter === 'active' ? false : undefined,
  };

  // Fetch books
  const { data: books, isLoading } = useUserBooks(user?.email || '', filters);
  const downloadMutation = useBookDownload();

  const handleDownload = async (productId: number, orderId: number, bookName: string, bookId: string) => {
    setDownloadingBookId(bookId);
    try {
      const downloadUrl = await downloadMutation.mutateAsync({ productId, orderId });
      // Open download in new tab
      window.open(downloadUrl, '_blank');
      toast({
        title: texts.downloadStarted,
        description: `${texts.downloadingBook} "${bookName}"...`,
      });
    } catch (error: any) {
      toast({
        title: texts.downloadFailed,
        description: error.message || texts.downloadFailedDesc,
        variant: 'destructive',
      });
    } finally {
      setDownloadingBookId(null);
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BookOpen className="h-8 w-8" />
          {texts.title}
        </h1>
        <p className="mt-2 opacity-90">
          {texts.subtitle}
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">{texts.digitalLibrary}</h3>
              <p className="text-sm text-blue-800">
                {texts.digitalLibraryDesc}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={texts.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Format Filter */}
            <div className="w-full md:w-48">
              <Select
                value={formatFilter}
                onValueChange={(value) => setFormatFilter(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allFormats}</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="epub">EPUB</SelectItem>
                  <SelectItem value="mobi">MOBI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{texts.allBooks}</SelectItem>
                  <SelectItem value="active">{texts.active}</SelectItem>
                  <SelectItem value="expired">{texts.expired}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Books Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">{texts.loadingBooks}</p>
        </div>
      ) : !books || books.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{texts.noBooksFound}</p>
            <p className="text-sm text-gray-500 mb-4">
              {texts.noBooksDesc}
            </p>
            <Button onClick={() => window.open('/store', '_blank')}>
              {texts.visitStore}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <Card
              key={book.id}
              className={`hover:shadow-lg transition-shadow ${
                isExpired(book.expires_at) ? 'opacity-60' : ''
              }`}
            >
              <CardContent className="p-6">
                {/* Book Cover/Icon */}
                <div className="flex justify-center mb-4">
                  {book.cover_image ? (
                    <img
                      src={book.cover_image}
                      alt={book.product_name}
                      className="h-48 w-auto object-cover rounded"
                    />
                  ) : (
                    <div className="h-48 w-36 bg-purple-100 rounded flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-royal-600" />
                    </div>
                  )}
                </div>

                {/* Book Info */}
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{book.product_name}</h3>
                    {book.sku && (
                      <p className="text-xs text-gray-500">{texts.sku}: {book.sku}</p>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {book.format && (
                      <Badge variant="outline" className="uppercase">
                        {book.format}
                      </Badge>
                    )}
                    {book.expires_at && (
                      <Badge
                        variant="outline"
                        className={
                          isExpired(book.expires_at)
                            ? 'border-red-300 text-red-700 bg-red-50'
                            : 'border-green-300 text-green-700 bg-green-50'
                        }
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {isExpired(book.expires_at)
                          ? texts.expired
                          : `${texts.expires} ${formatDate(book.expires_at)}`}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {book.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {book.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>{texts.purchased}: {formatDate(book.purchased_at)}</div>
                    {book.pages && <div>{book.pages} {texts.pages}</div>}
                  </div>

                  {/* Download Button */}
                  <Button
                    className="w-full"
                    disabled={isExpired(book.expires_at) || downloadingBookId === book.id}
                    onClick={() =>
                      handleDownload(book.product_id, book.order_id, book.product_name, book.id)
                    }
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingBookId === book.id ? texts.downloading : texts.download}
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

MyBooks.displayName = 'MyBooks';
