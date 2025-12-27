/**
 * Flashcard Deck Editor - Admin Page
 * Manage individual flashcards within a deck
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useFlashcardDeck,
  useFlashcards,
  useCreateFlashcard,
  useUpdateFlashcard,
  useDeleteFlashcard,
  useBulkCreateFlashcards,
} from '@/entities/flashcards';
import type {
  Flashcard,
  FlashcardInsert,
  FlashcardUpdate,
} from '@/entities/flashcards';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  GripVertical,
  MoreHorizontal,
  Upload,
  Download,
  Search,
  Filter,
  Lightbulb,
  RotateCcw,
  Layers,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export function FlashcardDeckEditor() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [deleteConfirmCard, setDeleteConfirmCard] = useState<Flashcard | null>(
    null
  );
  const [previewCard, setPreviewCard] = useState<Flashcard | null>(null);
  const [previewFlipped, setPreviewFlipped] = useState(false);

  // Data fetching
  const { data: deck, isLoading: isLoadingDeck } = useFlashcardDeck(deckId);
  const { data: cards, isLoading: isLoadingCards } = useFlashcards(deckId, {
    difficulty_level:
      difficultyFilter !== 'all' ? (difficultyFilter as any) : undefined,
  });

  // Mutations
  const createFlashcard = useCreateFlashcard();
  const updateFlashcard = useUpdateFlashcard();
  const deleteFlashcard = useDeleteFlashcard();
  const bulkCreateFlashcards = useBulkCreateFlashcards();

  // Filter cards
  const filteredCards = cards?.filter((card) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        card.front_text.toLowerCase().includes(search) ||
        card.back_text.toLowerCase().includes(search) ||
        card.front_text_ar?.toLowerCase().includes(search) ||
        card.back_text_ar?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Handle create
  const handleCreate = async (data: FlashcardInsert) => {
    try {
      await createFlashcard.mutateAsync(data);
      toast.success('Flashcard created successfully');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create flashcard');
    }
  };

  // Handle update
  const handleUpdate = async (cardId: string, data: FlashcardUpdate) => {
    try {
      await updateFlashcard.mutateAsync({ cardId, updates: data });
      toast.success('Flashcard updated successfully');
      setEditingCard(null);
    } catch (error) {
      toast.error('Failed to update flashcard');
    }
  };

  // Handle delete
  const handleDelete = async (cardId: string) => {
    try {
      await deleteFlashcard.mutateAsync({ cardId, deckId: deckId! });
      toast.success('Flashcard deleted successfully');
      setDeleteConfirmCard(null);
    } catch (error) {
      toast.error('Failed to delete flashcard');
    }
  };

  // Handle toggle publish
  const handleTogglePublish = async (card: Flashcard) => {
    try {
      await updateFlashcard.mutateAsync({
        cardId: card.id,
        updates: { is_published: !card.is_published },
      });
      toast.success(
        card.is_published ? 'Flashcard unpublished' : 'Flashcard published'
      );
    } catch (error) {
      toast.error('Failed to update publish status');
    }
  };

  // Handle bulk import
  const handleBulkImport = async () => {
    // This would open a modal or file picker for CSV/JSON import
    toast.info('Bulk import feature coming soon');
  };

  if (isLoadingDeck || isLoadingCards) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/flashcards')}
            className="mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Flashcard Manager
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{deck?.title}</h1>
          {deck?.title_ar && (
            <p className="text-gray-500 mt-1" dir="rtl">
              {deck.title_ar}
            </p>
          )}
          <p className="text-gray-600 mt-1">
            {cards?.length || 0} flashcards •{' '}
            {deck?.estimated_study_time_minutes
              ? `~${deck.estimated_study_time_minutes} min study time`
              : 'No time estimate'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBulkImport}>
            <Upload className="w-4 h-4 mr-2" />
            Import Cards
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Flashcard
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center gap-2 text-purple-600 mb-1">
            <Layers className="w-4 h-4" />
            <span className="text-sm font-medium">Total Cards</span>
          </div>
          <p className="text-2xl font-bold">{cards?.length || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">Published</span>
          </div>
          <p className="text-2xl font-bold">
            {cards?.filter((c) => c.is_published).length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <EyeOff className="w-4 h-4" />
            <span className="text-sm font-medium">Draft</span>
          </div>
          <p className="text-2xl font-bold">
            {cards?.filter((c) => !c.is_published).length || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border">
          <div className="flex items-center gap-2 text-yellow-600 mb-1">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">With Hints</span>
          </div>
          <p className="text-2xl font-bold">
            {cards?.filter((c) => c.hint).length || 0}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search flashcards..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Flashcards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards?.map((card, index) => (
          <FlashcardCard
            key={card.id}
            card={card}
            index={index + 1}
            onEdit={() => setEditingCard(card)}
            onDelete={() => setDeleteConfirmCard(card)}
            onTogglePublish={() => handleTogglePublish(card)}
            onPreview={() => {
              setPreviewCard(card);
              setPreviewFlipped(false);
            }}
          />
        ))}
      </div>

      {filteredCards?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">No flashcards found</p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add First Flashcard
          </Button>
        </div>
      )}

      {/* Create Dialog */}
      <FlashcardDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(data) => handleCreate({ ...data, deck_id: deckId! })}
        title="Create Flashcard"
        nextOrderIndex={(cards?.length || 0) + 1}
      />

      {/* Edit Dialog */}
      <FlashcardDialog
        open={!!editingCard}
        onOpenChange={(open) => !open && setEditingCard(null)}
        onSubmit={(data) => editingCard && handleUpdate(editingCard.id, data)}
        title="Edit Flashcard"
        defaultValues={editingCard || undefined}
      />

      {/* Preview Dialog */}
      <Dialog
        open={!!previewCard}
        onOpenChange={(open) => !open && setPreviewCard(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Card Preview</DialogTitle>
          </DialogHeader>
          <div
            className="relative w-full h-64 cursor-pointer perspective-1000"
            onClick={() => setPreviewFlipped(!previewFlipped)}
          >
            <div
              className={`absolute inset-0 transition-transform duration-500 preserve-3d ${
                previewFlipped ? 'rotate-y-180' : ''
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front */}
              <div
                className="absolute inset-0 backface-hidden bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl p-6 flex flex-col items-center justify-center text-white"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <p className="text-lg font-medium text-center">
                  {previewCard?.front_text}
                </p>
                {previewCard?.front_text_ar && (
                  <p className="text-sm mt-2 opacity-90" dir="rtl">
                    {previewCard.front_text_ar}
                  </p>
                )}
                <p className="text-xs mt-4 opacity-75">Click to flip</p>
              </div>

              {/* Back */}
              <div
                className="absolute inset-0 backface-hidden bg-white rounded-xl p-6 flex flex-col items-center justify-center border-2 border-purple-200 rotate-y-180"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <p className="text-gray-900 text-center">
                  {previewCard?.back_text}
                </p>
                {previewCard?.back_text_ar && (
                  <p className="text-gray-600 text-sm mt-2" dir="rtl">
                    {previewCard.back_text_ar}
                  </p>
                )}
                {previewCard?.hint && (
                  <div className="mt-4 p-2 bg-yellow-50 rounded text-sm text-yellow-700 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    {previewCard.hint}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewFlipped(!previewFlipped)}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Flip Card
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirmCard}
        onOpenChange={(open) => !open && setDeleteConfirmCard(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Flashcard</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this flashcard? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">
              {deleteConfirmCard?.front_text}
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmCard(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                deleteConfirmCard && handleDelete(deleteConfirmCard.id)
              }
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Flashcard Card Component
interface FlashcardCardProps {
  card: Flashcard;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: () => void;
  onPreview: () => void;
}

function FlashcardCard({
  card,
  index,
  onEdit,
  onDelete,
  onTogglePublish,
  onPreview,
}: FlashcardCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header with gradient */}
      <div className="h-2 bg-gradient-to-r from-purple-500 to-indigo-600" />

      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 text-gray-400">
            <GripVertical className="w-4 h-4" />
            <span className="font-mono text-sm">#{index}</span>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                card.difficulty_level === 'easy'
                  ? 'bg-green-100 text-green-700'
                  : card.difficulty_level === 'hard'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {card.difficulty_level}
            </span>
            <button
              onClick={onTogglePublish}
              className={`p-1 rounded transition-colors ${
                card.is_published
                  ? 'text-green-600 hover:bg-green-50'
                  : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {card.is_published ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Front */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Front
          </p>
          <p className="text-gray-900 font-medium line-clamp-2">
            {card.front_text}
          </p>
          {card.front_text_ar && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-1" dir="rtl">
              {card.front_text_ar}
            </p>
          )}
        </div>

        {/* Back */}
        <div className="mb-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Back
          </p>
          <p className="text-gray-700 text-sm line-clamp-2">
            {card.back_text}
          </p>
        </div>

        {/* Hint indicator */}
        {card.hint && (
          <div className="flex items-center gap-1 text-yellow-600 text-xs mb-3">
            <Lightbulb className="w-3 h-3" />
            <span>Has hint</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Button variant="ghost" size="sm" onClick={onPreview}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

// Flashcard Dialog Component
interface FlashcardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FlashcardInsert | FlashcardUpdate) => void;
  title: string;
  defaultValues?: Partial<Flashcard>;
  nextOrderIndex?: number;
}

function FlashcardDialog({
  open,
  onOpenChange,
  onSubmit,
  title,
  defaultValues,
  nextOrderIndex = 1,
}: FlashcardDialogProps) {
  const [formData, setFormData] = useState<Partial<FlashcardInsert>>({
    front_text: defaultValues?.front_text || '',
    front_text_ar: defaultValues?.front_text_ar || '',
    back_text: defaultValues?.back_text || '',
    back_text_ar: defaultValues?.back_text_ar || '',
    hint: defaultValues?.hint || '',
    hint_ar: defaultValues?.hint_ar || '',
    front_image_url: defaultValues?.front_image_url || '',
    back_image_url: defaultValues?.back_image_url || '',
    difficulty_level: defaultValues?.difficulty_level || 'medium',
    order_index: defaultValues?.order_index || nextOrderIndex,
    tags: defaultValues?.tags || [],
    is_published: defaultValues?.is_published ?? true,
  });

  // Reset form when dialog opens with new values
  useState(() => {
    if (defaultValues) {
      setFormData({
        front_text: defaultValues.front_text || '',
        front_text_ar: defaultValues.front_text_ar || '',
        back_text: defaultValues.back_text || '',
        back_text_ar: defaultValues.back_text_ar || '',
        hint: defaultValues.hint || '',
        hint_ar: defaultValues.hint_ar || '',
        front_image_url: defaultValues.front_image_url || '',
        back_image_url: defaultValues.back_image_url || '',
        difficulty_level: defaultValues.difficulty_level || 'medium',
        order_index: defaultValues.order_index || nextOrderIndex,
        tags: defaultValues.tags || [],
        is_published: defaultValues.is_published ?? true,
      });
    }
  });

  const handleSubmit = () => {
    if (!formData.front_text) {
      toast.error('Front content is required');
      return;
    }
    if (!formData.back_text) {
      toast.error('Back content is required');
      return;
    }
    onSubmit(formData as FlashcardInsert);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Front Content */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-600 text-white rounded flex items-center justify-center text-sm">
                F
              </span>
              Front of Card
            </h4>
            <div className="space-y-3">
              <div>
                <Label>Content (English) *</Label>
                <Textarea
                  value={formData.front_text}
                  onChange={(e) =>
                    setFormData({ ...formData, front_text: e.target.value })
                  }
                  placeholder="Enter the question or term"
                  rows={2}
                />
              </div>
              <div>
                <Label>Content (Arabic)</Label>
                <Textarea
                  value={formData.front_text_ar || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      front_text_ar: e.target.value,
                    })
                  }
                  placeholder="ادخل السؤال أو المصطلح"
                  dir="rtl"
                  rows={2}
                />
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input
                  value={formData.front_image_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, front_image_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Back Content */}
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h4 className="font-medium text-indigo-900 mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-indigo-600 text-white rounded flex items-center justify-center text-sm">
                B
              </span>
              Back of Card
            </h4>
            <div className="space-y-3">
              <div>
                <Label>Content (English) *</Label>
                <Textarea
                  value={formData.back_text}
                  onChange={(e) =>
                    setFormData({ ...formData, back_text: e.target.value })
                  }
                  placeholder="Enter the answer or definition"
                  rows={3}
                />
              </div>
              <div>
                <Label>Content (Arabic)</Label>
                <Textarea
                  value={formData.back_text_ar || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, back_text_ar: e.target.value })
                  }
                  placeholder="ادخل الإجابة أو التعريف"
                  dir="rtl"
                  rows={3}
                />
              </div>
              <div>
                <Label>Image URL (optional)</Label>
                <Input
                  value={formData.back_image_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, back_image_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Hint */}
          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              Hint (optional)
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hint (English)</Label>
                <Input
                  value={formData.hint || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, hint: e.target.value })
                  }
                  placeholder="A helpful clue..."
                />
              </div>
              <div>
                <Label>Hint (Arabic)</Label>
                <Input
                  value={formData.hint_ar || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, hint_ar: e.target.value })
                  }
                  placeholder="تلميح مفيد..."
                  dir="rtl"
                />
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Difficulty</Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) =>
                  setFormData({ ...formData, difficulty_level: value as any })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Order Index</Label>
              <Input
                type="number"
                value={formData.order_index}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    order_index: parseInt(e.target.value),
                  })
                }
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_published}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_published: checked })
                  }
                />
                <Label>Published</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            {defaultValues ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
