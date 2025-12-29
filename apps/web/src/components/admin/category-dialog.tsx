'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LocalizedStringSchema } from '@electrovault/schemas';
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, ArrowDown, X, Loader2, Image as ImageIcon } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { LocalizedInput } from '@/components/forms/localized-input';
import { type Category, type CategoryTreeNode, type AttributeDefinition } from '@/lib/api';
import { AttributeDialog } from '@/components/admin/attribute-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

// API Base URL für Proxy-Endpunkte
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

// Local schema for category creation/editing
const CreateCategorySchema = z.object({
  name: LocalizedStringSchema,
  parentId: z.string().uuid().optional().nullable(),
  description: z.object({
    de: z.string().optional(),
    en: z.string().optional(),
  }).optional(),
  iconUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
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

function flattenCategories(nodes: CategoryTreeNode[], prefix = '', excludeId?: string): { id: string; name: string }[] {
  const result: { id: string; name: string }[] = [];
  for (const node of nodes) {
    if (excludeId && node.id === excludeId) continue;
    const name = prefix + (node.name.de || node.name.en || 'Unbekannt');
    result.push({ id: node.id, name });
    if (node.children && node.children.length > 0) {
      result.push(...flattenCategories(node.children, name + ' → ', excludeId));
    }
  }
  return result;
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
  const isEdit = !!category;
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

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

  const form = useForm<CreateCategoryInput>({
    resolver: zodResolver(CreateCategorySchema) as never,
    defaultValues: {
      name: { de: '', en: '' },
      parentId: null,
      description: { de: '', en: '' },
      iconUrl: null,
      sortOrder: 0,
      isActive: true,
    },
  });

  // Load categories for parent selection
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const result = await api.getCategoryTree();
        // Exclude current category and its children when editing
        setCategories(flattenCategories(result.data, '', category?.id));
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    if (open) {
      loadCategories();
    }
  }, [open, category?.id]);

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
        parentId: category.parentId,
        description: category.description || { de: '', en: '' },
        iconUrl: category.iconUrl,
        sortOrder: category.sortOrder,
        isActive: category.isActive,
      });
      // Verwende Proxy-URL für die Vorschau, um CORS-Probleme zu vermeiden
      setIconPreviewUrl(category.iconUrl ? `${API_BASE_URL}/categories/${category.id}/icon` : null);
      setIconFile(null);
    } else {
      form.reset({
        name: { de: '', en: '' },
        parentId: initialParentId || null,
        description: { de: '', en: '' },
        iconUrl: null,
        sortOrder: 0,
        isActive: true,
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
        title: 'Fehler',
        description: 'Icon darf maximal 5 MB groß sein.',
        variant: 'destructive',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Fehler',
        description: 'Nur JPEG, PNG, WebP oder SVG erlaubt.',
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
          title: 'Erfolg',
          description: 'Icon wurde hochgeladen.',
        });
      } catch (error) {
        toast({
          title: 'Fehler',
          description: 'Icon konnte nicht hochgeladen werden.',
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
        parentId: data.parentId || null,
        iconUrl: data.iconUrl || null,
      };

      if (isEdit) {
        await api.updateCategory(category.id, payload);
        toast({
          title: 'Erfolg',
          description: 'Kategorie wurde aktualisiert.',
        });
      } else {
        // Neue Kategorie: Erst erstellen, dann Icon hochladen falls vorhanden
        const result = await api.createCategory(payload);
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
              title: 'Warnung',
              description: 'Kategorie erstellt, aber Icon-Upload fehlgeschlagen.',
              variant: 'destructive',
            });
          }
        }

        toast({
          title: 'Erfolg',
          description: 'Kategorie wurde erstellt.',
        });
      }
      onSaved();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: `Kategorie konnte nicht ${isEdit ? 'aktualisiert' : 'erstellt'} werden.`,
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
        title: 'Erfolg',
        description: 'Attribut-Definition wurde gelöscht.',
      });
      reloadAttributes();
      setAttributeToDelete(null);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Attribut-Definition konnte nicht gelöscht werden.',
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

  const getScopeBadge = (scope: AttributeDefinition['scope']) => {
    const variants = {
      COMPONENT: 'default',
      PART: 'secondary',
      BOTH: 'outline',
    } as const;

    const labels = {
      COMPONENT: 'Component',
      PART: 'Part',
      BOTH: 'Beide',
    };

    return <Badge variant={variants[scope]}>{labels[scope]}</Badge>;
  };

  const getDataTypeBadge = (dataType: AttributeDefinition['dataType']) => {
    const labels: Record<string, string> = {
      DECIMAL: 'Dezimal',
      INTEGER: 'Ganzzahl',
      STRING: 'Text',
      BOOLEAN: 'Ja/Nein',
    };

    return <Badge variant="outline">{labels[dataType] || dataType}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Kategorie bearbeiten' : 'Neue Kategorie'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Kategorie-Informationen und Attribute verwalten' : 'Neue Kategorie erstellen'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details">Stammdaten</TabsTrigger>
            <TabsTrigger value="attributes" disabled={!isEdit}>
              Attribute {isEdit && `(${ownAttributes.length + inheritedAttributes.length})`}
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
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          placeholder="Kategoriename"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Übergeordnete Kategorie</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === '_none_' ? null : value)}
                        value={field.value || '_none_'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingCategories ? 'Lädt...' : 'Keine (Root-Kategorie)'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="_none_">Keine (Root-Kategorie)</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Leer lassen für eine Hauptkategorie (Level 0)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschreibung</FormLabel>
                      <FormControl>
                        <LocalizedInput
                          value={field.value || { de: '', en: '' }}
                          onChange={field.onChange}
                          multiline
                          placeholder="Beschreibung der Kategorie"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sortOrder"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sortierreihenfolge</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Niedrigere Werte = weiter oben
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === 'true')}
                          value={field.value ? 'true' : 'false'}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Aktiv</SelectItem>
                            <SelectItem value="false">Inaktiv</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Icon Upload */}
                <div className="space-y-2">
                  <FormLabel>Icon</FormLabel>
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
                        Kategorie-Icon hochladen. Max. 5 MB, JPEG/PNG/WebP/SVG.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Klicken oder Datei hierher ziehen.
                      </p>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Speichern...' : isEdit ? 'Aktualisieren' : 'Erstellen'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>

          {/* Attributes Tab */}
          <TabsContent value="attributes" className="mt-4">
            {!isEdit ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Speichern Sie zuerst die Kategorie, um Attribute hinzuzufügen.</p>
              </div>
            ) : loadingAttributes ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Attribute dieser Kategorie (werden an Unterkategorien vererbt)
                  </p>
                  <Button size="sm" onClick={() => setIsAttrCreateDialogOpen(true)}>
                    <Plus className="mr-1 h-3 w-3" />
                    Neues Attribut
                  </Button>
                </div>

                {/* Eigene Attribute */}
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Eigene Attribute ({ownAttributes.length})
                  </h4>
                  {ownAttributes.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">
                      Keine eigenen Attribute definiert.
                    </p>
                  ) : (
                    <div className="max-h-[200px] overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Anzeigename</TableHead>
                            <TableHead>Typ</TableHead>
                            <TableHead>Scope</TableHead>
                            <TableHead>Einheit</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {ownAttributes.map((attr) => (
                            <TableRow key={attr.id}>
                              <TableCell className="font-mono text-sm">{attr.name}</TableCell>
                              <TableCell>{attr.displayName.de || attr.displayName.en}</TableCell>
                              <TableCell>{getDataTypeBadge(attr.dataType)}</TableCell>
                              <TableCell>{getScopeBadge(attr.scope)}</TableCell>
                              <TableCell>{attr.unit || '-'}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAttrEdit(attr)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
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

                {/* Vererbte Attribute */}
                {inheritedAttributes.length > 0 && (
                  <Collapsible open={isInheritedOpen} onOpenChange={setIsInheritedOpen}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between">
                        <span className="flex items-center gap-2">
                          <ArrowDown className="h-4 w-4" />
                          Vererbte Attribute ({inheritedAttributes.length})
                        </span>
                        {isInheritedOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <div className="max-h-[200px] overflow-y-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Anzeigename</TableHead>
                              <TableHead>Typ</TableHead>
                              <TableHead>Scope</TableHead>
                              <TableHead>Von Kategorie</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {inheritedAttributes.map((attr) => (
                              <TableRow key={attr.id} className="opacity-70">
                                <TableCell className="font-mono text-sm">{attr.name}</TableCell>
                                <TableCell>{attr.displayName.de || attr.displayName.en}</TableCell>
                                <TableCell>{getDataTypeBadge(attr.dataType)}</TableCell>
                                <TableCell>{getScopeBadge(attr.scope)}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {attr.inheritedFrom?.name.de || attr.inheritedFrom?.name.en}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        Vererbte Attribute können nur in ihrer Ursprungs-Kategorie bearbeitet werden.
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Schließen
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
      </DialogContent>
    </Dialog>
  );
}
