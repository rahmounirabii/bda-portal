import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Settings, Plus, Edit, Trash2, Loader2, FileText, Video, FileCode, BookOpen, Mic, Monitor, Layers, GraduationCap, PlayCircle, Briefcase, Wrench } from 'lucide-react';
import {
  useResourceTypes,
  useResourceCategories,
  useCreateResourceType,
  useUpdateResourceType,
  useDeleteResourceType,
  useCreateResourceCategory,
  useUpdateResourceCategory,
} from '@/entities/resources';
import { useCommonConfirms } from '@/hooks/use-confirm';
import type {
  ResourceType,
  ResourceCategory,
  CreateResourceTypeDTO,
  UpdateResourceTypeDTO,
  CreateResourceCategoryDTO,
  UpdateResourceCategoryDTO,
} from '@/entities/resources';

// Icon mapping for display
const ICON_MAP: Record<string, any> = {
  FileText,
  Video,
  FileCode,
  BookOpen,
  Mic,
  Monitor,
  Layers,
  GraduationCap,
  PlayCircle,
  Briefcase,
  Wrench,
};

const AVAILABLE_ICONS = [
  { value: 'FileText', label: 'File Text' },
  { value: 'Video', label: 'Video' },
  { value: 'FileCode', label: 'File Code' },
  { value: 'BookOpen', label: 'Book Open' },
  { value: 'Mic', label: 'Microphone' },
  { value: 'Monitor', label: 'Monitor' },
  { value: 'Layers', label: 'Layers' },
  { value: 'GraduationCap', label: 'Graduation Cap' },
  { value: 'PlayCircle', label: 'Play Circle' },
  { value: 'Briefcase', label: 'Briefcase' },
  { value: 'Wrench', label: 'Wrench' },
];

const AVAILABLE_COLORS = [
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'orange', label: 'Orange' },
  { value: 'pink', label: 'Pink' },
  { value: 'indigo', label: 'Indigo' },
  { value: 'red', label: 'Red' },
  { value: 'gray', label: 'Gray' },
];

export default function ResourceConfiguration() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-sky-500 via-royal-600 to-navy-800 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3">
          <Settings className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Resource Configuration</h1>
            <p className="mt-2 opacity-90">
              Manage resource types, categories, and visibility rules
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="types" className="space-y-4">
        <TabsList>
          <TabsTrigger value="types">Resource Types</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="types">
          <ResourceTypesManager />
        </TabsContent>

        <TabsContent value="categories">
          <ResourceCategoriesManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// RESOURCE TYPES MANAGER
// ============================================================================

