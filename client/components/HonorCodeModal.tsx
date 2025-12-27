/**
 * Honor Code Modal Component
 *
 * Modal displayed before exam launch to require honor code acceptance
 * Requirements: task.md Step 1 - Accept Honor Code before exams
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import {
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileSignature,
  PenTool,
} from 'lucide-react';
import {
  logHonorCodeAcceptance,
  DEFAULT_HONOR_CODE_TEXT,
  DEFAULT_HONOR_CODE_VERSION,
  type HonorCodeContext,
  type SignatureType,
} from '@/entities/consent';

// ============================================================================
// Types
// ============================================================================

export interface HonorCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void | Promise<void>;
  context: HonorCodeContext;
  quizId?: string;
  attemptId?: string;
  honorCodeText?: string;
  honorCodeVersion?: string;
  title?: string;
  description?: string;
  allowDismiss?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function HonorCodeModal({
  open,
  onOpenChange,
  onAccept,
  context,
  quizId,
  attemptId,
  honorCodeText = DEFAULT_HONOR_CODE_TEXT,
  honorCodeVersion = DEFAULT_HONOR_CODE_VERSION,
  title = 'Honor Code Agreement',
  description = 'Please read and accept the Honor Code before proceeding',
  allowDismiss = false,
}: HonorCodeModalProps) {
  const { toast } = useToast();

  const [signatureType, setSignatureType] = useState<SignatureType>('checkbox');
  const [typedName, setTypedName] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (bottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!agreed) {
      toast({
        title: 'Agreement Required',
        description: 'You must agree to the Honor Code to proceed',
        variant: 'destructive',
      });
      return;
    }

    if (signatureType === 'typed_name' && !typedName.trim()) {
      toast({
        title: 'Signature Required',
        description: 'Please type your full name to sign',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Log the honor code acceptance
      const result = await logHonorCodeAcceptance({
        context,
        honor_code_text: honorCodeText,
        quiz_id: quizId,
        attempt_id: attemptId,
        signature_type: signatureType,
        signature_data: signatureType === 'typed_name' ? typedName : undefined,
        honor_code_version: honorCodeVersion,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: 'Honor Code Accepted',
        description: 'Thank you for upholding academic integrity',
      });

      // Call the onAccept callback
      await onAccept();

      // Close the modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error accepting honor code:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept honor code',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={allowDismiss ? onOpenChange : undefined}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-hidden"
        onInteractOutside={(e) => {
          if (!allowDismiss) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (!allowDismiss) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <DialogTitle className="text-2xl">{title}</DialogTitle>
              <DialogDescription className="mt-1">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Honor Code Text */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Honor Code</Label>
            <ScrollArea
              className="h-[300px] w-full rounded-md border p-4"
              onScroll={handleScroll}
            >
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {honorCodeText}
              </div>
            </ScrollArea>
            {!hasScrolledToBottom && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Please scroll to the bottom to read the full Honor Code
              </p>
            )}
          </div>

          {/* Signature Type Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Sign the Honor Code</Label>
            <Tabs
              value={signatureType}
              onValueChange={(value) => setSignatureType(value as SignatureType)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="checkbox" className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Checkbox
                </TabsTrigger>
                <TabsTrigger value="typed_name" className="flex items-center gap-2">
                  <PenTool className="h-4 w-4" />
                  Type Name
                </TabsTrigger>
              </TabsList>

              <TabsContent value="checkbox" className="mt-4">
                <Alert>
                  <FileSignature className="h-4 w-4" />
                  <AlertTitle>Checkbox Acceptance</AlertTitle>
                  <AlertDescription>
                    Check the box below to indicate your acceptance of the Honor Code
                  </AlertDescription>
                </Alert>
              </TabsContent>

              <TabsContent value="typed_name" className="mt-4 space-y-3">
                <Alert>
                  <PenTool className="h-4 w-4" />
                  <AlertTitle>Typed Signature</AlertTitle>
                  <AlertDescription>
                    Type your full legal name below to digitally sign the Honor Code
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label htmlFor="typed_name">Full Legal Name *</Label>
                  <Input
                    id="typed_name"
                    placeholder="Type your full legal name"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Agreement Checkbox */}
          <div className="flex items-start space-x-3 rounded-lg border p-4 bg-blue-50">
            <Checkbox
              id="agree"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              disabled={isSubmitting || !hasScrolledToBottom}
            />
            <div className="flex-1">
              <Label
                htmlFor="agree"
                className="text-sm font-medium leading-relaxed cursor-pointer"
              >
                I have read and understood the Honor Code above. I agree to uphold the highest
                standards of academic integrity and professional conduct. I understand that
                violations may result in exam termination, certification denial, and legal action.
              </Label>
            </div>
          </div>

          {/* Warning Alert */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Important Notice</AlertTitle>
            <AlertDescription>
              This Honor Code acceptance will be permanently recorded with your IP address,
              timestamp, and signature. By proceeding, you acknowledge that you have read and agree
              to comply with all terms.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          {allowDismiss && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              !agreed ||
              !hasScrolledToBottom ||
              (signatureType === 'typed_name' && !typedName.trim())
            }
            className="min-w-[150px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Accept & Continue
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
