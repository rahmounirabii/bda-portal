/**
 * Lesson Editor Component
 * Form for creating and editing lessons
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  useLesson,
  useCreateLesson,
  useUpdateLesson,
  useCheckOrderIndex,
  CurriculumService,
  curriculumKeys,
} from '@/entities/curriculum';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Eye } from 'lucide-react';

// Validation schema
const lessonSchema = z.object({
  module_id: z.string().uuid('Please select a module'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  title_ar: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  description_ar: z.string().optional(),
  content: z.string().min(1, 'Content is required'),
  content_ar: z.string().optional(),
  order_index: z.coerce.number().min(1).max(3),
  estimated_duration_hours: z.coerce.number().min(0).max(100).optional(),
  lesson_quiz_id: z.string().uuid().optional().or(z.literal('')),
  quiz_required: z.boolean().default(true),
  quiz_passing_score: z.coerce.number().min(0).max(100).default(70),
  is_published: z.boolean().default(false),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonEditorProps {
  lessonId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LessonEditor({ lessonId, isOpen, onClose }: LessonEditorProps) {
  const { toast } = useToast();
  const isEditing = !!lessonId;

  // Queries
  const { data: lesson, isLoading: isLoadingLesson } = useLesson(lessonId, isOpen && isEditing);

  // Load all modules (admin context - no user progress needed)
  const { data: modules } = useQuery({
    queryKey: curriculumKeys.modulesList({}),
    queryFn: async () => {
      const result = await CurriculumService.getModules({});
      return result.data || [];
    },
  });

  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();

  // Form
  const form = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      module_id: '',
      title: '',
      title_ar: '',
      description: '',
      description_ar: '',
      content: '',
      content_ar: '',
      order_index: 1,
      estimated_duration_hours: 1,
      lesson_quiz_id: '',
      quiz_required: true,
      quiz_passing_score: 70,
      is_published: false,
    },
  });

  const selectedModuleId = form.watch('module_id');
  const selectedOrderIndex = form.watch('order_index');

  // Check if order index is available
  const { data: isOrderAvailable } = useCheckOrderIndex(
    selectedModuleId,
    selectedOrderIndex as 1 | 2 | 3,
    lessonId
  );

  // Load lesson data when editing
  useEffect(() => {
    if (lesson && isEditing) {
      form.reset({
        module_id: lesson.module_id,
        title: lesson.title,
        title_ar: lesson.title_ar || '',
        description: lesson.description || '',
        description_ar: lesson.description_ar || '',
        content: JSON.stringify(lesson.content, null, 2),
        content_ar: lesson.content_ar ? JSON.stringify(lesson.content_ar, null, 2) : '',
        order_index: lesson.order_index,
        estimated_duration_hours: lesson.estimated_duration_hours || 1,
        lesson_quiz_id: lesson.lesson_quiz_id || '',
        quiz_required: lesson.quiz_required,
        quiz_passing_score: lesson.quiz_passing_score,
        is_published: lesson.is_published,
      });
    }
  }, [lesson, isEditing, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  const onSubmit = async (data: LessonFormData) => {
    try {
      // Check that order index is available
      if (!isOrderAvailable) {
        toast({
          title: 'Error',
          description: `Order ${data.order_index} is already used in this module`,
          variant: 'destructive',
        });
        return;
      }

      // Parse JSON content
      let contentJson;
      let contentArJson;

      try {
        contentJson = data.content ? JSON.parse(data.content) : {};
        contentArJson = data.content_ar ? JSON.parse(data.content_ar) : {};
      } catch (e) {
        toast({
          title: 'Error',
          description: 'Invalid JSON content',
          variant: 'destructive',
        });
        return;
      }

      const lessonData = {
        module_id: data.module_id,
        title: data.title,
        title_ar: data.title_ar || null,
        description: data.description,
        description_ar: data.description_ar || null,
        content: contentJson,
        content_ar: contentArJson,
        order_index: data.order_index as 1 | 2 | 3,
        estimated_duration_hours: data.estimated_duration_hours || null,
        lesson_quiz_id: data.lesson_quiz_id || null,
        quiz_required: data.quiz_required,
        quiz_passing_score: data.quiz_passing_score,
        is_published: data.is_published,
      };

      if (isEditing) {
        await updateLesson.mutateAsync({
          id: lessonId,
          updates: lessonData,
        });
        toast({
          title: 'Success',
          description: 'Lesson updated successfully',
        });
      } else {
        await createLesson.mutateAsync(lessonData);
        toast({
          title: 'Success',
          description: 'Lesson created successfully',
        });
      }

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${isEditing ? 'update' : 'create'} lesson`,
        variant: 'destructive',
      });
    }
  };

  const isLoading = createLesson.isPending || updateLesson.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Lesson' : 'New Lesson'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modify the lesson information below'
              : 'Create a new sub-competency (lesson) for the BDA framework'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingLesson && isEditing ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Information</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="quiz">Quiz</TabsTrigger>
                </TabsList>

                {/* Basic Information Tab */}
                <TabsContent value="basic" className="space-y-4 mt-4">
                  {/* Module */}
                  <FormField
                    control={form.control}
                    name="module_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Module (Competency) *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a module" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {modules?.map((module) => (
                              <SelectItem key={module.id} value={module.id}>
                                {module.competency_name}
                                {module.section_type === 'knowledge_based'
                                  ? ' (Knowledge)'
                                  : ' (Behavioral)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose the parent module (14 competencies available)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ordre */}
                  <FormField
                    control={form.control}
                    name="order_index"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Order in module *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value?.toString()}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Order (1, 2, or 3)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 - First lesson</SelectItem>
                            <SelectItem value="2">2 - Second lesson</SelectItem>
                            <SelectItem value="3">3 - Third lesson</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Position of the lesson in the module (3 lessons per module)
                          {isOrderAvailable === false && (
                            <span className="text-destructive ml-2">
                              ⚠️ This order is already used in this module
                            </span>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* English Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (English) *</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Introduction to BDA BoK Framework" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Arabic Title */}
                  <FormField
                    control={form.control}
                    name="title_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title (Arabic)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="العنوان بالعربية"
                            dir="rtl"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description FR */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (English) *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Briefly describe this lesson..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description AR */}
                  <FormField
                    control={form.control}
                    name="description_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Arabic)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="الوصف بالعربية"
                            dir="rtl"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Estimated Duration */}
                  <FormField
                    control={form.control}
                    name="estimated_duration_hours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estimated duration (hours)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" step="0.5" {...field} />
                        </FormControl>
                        <FormDescription>
                          Estimated time to complete this lesson
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Published */}
                  <FormField
                    control={form.control}
                    name="is_published"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Publish lesson</FormLabel>
                          <FormDescription>
                            Published lessons are visible to users
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Content Tab */}
                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> Content must be in JSON format (TipTap/Lexical).
                      In a future version, a WYSIWYG editor will be integrated here.
                    </p>
                  </div>

                  {/* English Content */}
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content (English) - JSON *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='{"type": "doc", "content": [...]}'
                            rows={10}
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          JSON format for rich text editor
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Arabic Content */}
                  <FormField
                    control={form.control}
                    name="content_ar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content (Arabic) - JSON</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='{"type": "doc", "content": [...]}'
                            dir="ltr"
                            rows={10}
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                {/* Quiz Tab */}
                <TabsContent value="quiz" className="space-y-4 mt-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <strong>Important:</strong> Create the quiz first in the Quiz system,
                      then select it here. Lessons typically require a quiz to
                      validate learning.
                    </p>
                  </div>

                  {/* Quiz ID */}
                  <FormField
                    control={form.control}
                    name="lesson_quiz_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quiz ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Quiz UUID (optional for now)"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Link an existing quiz to this lesson
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Quiz requis */}
                  <FormField
                    control={form.control}
                    name="quiz_required"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Quiz required</FormLabel>
                          <FormDescription>
                            User must complete the quiz to finish the lesson
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Passing Score */}
                  <FormField
                    control={form.control}
                    name="quiz_passing_score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Score (%)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" max="100" {...field} />
                        </FormControl>
                        <FormDescription>
                          Minimum score to pass the quiz (0-100%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading || !isOrderAvailable}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
