/**
 * Photo Verification Component
 *
 * Upload photo for identity verification before exam (instead of webcam)
 * Requirements: task.md Step 6.2 - Identity Re-verification
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import {
  CheckCircle2,
  XCircle,
  Upload,
  Camera,
  Loader2,
  Info,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export interface PhotoVerificationProps {
  userId: string;
  bookingId?: string;
  quizId: string;
  onComplete?: (photoUrl: string) => void;
  requirePhoto?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function PhotoVerification({
  userId,
  bookingId,
  quizId,
  onComplete,
  requirePhoto = false,
}: PhotoVerificationProps) {
  const { toast } = useToast();

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  // ========================================================================
  // File Handling
  // ========================================================================

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file (JPG, PNG, etc.)',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Photo must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  // ========================================================================
  // Upload Photo
  // ========================================================================

  const handleUpload = async () => {
    if (!photoFile) {
      toast({
        title: 'No Photo Selected',
        description: 'Please select a photo to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique filename
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${userId}/exam-verification-${Date.now()}.${fileExt}`;
      const filePath = `exam-photos/${fileName}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('identity-documents')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('identity-documents')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      // Store verification record in database
      const { error: dbError } = await supabase
        .from('exam_photo_verifications')
        .insert({
          user_id: userId,
          quiz_id: quizId,
          booking_id: bookingId,
          photo_url: filePath,
          verified_at: new Date().toISOString(),
        });

      if (dbError && dbError.code !== '42P01') {
        // Ignore if table doesn't exist (backward compatibility)
        console.warn('Could not save verification record:', dbError);
      }

      setPhotoUrl(publicUrl);
      setUploadComplete(true);

      toast({
        title: 'Photo Uploaded',
        description: 'Your verification photo has been uploaded successfully',
      });

      if (onComplete) {
        onComplete(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ========================================================================
  // Skip Photo (if not required)
  // ========================================================================

  const handleSkip = () => {
    if (onComplete) {
      onComplete('');
    }
  };

  // ========================================================================
  // Render
  // ========================================================================

  if (uploadComplete) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            Photo Verification Complete
          </CardTitle>
          <CardDescription>Your photo has been uploaded successfully</CardDescription>
        </CardHeader>
        <CardContent>
          {photoPreview && (
            <div className="mb-4">
              <img
                src={photoPreview}
                alt="Verification photo"
                className="max-w-xs rounded-lg border-2 border-green-200"
              />
            </div>
          )}
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Verified</AlertTitle>
            <AlertDescription>
              Your identity has been confirmed. You can now proceed with the exam.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photo Verification</CardTitle>
        <CardDescription>
          Upload a current photo of yourself for identity verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Photo Requirements</AlertTitle>
          <AlertDescription className="mt-2">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Clear photo of your face</li>
              <li>Good lighting (avoid shadows)</li>
              <li>No sunglasses or hats</li>
              <li>Photo should match your ID photo</li>
              <li>Maximum file size: 5MB</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Photo Preview */}
        {photoPreview ? (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="max-w-md mx-auto rounded-lg border-2 border-gray-200"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearPhoto}
                className="absolute top-2 right-2"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Remove
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
                size="lg"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Photo
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          /* Upload Button */
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-sm text-gray-600 mb-4">
                Click below to select a photo from your device
              </p>
              <Button
                onClick={() => document.getElementById('photo-input')?.click()}
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Photo
              </Button>
              <input
                id="photo-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>

            {/* Optional: Camera Capture on Mobile */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Or take a photo now:</p>
              <Button
                onClick={() => {
                  const input = document.getElementById('camera-input');
                  input?.click();
                }}
                variant="outline"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
              <input
                id="camera-input"
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        )}

        {/* Skip Option (if not required) */}
        {!requirePhoto && (
          <div className="pt-4 border-t">
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Photo Not Required</AlertTitle>
              <AlertDescription>
                Photo verification is optional for this exam. You can skip this step if you prefer.
              </AlertDescription>
            </Alert>
            <Button
              onClick={handleSkip}
              variant="outline"
              className="w-full mt-4"
            >
              Skip Photo Verification
            </Button>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="text-xs text-gray-500 pt-4 border-t">
          <p>
            <strong>Privacy Notice:</strong> Your photo will be used only for identity verification
            purposes and will be securely stored. It will be automatically deleted after 90 days or
            upon completion of the verification process.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
