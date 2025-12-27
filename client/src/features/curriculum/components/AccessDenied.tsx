import { AlertCircle, ShoppingCart, Clock } from 'lucide-react';

interface AccessDeniedProps {
  reason?: 'no_purchase' | 'expired' | 'no_access_record';
  onRetry?: () => void;
}

/**
 * Access Denied component
 * Shows different messages based on denial reason
 */
export function AccessDenied({ reason, onRetry }: AccessDeniedProps) {
  const getMessage = () => {
    switch (reason) {
      case 'no_purchase':
        return {
          icon: ShoppingCart,
          title: 'Curriculum Not Purchased',
          description:
            'You need to purchase a certification package to access the curriculum.',
          action: 'Visit Store',
          actionHref: 'https://bda-global.org/en/store/',
        };
      case 'expired':
        return {
          icon: Clock,
          title: 'Access Expired',
          description:
            'Your curriculum access has expired. It was valid for 1 year from purchase.',
          action: 'Renew Access',
          actionHref: 'https://bda-global.org/en/store/',
        };
      default:
        return {
          icon: AlertCircle,
          title: 'Access Denied',
          description:
            'You do not have access to the curriculum. Please ensure you have purchased a certification package.',
          action: 'Check Again',
          actionHref: null,
        };
    }
  };

  const { icon: Icon, title, description, action, actionHref } = getMessage();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
          <Icon className="w-8 h-8 text-yellow-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>

        <p className="text-gray-600 mb-6">{description}</p>

        <div className="space-y-3">
          {actionHref ? (
            <a
              href={actionHref}
              className="block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              {action}
            </a>
          ) : (
            <button
              onClick={onRetry}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              {action}
            </button>
          )}

          <a
            href="/dashboard"
            className="block text-sm text-gray-500 hover:text-gray-700"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
