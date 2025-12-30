'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { LocalizedStringSchema, type UILocale } from '@electrovault/schemas';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ArrowDown, X, Loader2, Image as ImageIcon, GripVertical, ArrowUpDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LocalizedInput } from '@/components/forms/localized-input';
import { DialogEditLocaleSelector } from '@/components/forms/dialog-edit-locale-selector';
import { EditLocaleProvider } from '@/contexts/edit-locale-context';
import { type Category, type AttributeDefinition } from '@/lib/api';
import { AttributeDialog } from '@/components/admin/attribute-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { getLocalizedValue } from '@/components/ui/localized-text';

// API Base URL für Proxy-Endpunkte
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Local schema for category creation/editing
// Note: parentId is passed as prop and not editable after creation
// sortOrder is managed via drag-and-drop in the category sidebar
const CreateCategorySchema = z.object({
  name: LocalizedStringSchema,
  description: z.object({
    de: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  iconUrl: z.string().url().optional().nullable(),
});

type CreateCategoryInput = z.infer<typeof CreateCategorySchema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  parentId?: string | null;
  onSaved: () => void;
  allCategories?: Category[];
}

interface AttributeWithInheritance extends AttributeDefinition {
  inheritedFrom?: Category;
  isInherited: boolean;
}

// Sortierbare Attribut-Zeile für Drag & Drop
interface SortableAttributeRowProps {
  attribute: AttributeDefinition;
  locale: UILocale;
  getDataTypeBadge: (dataType: AttributeDefinition['dataType']) => React.ReactNode;
  getScopeBadge: (scope: AttributeDefinition['scope']) => React.ReactNode;
}

function SortableAttributeRow({ attribute, locale, getDataTypeBadge, getScopeBadge }: SortableAttributeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: attribute.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn('h-8', isDragging && 'opacity-50 bg-muted')}
    >
      <TableCell className="py-1 px-2 w-8">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5"
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="py-1 px-2 text-sm">{getLocalizedValue(attribute.displayName, locale)}</TableCell>
      <TableCell className="py-1 px-2 font-mono text-xs text-muted-foreground">{attribute.name}</TableCell>
      <TableCell className="py-1 px-2">{getDataTypeBadge(attribute.dataType)}</TableCell>
      <TableCell className="py-1 px-2">{getScopeBadge(attribute.scope)}</TableCell>
      <TableCell className="py-1 px-2 text-xs text-muted-foreground">{attribute.unit || '-'}</TableCell>
    </TableRow>
  );
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  parentId: initialParentId,
  onSaved,
  allCategories = [],
}: CategoryDialogProps) {
  const api = useApi();
  const { toast } = useToast();
  const t = useTranslations('admin');
  const tCommon = useTranslations('common');
  const tForm = useTranslations('admin.form');
  const locale = useLocale() as UILocale;
  const isEdit = !!category;

  // Icon upload state
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  const [iconUploading, setIconUploading] = useState(false);
  const [iconDragging, setIconDragging] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Attributes state
  const [ownAttributes, setOwnAttributes] = useState<AttributeDefinition[]>([]);
  const [inheritedAttributes, setInheritedAttributes] = useState<AttributeWithInheritance[]>([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [isInheritedOpen, setIsInheritedOpen] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<AttributeDefinition | null>(null);
  const [isAttrCreateDialogOpen, setIsAttrCreateDialogOpen] = useState(false);
  const [isAttrEditDialogOpen, setIsAttrEditDialogOpen] = useState(false);
  const [attributeToDelete, setAttributeToDelete] = useState<AttributeDefinition | null>(null);

  // Sortier-Modus State
  const [isAttributeSortMode, setIsAttributeSortMode] = useState(false);
  const [sortedAttributes, setSortedAttributes] = useState<AttributeDefinition[]>([]);
  const [isSavingSortOrder, setIsSavingSortOrder] = useState(false);

  // Drag & Drop Sensoren
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema) as never,
    defaultValues: {
      name: { de: '', en: '' },
      description: { de: '', en: '' },
      iconUrl: null,
    },
  });

  // Load attributes when editing
  useEffect(() => {
    const loadAttributes = async () => {
      if (!category) {
        setOwnAttributes([]);
        setInheritedAttributes([]);
        return;
      }

      try {
        setLoadingAttributes(true);

        // Alle Attribute für diese Kategorie laden
        const result = await api.getAttributeDefinitions({
          categoryId: category.id,
          limit: 100,
        });

        // Eigene Attribute = die direkt zu dieser Kategorie gehören
        const own = result.data.filter(attr => attr.categoryId === category.id);
        setOwnAttributes(own);

        // Vererbte Attribute von Parent-Kategorien sammeln
        const inherited: AttributeWithInheritance[] = [];
        let currentParentId = category.parentId;

        while (currentParentId) {
          const parentCategory = allCategories.find(c => c.id === currentParentId);
          if (!parentCategory) break;

          try {
            const parentAttrs = await api.getAttributeDefinitions({
              categoryId: currentParentId,
              limit: 100,
            });

            // Nur direkte Attribute dieser Parent-Kategorie
            const directParentAttrs = parentAttrs.data.filter(
              attr => attr.categoryId === currentParentId
            );

            for (const attr of directParentAttrs) {
              inherited.push({
                ...attr,
                inheritedFrom: parentCategory,
                isInherited: true,
              });
            }
          } catch (e) {
            console.error(`Failed to load attributes for parent ${currentParentId}`, e);
          }

          currentParentId = parentCategory.parentId;
        }

        setInheritedAttributes(inherited);
      } catch (error) {
        console.error('Failed to load attributes:', error);
      } finally {
        setLoadingAttributes(false);
      }
    };

    if (open && isEdit) {
      loadAttributes();
    }
  }, [open, category, isEdit, allCategories]);

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name || { de: '', en: '' },
        description: category.description || { de: '', en: '' },
        iconUrl: category.iconUrl,
      });
      // Verwende Proxy-URL für die Vorschau, um CORS-Probleme zu vermeiden
      setIconPreviewUrl(category.iconUrl ? `${API_BASE_URL}/categories/${category.id}/icon` : null);
      setIconFile(null);
    } else {
      form.reset({
        name: { de: '', en: '' },
        description: { de: '', en: '' },
        iconUrl: null,
      });
      setIconPreviewUrl(null);
      setIconFile(null);
    }
  }, [category, initialParentId, form]);

  // Cleanup object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (iconPreviewUrl && iconPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(iconPreviewUrl);
      }
    };
  }, [iconPreviewUrl]);

  // Icon upload handler
  const handleIconUpload = async (file: File) => {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: t('messages.error'),
        description: tForm('iconMaxSize'),
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: t('messages.error'),
        description: tForm('iconAllowedTypes'),
        variant: 'destructive',
      });
      return;
    }

    // Bei bestehender Kategorie: Sofort hochladen
    if (isEdit && category) {
      setIconUploading(true);
      try {
        const result = await api.uploadCategoryIcon(file, category.id);
        const uploadedUrl = result.data.iconUrl;

        // Verwende Proxy-URL für die Vorschau, um CORS-Probleme zu vermeiden
        // Füge timestamp hinzu um Browser-Cache zu umgehen nach Upload
        setIconPreviewUrl(`${API_BASE_URL}/categories/${category.id}/icon?t=${Date.now()}`);
        form.setValue('iconUrl', uploadedUrl);

        toast({
          title: t('messages.success'),
          description: tForm('iconUploaded'),
        });
      } catch (error) {
        toast({
          title: t('messages.error'),
          description: tForm('iconUploadFailed'),
          variant: 'destructive',
        });
      } finally {
        setIconUploading(false);
      }
    } else {
      // Bei neuer Kategorie: Nur File speichern und lokale Vorschau erstellen
      setIconFile(file);
      const previewUrl = URL.createObjectURL(file);
      setIconPreviewUrl(previewUrl);
    }
  };

  const onSubmit = async (data: CreateCategoryInput) => {
    try {
      // Clean up empty strings
      const payload = {
        ...data,
        iconUrl: data.iconUrl || null,
      };

      if (isEdit) {
        await api.updateCategory(category.id, payload);
        toast({
          title: t('messages.success'),
          description: t('messages.category.updated'),
        });
      } else {
        // Neue Kategorie: parentId aus props verwenden
        const createPayload = {
          ...payload,
          parentId: initialParentId || null,
        };
        const result = await api.createCategory(createPayload);
        const newCategoryId = result.data.id;

        // Icon hochladen falls ausgewählt
        if (iconFile && newCategoryId) {
          try {
            const uploadResult = await api.uploadCategoryIcon(iconFile, newCategoryId);
            const uploadedUrl = uploadResult.data.iconUrl;

            // Kategorie mit iconUrl aktualisieren
            await api.updateCategory(newCategoryId, {
              ...payload,
              iconUrl: uploadedUrl,
            });
          } catch (uploadError) {
            toast({
              title: t('messages.warning'),
              description: tForm('categoryCreatedIconFailed'),
              variant: 'destructive',
            });
          }
        }

        toast({
          title: t('messages.success'),
          description: t('messages.category.created'),
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.category.saveFailed'),
        variant: 'destructive',
      });
    }
  };

  // Attribute management functions
  const reloadAttributes = async () => {
    if (!category) return;
    try {
      setLoadingAttributes(true);
      const result = await api.getAttributeDefinitions({
        categoryId: category.id,
        limit: 100,
      });
      const own = result.data.filter(attr => attr.categoryId === category.id);
      setOwnAttributes(own);
    } catch (error) {
      console.error('Failed to reload attributes:', error);
    } finally {
      setLoadingAttributes(false);
    }
  };

  const handleAttrEdit = (attribute: AttributeDefinition) => {
    setSelectedAttribute(attribute);
    setIsAttrEditDialogOpen(true);
  };

  const handleAttrDelete = async (attribute: AttributeDefinition) => {
    try {
      await api.deleteAttributeDefinition(attribute.id);
      toast({
        title: t('messages.success'),
        description: t('messages.attribute.deleted'),
      });
      reloadAttributes();
      setAttributeToDelete(null);
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: t('messages.attribute.deleteFailed'),
        variant: 'destructive',
      });
    }
  };

  const handleAttrSaved = () => {
    reloadAttributes();
    setIsAttrCreateDialogOpen(false);
    setIsAttrEditDialogOpen(false);
    setSelectedAttribute(null);
  };

  // Sortier-Modus starten
  const enterSortMode = () => {
    setSortedAttributes([...ownAttributes]);
    setIsAttributeSortMode(true);
  };

  // Sortier-Modus abbrechen
  const cancelSortMode = () => {
    setSortedAttributes([]);
    setIsAttributeSortMode(false);
  };

  // Drag & Drop Handler
  const handleAttributeDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedAttributes.findIndex((a) => a.id === active.id);
      const newIndex = sortedAttributes.findIndex((a) => a.id === over.id);
      setSortedAttributes(arrayMove(sortedAttributes, oldIndex, newIndex));
    }
  };

  // Sortierung speichern
  const saveSortOrder = async () => {
    if (!category) return;

    setIsSavingSortOrder(true);
    try {
      const attributeOrder = sortedAttributes.map((attr, index) => ({
        id: attr.id,
        sortOrder: index,
      }));

      await api.reorderAttributes(category.id, attributeOrder);

      toast({
        title: t('messages.success'),
        description: 'Reihenfolge gespeichert',
      });

      // Neu laden und Sortier-Modus beenden
      await reloadAttributes();
      setIsAttributeSortMode(false);
      setSortedAttributes([]);
    } catch (error) {
      toast({
        title: t('messages.error'),
        description: 'Fehler beim Speichern der Reihenfolge',
        variant: 'destructive',
      });
    } finally {
      setIsSavingSortOrder(false);
    }
  };

  const getScopeBadge = (scope: AttributeDefinition['scope']) => {
    const variants = {
      COMPONENT: 'default',
      PART: 'secondary',
      BOTH: 'outline',
    } as const;

    const labels = {
      COMPONENT: 'Comp',
      PART: 'Part',
      BOTH: 'Beide',
    };

    return <Badge variant={variants[scope]} className="text-xs py-0 px-1">{labels[scope]}</Badge>;
  };

  const getDataTypeBadge = (dataType: AttributeDefinition['dataType']) => {
    const labels: Record<string, string> = {
      DECIMAL: 'Dez',
      INTEGER: 'Int',
      STRING: 'Text',
      BOOLEAN: 'Bool',
      RANGE: 'Range',
      SELECT: 'Select',
      MULTISELECT: 'Multi',
    };

    return <Badge variant="outline" className="text-xs py-0 px-1">{labels[dataType] || dataType}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <EditLocaleProvider>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>{isEdit ? t('dialogs.category.titleEdit') : t('dialogs.category.title')}</DialogTitle>
                <DialogDescription>
                  {t('dialogs.category.description')}
                </DialogDescription>
              </div>
              <DialogEditLocaleSelector />
            </div>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">{t('tabs.basicInfo')}</TabsTrigger>
            <TabsTrigger value="attributes" disabled={!isEdit}>
              {t('tabs.attributes')} {isEdit && `(${ownAttributes.length + inheritedAttributes.length})`}
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="mt-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tForm('name')} *</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          placeholder={tForm('categoryName')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{tForm('categoryDescription')}</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          multiline
                          placeholder={tForm('categoryDescriptionPlaceholder')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Icon Upload */}
                <div className="space-y-2">
                  <FormLabel>{tForm('icon')}</FormLabel>
                  <div className="flex items-start gap-4">
                    {/* Icon Preview */}
                    <div
                      className={cn(
                        'relative flex items-center justify-center w-24 h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors',
                        iconDragging && 'border-primary bg-primary/5',
                        !iconDragging && 'hover:border-primary/50 hover:bg-muted/30',
                        iconUploading && 'opacity-50 cursor-not-allowed',
                      )}
                      onClick={() => !iconUploading && iconInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIconDragging(true);
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        setIconDragging(false);
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIconDragging(false);
                        const files = e.dataTransfer.files;
                        if (files.length > 0) {
                          handleIconUpload(files[0]);
                        }
                      }}
                    >
                      <input
                        ref={iconInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/svg+xml"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 0) {
                            handleIconUpload(files[0]);
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />

                      {iconUploading ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : iconPreviewUrl ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={iconPreviewUrl}
                            alt="Icon"
                            className="w-full h-full object-contain p-1"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIconPreviewUrl(null);
                              setIconFile(null);
                              form.setValue('iconUrl', null);
                            }}
                            className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="h-6 w-6 text-muted-foreground mx-auto" />
                          <span className="text-xs text-muted-foreground">Icon</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {tForm('iconUploadDescription')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {tForm('iconUploadHint')}
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    {tCommon('cancel')}
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? t('buttons.saving') : isEdit ? t('buttons.update') : tCommon('create')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="mt-4">
            {!isEdit ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('dialogs.category.saveFirst')}</p>
              </div>
            ) : loadingAttributes ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                {/* Header mit Buttons */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {tForm('attributesInherited')}
                  </p>
                  {isAttributeSortMode ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={cancelSortMode} disabled={isSavingSortOrder}>
                        {tCommon('cancel')}
                      </Button>
                      <Button size="sm" onClick={saveSortOrder} disabled={isSavingSortOrder}>
                        {isSavingSortOrder ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        Speichern
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {ownAttributes.length > 1 && (
                        <Button size="sm" variant="outline" onClick={enterSortMode}>
                          <ArrowUpDown className="mr-1 h-3 w-3" />
                          Sortieren
                        </Button>
                      )}
                      <Button size="sm" onClick={() => setIsAttrCreateDialogOpen(true)}>
                        <Plus className="mr-1 h-3 w-3" />
                        {tForm('newAttribute')}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Eigene Attribute */}
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">
                    {tForm('ownAttributes', { count: ownAttributes.length })}
                  </h4>
                  {ownAttributes.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      {tForm('noOwnAttributes')}
                    </p>
                  ) : isAttributeSortMode ? (
                    /* Sortier-Modus: Drag & Drop Tabelle */
                    <div className="max-h-[200px] overflow-y-auto border rounded">
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleAttributeDragEnd}
                      >
                        <Table>
                          <TableHeader>
                            <TableRow className="h-7">
                              <TableHead className="w-8 py-1 px-2"></TableHead>
                              <TableHead className="py-1 px-2 text-xs">Anzeigename</TableHead>
                              <TableHead className="py-1 px-2 text-xs">Name</TableHead>
                              <TableHead className="py-1 px-2 text-xs">Typ</TableHead>
                              <TableHead className="py-1 px-2 text-xs">Scope</TableHead>
                              <TableHead className="py-1 px-2 text-xs">Einheit</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <SortableContext
                              items={sortedAttributes.map((a) => a.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {sortedAttributes.map((attr) => (
                                <SortableAttributeRow
                                  key={attr.id}
                                  attribute={attr}
                                  locale={locale}
                                  getDataTypeBadge={getDataTypeBadge}
                                  getScopeBadge={getScopeBadge}
                                />
                              ))}
                            </SortableContext>
                          </TableBody>
                        </Table>
                      </DndContext>
                    </div>
                  ) : (
                    /* Normaler Modus: Kompakte Tabelle mit Aktionen */
                    <div className="max-h-[200px] overflow-y-auto border rounded">
                      <Table>
                        <TableHeader>
                          <TableRow className="h-7">
                            <TableHead className="py-1 px-2 text-xs">Anzeigename</TableHead>
                            <TableHead className="py-1 px-2 text-xs">Name</TableHead>
                            <TableHead className="py-1 px-2 text-xs">Typ</TableHead>
                            <TableHead className="py-1 px-2 text-xs">Scope</TableHead>
                            <TableHead className="py-1 px-2 text-xs">Einheit</TableHead>
                            <TableHead className="py-1 px-2 text-xs text-right">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ownAttributes.map((attr) => (
                            <TableRow key={attr.id} className="h-8">
                              <TableCell className="py-1 px-2 text-sm">{getLocalizedValue(attr.displayName, locale)}</TableCell>
                              <TableCell className="py-1 px-2 font-mono text-xs text-muted-foreground">{attr.name}</TableCell>
                              <TableCell className="py-1 px-2">{getDataTypeBadge(attr.dataType)}</TableCell>
                              <TableCell className="py-1 px-2">{getScopeBadge(attr.scope)}</TableCell>
                              <TableCell className="py-1 px-2 text-xs text-muted-foreground">{attr.unit || '-'}</TableCell>
                              <TableCell className="py-1 px-2 text-right">
                                <div className="flex justify-end gap-0.5">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleAttrEdit(attr)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => setAttributeToDelete(attr)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>

                {/* Vererbte Attribute - nur im Normalmodus anzeigen */}
                {!isAttributeSortMode && inheritedAttributes.length > 0 && (
                  <Collapsible open={isInheritedOpen} onOpenChange={setIsInheritedOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between h-7">
                        <span className="flex items-center gap-2 text-xs">
                          <ArrowDown className="h-3 w-3" />
                          {tForm('inheritedAttributes', { count: inheritedAttributes.length })}
                        </span>
                        {isInheritedOpen ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-1">
                      <div className="max-h-[150px] overflow-y-auto border rounded">
                        <Table>
                          <TableHeader>
                            <TableRow className="h-7">
                              <TableHead className="py-1 px-2 text-xs">Anzeigename</TableHead>
                              <TableHead className="py-1 px-2 text-xs">Name</TableHead>
                              <TableHead className="py-1 px-2 text-xs">Typ</TableHead>
                              <TableHead className="py-1 px-2 text-xs">Von</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inheritedAttributes.map((attr) => (
                              <TableRow key={attr.id} className="h-7 opacity-60">
                                <TableCell className="py-1 px-2 text-xs">{getLocalizedValue(attr.displayName, locale)}</TableCell>
                                <TableCell className="py-1 px-2 font-mono text-xs text-muted-foreground">{attr.name}</TableCell>
                                <TableCell className="py-1 px-2">{getDataTypeBadge(attr.dataType)}</TableCell>
                                <TableCell className="py-1 px-2">
                                  <Badge variant="outline" className="text-xs py-0 px-1">
                                    {attr.inheritedFrom ? getLocalizedValue(attr.inheritedFrom.name, locale) : ''}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    {tCommon('cancel')}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Attribute Dialogs */}
        {category && (
          <>
            <AttributeDialog
              open={isAttrCreateDialogOpen}
              onOpenChange={setIsAttrCreateDialogOpen}
              onSaved={handleAttrSaved}
              presetCategoryId={category.id}
            />

            <AttributeDialog
              open={isAttrEditDialogOpen}
              onOpenChange={setIsAttrEditDialogOpen}
              attribute={selectedAttribute}
              onSaved={handleAttrSaved}
              presetCategoryId={selectedAttribute?.categoryId || category.id}
            />

            <DeleteConfirmDialog
              open={!!attributeToDelete}
              onOpenChange={(open) => !open && setAttributeToDelete(null)}
              title="Attribut-Definition löschen?"
              description={`Möchten Sie die Attribut-Definition "${attributeToDelete?.name}" wirklich löschen?`}
              onConfirm={() => attributeToDelete && handleAttrDelete(attributeToDelete)}
            />
          </>
        )}
        </EditLocaleProvider>
      </DialogContent>
    </Dialog>
  );
}