function ResourceTypesManager() {
  const { data: types, isLoading } = useResourceTypes();
  const [editingType, setEditingType] = useState<ResourceType | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const createMutation = useCreateResourceType();
  const updateMutation = useUpdateResourceType();
  const deleteMutation = useDeleteResourceType();
  const { confirmDelete } = useCommonConfirms();

  const [formData, setFormData] = useState<CreateResourceTypeDTO>({
    type_key: '',
    label_en: '',
    label_ar: '',
    icon: 'FileText',
    color: 'blue',
    display_order: 0,
  });

  const handleCreate = async () => {
    await createMutation.mutateAsync(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingType) return;

    const updateData: UpdateResourceTypeDTO = {
      label_en: formData.label_en,
      label_ar: formData.label_ar,
      icon: formData.icon,
      color: formData.color,
      display_order: formData.display_order,
    };

    await updateMutation.mutateAsync({ id: editingType.id, dto: updateData });
    setIsEditOpen(false);
    setEditingType(null);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirmDelete('this resource type');
    if (!confirmed) return;
    await deleteMutation.mutateAsync(id);
  };

  const openEditDialog = (type: ResourceType) => {
    setEditingType(type);
    setFormData({
      type_key: type.type_key,
      label_en: type.label_en,
      label_ar: type.label_ar || '',
      icon: type.icon || 'FileText',
      color: type.color || 'blue',
      display_order: type.display_order,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      type_key: '',
      label_en: '',
      label_ar: '',
      icon: 'FileText',
      color: 'blue',
      display_order: 0,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-royal-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Resource Types</CardTitle>
          <CardDescription>
            Configure types of resources (documents, videos, templates, etc.)
          </CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Resource Type</DialogTitle>
              <DialogDescription>
                Add a new resource type that admins can use when uploading content
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type_key">Type Key (unique identifier)</Label>
                <Input
                  id="type_key"
                  value={formData.type_key}
                  onChange={(e) => setFormData({ ...formData, type_key: e.target.value })}
                  placeholder="e.g., webinar"
                />
              </div>
              <div>
                <Label htmlFor="label_en">Label (English)</Label>
                <Input
                  id="label_en"
                  value={formData.label_en}
                  onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                  placeholder="e.g., Webinar"
                />
              </div>
              <div>
                <Label htmlFor="label_ar">Label (Arabic)</Label>
                <Input
                  id="label_ar"
                  value={formData.label_ar}
                  onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })}
                  placeholder="e.g., ندوة عبر الإنترنت"
                />
              </div>
              <div>
                <Label htmlFor="icon">Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="color">Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Resource Type</DialogTitle>
              <DialogDescription>Update resource type configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type Key (read-only)</Label>
                <Input value={formData.type_key} disabled />
              </div>
              <div>
                <Label htmlFor="edit_label_en">Label (English)</Label>
                <Input
                  id="edit_label_en"
                  value={formData.label_en}
                  onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit_label_ar">Label (Arabic)</Label>
                <Input
                  id="edit_label_ar"
                  value={formData.label_ar}
                  onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ICONS.map((icon) => (
                      <SelectItem key={icon.value} value={icon.value}>
                        {icon.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Color</Label>
                <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        {color.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Display Order</Label>
                <Input
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Type Key</TableHead>
              <TableHead>Label (EN)</TableHead>
              <TableHead>Label (AR)</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types && types.length > 0 ? (
              types.map((type) => {
                const IconComponent = ICON_MAP[type.icon || 'FileText'] || FileText;
                return (
                  <TableRow key={type.id}>
                    <TableCell>
                      <IconComponent className={`h-5 w-5 text-${type.color}-600`} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{type.type_key}</TableCell>
                    <TableCell>{type.label_en}</TableCell>
                    <TableCell>{type.label_ar || '—'}</TableCell>
                    <TableCell>
                      <Badge className={`bg-${type.color}-100 text-${type.color}-800`}>{type.color}</Badge>
                    </TableCell>
                    <TableCell>{type.display_order}</TableCell>
                    <TableCell>
                      <Badge variant={type.is_active ? 'default' : 'secondary'}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(type)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(type.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No resource types configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// RESOURCE CATEGORIES MANAGER
// ============================================================================

function ResourceCategoriesManager() {
  const { data: categories, isLoading } = useResourceCategories();
  const [editingCategory, setEditingCategory] = useState<ResourceCategory | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const createMutation = useCreateResourceCategory();
  const updateMutation = useUpdateResourceCategory();

  const [formData, setFormData] = useState<CreateResourceCategoryDTO>({
    category_key: '',
    label_en: '',
    label_ar: '',
    description_en: '',
    description_ar: '',
    icon: 'Layers',
    color: 'blue',
    display_order: 0,
  });

  const handleCreate = async () => {
    await createMutation.mutateAsync(formData);
    setIsCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;

    const updateData: UpdateResourceCategoryDTO = {
      label_en: formData.label_en,
      label_ar: formData.label_ar,
      description_en: formData.description_en,
      description_ar: formData.description_ar,
      icon: formData.icon,
      color: formData.color,
      display_order: formData.display_order,
    };

    await updateMutation.mutateAsync({ id: editingCategory.id, dto: updateData });
    setIsEditOpen(false);
    setEditingCategory(null);
    resetForm();
  };

  const openEditDialog = (category: ResourceCategory) => {
    setEditingCategory(category);
    setFormData({
      category_key: category.category_key,
      label_en: category.label_en,
      label_ar: category.label_ar || '',
      description_en: category.description_en || '',
      description_ar: category.description_ar || '',
      icon: category.icon || 'Layers',
      color: category.color || 'blue',
      display_order: category.display_order,
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category_key: '',
      label_en: '',
      label_ar: '',
      description_en: '',
      description_ar: '',
      icon: 'Layers',
      color: 'blue',
      display_order: 0,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-royal-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Resource Categories</CardTitle>
          <CardDescription>
            Configure categories for organizing resources (BoCK, Exam Prep, Templates, etc.)
          </CardDescription>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Resource Category</DialogTitle>
              <DialogDescription>Add a new category for organizing resources</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cat_key">Category Key (unique identifier)</Label>
                <Input
                  id="cat_key"
                  value={formData.category_key}
                  onChange={(e) => setFormData({ ...formData, category_key: e.target.value })}
                  placeholder="e.g., research"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cat_label_en">Label (English)</Label>
                  <Input
                    id="cat_label_en"
                    value={formData.label_en}
                    onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                    placeholder="e.g., Research Papers"
                  />
                </div>
                <div>
                  <Label htmlFor="cat_label_ar">Label (Arabic)</Label>
                  <Input
                    id="cat_label_ar"
                    value={formData.label_ar}
                    onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })}
                    placeholder="e.g., أوراق بحثية"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cat_desc_en">Description (English)</Label>
                  <Input
                    id="cat_desc_en"
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <Label htmlFor="cat_desc_ar">Description (Arabic)</Label>
                  <Input
                    id="cat_desc_ar"
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                    placeholder="وصف موجز"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ICONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Resource Category</DialogTitle>
              <DialogDescription>Update category configuration</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Category Key (read-only)</Label>
                <Input value={formData.category_key} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Label (English)</Label>
                  <Input
                    value={formData.label_en}
                    onChange={(e) => setFormData({ ...formData, label_en: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Label (Arabic)</Label>
                  <Input
                    value={formData.label_ar}
                    onChange={(e) => setFormData({ ...formData, label_ar: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Description (English)</Label>
                  <Input
                    value={formData.description_en}
                    onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Description (Arabic)</Label>
                  <Input
                    value={formData.description_ar}
                    onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Icon</Label>
                  <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_ICONS.map((icon) => (
                        <SelectItem key={icon.value} value={icon.value}>
                          {icon.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Color</Label>
                  <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_COLORS.map((color) => (
                        <SelectItem key={color.value} value={color.value}>
                          {color.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Display Order</Label>
                  <Input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Icon</TableHead>
              <TableHead>Category Key</TableHead>
              <TableHead>Label (EN)</TableHead>
              <TableHead>Label (AR)</TableHead>
              <TableHead>Description (EN)</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories && categories.length > 0 ? (
              categories.map((category) => {
                const IconComponent = ICON_MAP[category.icon || 'Layers'] || Layers;
                return (
                  <TableRow key={category.id}>
                    <TableCell>
                      <IconComponent className={`h-5 w-5 text-${category.color}-600`} />
                    </TableCell>
                    <TableCell className="font-mono text-sm">{category.category_key}</TableCell>
                    <TableCell>{category.label_en}</TableCell>
                    <TableCell>{category.label_ar || '—'}</TableCell>
                    <TableCell className="max-w-xs truncate">{category.description_en || '—'}</TableCell>
                    <TableCell>{category.display_order}</TableCell>
                    <TableCell>
                      <Badge variant={category.is_active ? 'default' : 'secondary'}>
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(category)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No resource categories configured
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
