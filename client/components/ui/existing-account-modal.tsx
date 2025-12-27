/**
 * Modal pour gérer les comptes Store existants lors du signup
 * UX professionnelle pour la récupération de mot de passe Store
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Key, LogIn, ArrowRight } from 'lucide-react';

interface ExistingAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  accountType: 'store' | 'portal';
  onPasswordSubmit: (password: string) => void;
  onNavigateToLogin: () => void;
  loading?: boolean;
  error?: string;
}

export function ExistingAccountModal({
  open,
  onOpenChange,
  email,
  accountType,
  onPasswordSubmit,
  onNavigateToLogin,
  loading = false,
  error
}: ExistingAccountModalProps) {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onPasswordSubmit(password);
    }
  };

  const accountTypeLabel = accountType === 'store' ? 'Store' : 'Portal';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-700">
            <AlertCircle className="h-5 w-5" />
            Existing {accountTypeLabel} Account Detected
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Explanation */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <p className="text-sm text-amber-800">
                A {accountTypeLabel} account already exists with email{' '}
                <span className="font-medium">{email}</span>
              </p>
              <p className="text-sm text-amber-700 mt-2">
                To continue, please enter your {accountTypeLabel} password
                to automatically link your accounts.
              </p>
            </CardContent>
          </Card>

          {/* Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                {accountTypeLabel} Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={`Your ${accountTypeLabel} password`}
                disabled={loading}
                className="w-full"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={!password.trim() || loading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Continue
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Separator */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Direct login option */}
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <LogIn className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-800 mb-1">
                    Want to sign in instead?
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    If you just want to access your existing account,
                    use the login page.
                  </p>
                  <Button
                    variant="outline"
                    onClick={onNavigateToLogin}
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Go to Login
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explanatory note */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
            <p>
              💡 <strong>What happens next?</strong><br />
              After verification, we will automatically link your Portal and Store accounts
              for a unified experience.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}