'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, GripVertical, Filter, ArrowUpDown, Check, X } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { type Category, type CategoryTreeNode } from '@/lib/api';
import { CategoryDialog } from '@/components/admin/category-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { getLocalizedValue } from '@/components/ui/localized-text';
import { Badge } from '@/components/ui/badge';
import { type UILocale, type AttributeFilter, type AttributeDefinition } from '@electrovault/schemas';
import { AttributeFilterSidebar, FilterConflictDialog } from '@/components/filters';
import { useFilterState } from '@/hooks/use-filter-state';

// Check if a category ID exists in the subtree of a node
function hasSelectedInSubtree(node: CategoryTreeNode, selectedId: string | null): boolean {
  if (!selectedId) return false;
  if (node.id === selectedId) return true;
  if (node.children) {
    return node.children.some(child => hasSelectedInSubtree(child, selectedId));
  }
  return false;
}

// Deep clone category tree
function cloneCategoryTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  return nodes.map(node => ({
    ...node,
    children: node.children ? cloneCategoryTree(node.children) : [],
  }));
}

// ============================================
// SORTABLE CATEGORY ITEM
// ============================================

interface SortableCategoryItemProps {
  node: CategoryTreeNode;
  locale: UILocale;
}

function SortableCategoryItem({ node, locale }: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 py-1 px-1.5 rounded-md transition-colors',
        isDragging && 'opacity-50 bg-primary/5'
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted"
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      <span className="text-sm truncate flex-1">
        {getLocalizedValue(node.name, locale)}
      </span>
    </div>
  );
}

// ============================================
// SORTABLE CATEGORY LIST (for one level)
// ============================================

interface SortableCategoryListProps {
  categories: CategoryTreeNode[];
  parentId: string | null;
  locale: UILocale;
  onReorder: (parentId: string | null, newOrder: CategoryTreeNode[]) => void;
  depth?: number;
}

function SortableCategoryList({
  categories,
  parentId,
  locale,
  onReorder,
  depth = 0,
}: SortableCategoryListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = categories.findIndex(c => c.id === active.id);
      const newIndex = categories.findIndex(c => c.id === over.id);
      const newOrder = arrayMove(categories, oldIndex, newIndex);
      onReorder(parentId, newOrder);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={categories.map(c => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn('space-y-0.5', depth > 0 && 'ml-4 border-l pl-2')}>
          {categories.map((node) => (
            <div key={node.id}>
              <SortableCategoryItem node={node} locale={locale} />
              {node.children && node.children.length > 0 && (
                <SortableCategoryList
                  categories={node.children}
                  parentId={node.id}
                  locale={locale}
                  onReorder={onReorder}
                  depth={depth + 1}
                />
              )}
            </div>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ============================================
// NORMAL CATEGORY TREE ITEM
// ============================================

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onCreate?: (parentId: string) => void;
  canEdit: boolean;
  locale: UILocale;
}

function CategoryTreeItem({
  node,
  selectedCategoryId,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  canEdit,
  locale,
}: CategoryTreeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedCategoryId === node.id;
  const shouldAutoExpand = hasChildren && hasSelectedInSubtree(node, selectedCategoryId) && !isSelected;
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);

  useEffect(() => {
    if (shouldAutoExpand) {
      setIsExpanded(true);
    }
  }, [shouldAutoExpand]);

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
    onSelect(node.id);
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-1.5 rounded-md cursor-pointer transition-colors group',
          isSelected && 'bg-primary/10 text-primary',
          !isSelected && 'hover:bg-muted/50'
        )}
      >
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-4 w-4 p-0 flex-shrink-0', !hasChildren && 'invisible')}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </Button>

        <div
          className="flex-1 min-w-0"
          onClick={handleClick}
        >
          <span className="text-sm truncate block">
            {getLocalizedValue(node.name, locale)}
          </span>
        </div>

        {canEdit && (
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            {onCreate && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreate(node.id);
                }}
                title="Unterkategorie erstellen"
              >
                <Plus className="h-3 w-3" />
              </Button>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(node);
                }}
                title="Bearbeiten"
              >
                <Pencil className="h-3 w-3" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node);
                }}
                title="Löschen"
              >
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
          </div>
        )}
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-3 border-l pl-1.5">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              selectedCategoryId={selectedCategoryId}
              onSelect={onSelect}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreate={onCreate}
              canEdit={canEdit}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN SIDEBAR COMPONENT
// ============================================

interface CategorySidebarProps {
  initialCategories: CategoryTreeNode[];
  canEdit: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

export function CategorySidebar({
  initialCategories,
  canEdit,
  width,
  onWidthChange,
  minWidth = 150,
  maxWidth = 400,
}: CategorySidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useApi();
  const { toast } = useToast();
  const t = useTranslations('admin.categories');
  const locale = useLocale() as UILocale;
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [parentIdForCreate, setParentIdForCreate] = useState<string | null>(null);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  // Sort mode state
  const [isSortMode, setIsSortMode] = useState(false);
  const [sortedTree, setSortedTree] = useState<CategoryTreeNode[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Filter-Konflikt-Dialog State
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [conflictingFilterNames, setConflictingFilterNames] = useState<string[]>([]);
  const [isConflictDialogOpen, setIsConflictDialogOpen] = useState(false);
  const [compatibleFilters, setCompatibleFilters] = useState<AttributeFilter[]>([]);

  const selectedCategoryId = searchParams.get('category');

  // Filter-State aus URL
  const { filters, setFilters, hasFilters } = useFilterState();

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(Math.max(e.clientX, minWidth), maxWidth);
      onWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [minWidth, maxWidth, onWidthChange]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const result = await api.getCategoryTree();
      setCategoryTree(result.data);
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Kategorien konnten nicht geladen werden.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const flatCategories = useMemo(() => {
    const flatten = (nodes: CategoryTreeNode[]): Category[] => {
      const result: Category[] = [];
      for (const node of nodes) {
        result.push(node);
        if (node.children?.length) {
          result.push(...flatten(node.children));
        }
      }
      return result;
    };
    return flatten(categoryTree);
  }, [categoryTree]);

  // Enter sort mode
  const enterSortMode = () => {
    setSortedTree(cloneCategoryTree(categoryTree));
    setHasChanges(false);
    setIsSortMode(true);
  };

  // Cancel sort mode
  const cancelSortMode = () => {
    setSortedTree([]);
    setHasChanges(false);
    setIsSortMode(false);
  };

  // Handle reorder in sort mode
  const handleReorder = (parentId: string | null, newOrder: CategoryTreeNode[]) => {
    setSortedTree(prevTree => {
      const updateChildren = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
        return nodes.map(node => {
          if (parentId === null && nodes === prevTree) {
            // Root level reorder
            return node;
          }
          if (node.id === parentId) {
            return { ...node, children: newOrder };
          }
          if (node.children && node.children.length > 0) {
            return { ...node, children: updateChildren(node.children) };
          }
          return node;
        });
      };

      if (parentId === null) {
        setHasChanges(true);
        return newOrder;
      }

      const updated = updateChildren(prevTree);
      setHasChanges(true);
      return updated;
    });
  };

  // Save sort order
  const saveSortOrder = async () => {
    setIsSaving(true);
    try {
      // Collect all categories with their new sort orders
      const collectReorderData = (
        nodes: CategoryTreeNode[],
        parentId: string | null
      ): Array<{ parentId: string | null; categories: Array<{ id: string; sortOrder: number }> }> => {
        const result: Array<{ parentId: string | null; categories: Array<{ id: string; sortOrder: number }> }> = [];

        // Add current level
        result.push({
          parentId,
          categories: nodes.map((node, index) => ({
            id: node.id,
            sortOrder: index,
          })),
        });

        // Recurse into children
        for (const node of nodes) {
          if (node.children && node.children.length > 0) {
            result.push(...collectReorderData(node.children, node.id));
          }
        }

        return result;
      };

      const reorderData = collectReorderData(sortedTree, null);

      // Send reorder requests for each level
      for (const data of reorderData) {
        await api.reorderCategories(data.parentId, data.categories);
      }

      toast({
        title: 'Erfolg',
        description: t('sortSaved'),
      });

      // Update main tree and exit sort mode
      setCategoryTree(sortedTree);
      setIsSortMode(false);
      setSortedTree([]);
      setHasChanges(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('sortFailed');
      toast({
        title: 'Fehler',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Navigation and filter handling
  const navigateToCategory = (categoryId: string | null, newFilters?: AttributeFilter[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    params.delete('page');

    if (newFilters !== undefined) {
      if (newFilters.length === 0) {
        params.delete('filters');
      } else {
        params.set('filters', encodeURIComponent(JSON.stringify(newFilters)));
      }
    }

    router.push(`/components?${params.toString()}`);
  };

  const handleSelect = async (categoryId: string | null) => {
    if (!hasFilters || filters.length === 0) {
      navigateToCategory(categoryId);
      return;
    }

    if (!categoryId) {
      navigateToCategory(null, []);
      return;
    }

    try {
      const result = await api.getAttributesByCategory(categoryId, { includeInherited: true });
      const newCategoryAttributeIds = new Set(result.data.map((a: AttributeDefinition) => a.id));

      const compatible: AttributeFilter[] = [];
      const incompatible: { filter: AttributeFilter; name: string }[] = [];

      for (const filter of filters) {
        if (newCategoryAttributeIds.has(filter.definitionId)) {
          compatible.push(filter);
        } else {
          const attrName = filter.definitionId;
          incompatible.push({ filter, name: attrName });
        }
      }

      if (incompatible.length === 0) {
        navigateToCategory(categoryId);
        return;
      }

      if (selectedCategoryId) {
        try {
          const oldResult = await api.getAttributesByCategory(selectedCategoryId, { includeInherited: true });
          const oldAttrsMap = new Map(oldResult.data.map((a: AttributeDefinition) => [a.id, a]));

          for (const item of incompatible) {
            const attr = oldAttrsMap.get(item.filter.definitionId);
            if (attr) {
              item.name = getLocalizedValue(attr.displayName, locale);
            }
          }
        } catch {
          // Ignore, use fallback names
        }
      }

      setPendingCategoryId(categoryId);
      setCompatibleFilters(compatible);
      setConflictingFilterNames(incompatible.map(i => i.name));
      setIsConflictDialogOpen(true);
    } catch (error) {
      console.error('Error checking filter compatibility:', error);
      navigateToCategory(categoryId);
    }
  };

  const handleConflictConfirm = () => {
    setIsConflictDialogOpen(false);
    navigateToCategory(pendingCategoryId, compatibleFilters);
    setPendingCategoryId(null);
    setConflictingFilterNames([]);
    setCompatibleFilters([]);
  };

  const handleConflictCancel = () => {
    setIsConflictDialogOpen(false);
    setPendingCategoryId(null);
    setConflictingFilterNames([]);
    setCompatibleFilters([]);
  };

  const handleCreateRoot = () => {
    setParentIdForCreate(null);
    setIsCreateDialogOpen(true);
  };

  const handleCreateChild = (parentId: string) => {
    setParentIdForCreate(parentId);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (category: Category) => {
    try {
      await api.deleteCategory(category.id);
      toast({
        title: 'Erfolg',
        description: 'Kategorie wurde gelöscht.',
      });
      loadCategories();
      setCategoryToDelete(null);
      if (selectedCategoryId === category.id) {
        handleSelect(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Kategorie konnte nicht gelöscht werden.';
      toast({
        title: 'Fehler',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const handleSaved = () => {
    loadCategories();
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedCategory(null);
    setParentIdForCreate(null);
  };

  return (
    <>
      <div
        className="flex flex-col h-full bg-background relative"
        style={{ width }}
      >
        <div className="p-2 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm">Kategorien</h2>
            <div className="flex gap-1">
              {isSortMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={cancelSortMode}
                    title={t('cancelSort')}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("h-6 w-6 p-0", hasChanges && "text-primary")}
                    onClick={saveSortOrder}
                    title={t('saveSortOrder')}
                    disabled={isSaving || !hasChanges}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  {/* Filter Button - nur wenn Kategorie ausgewählt */}
                  {selectedCategoryId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "h-6 w-6 p-0 relative",
                        hasFilters && "text-primary"
                      )}
                      onClick={() => setIsFilterSidebarOpen(true)}
                      title="Filter"
                    >
                      <Filter className="h-4 w-4" />
                      {hasFilters && (
                        <Badge
                          variant="default"
                          className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                        >
                          {filters.length}
                        </Badge>
                      )}
                    </Button>
                  )}
                  {/* Sort Mode Button - nur für Admins/Moderatoren */}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={enterSortMode}
                      title={t('sortMode')}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleCreateRoot}
                      title="Neue Hauptkategorie"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
          {isSortMode && (
            <p className="text-xs text-muted-foreground mt-1">
              {t('sortHint')}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-1.5">
          {isSortMode ? (
            // Sort mode view
            sortedTree.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Keine Kategorien vorhanden
              </div>
            ) : (
              <SortableCategoryList
                categories={sortedTree}
                parentId={null}
                locale={locale}
                onReorder={handleReorder}
              />
            )
          ) : (
            // Normal view
            <>
              {/* Show all option */}
              <div
                className={cn(
                  'flex items-center gap-1 py-1 px-1.5 rounded-md cursor-pointer transition-colors mb-1',
                  !selectedCategoryId && 'bg-primary/10 text-primary',
                  selectedCategoryId && 'hover:bg-muted/50'
                )}
                onClick={() => handleSelect(null)}
              >
                <span className="text-sm font-medium ml-4">Alle Kategorien</span>
              </div>

              {loading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Laden...
                </div>
              ) : categoryTree.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Keine Kategorien vorhanden
                </div>
              ) : (
                <div className="space-y-0.5">
                  {categoryTree.map((node) => (
                    <CategoryTreeItem
                      key={node.id}
                      node={node}
                      selectedCategoryId={selectedCategoryId}
                      onSelect={handleSelect}
                      onEdit={canEdit ? handleEdit : undefined}
                      onDelete={canEdit ? (cat) => setCategoryToDelete(cat) : undefined}
                      onCreate={canEdit ? handleCreateChild : undefined}
                      canEdit={canEdit}
                      locale={locale}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Resize handle */}
        <div
          ref={resizeRef}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/30 transition-colors group flex items-center justify-center"
          onMouseDown={handleMouseDown}
        >
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {canEdit && (
        <>
          <CategoryDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            parentId={parentIdForCreate}
            onSaved={handleSaved}
            allCategories={flatCategories}
          />

          <CategoryDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            category={selectedCategory}
            onSaved={handleSaved}
            allCategories={flatCategories}
          />

          <DeleteConfirmDialog
            open={!!categoryToDelete}
            onOpenChange={(open) => !open && setCategoryToDelete(null)}
            title="Kategorie löschen?"
            description={`Möchten Sie die Kategorie "${categoryToDelete ? getLocalizedValue(categoryToDelete.name, locale) : ''}" wirklich löschen? Dies ist nur möglich, wenn die Kategorie keine Unterkategorien oder Bauteile enthält.`}
            onConfirm={() => categoryToDelete && handleDelete(categoryToDelete)}
          />
        </>
      )}

      {/* Attribut-Filter Sidebar */}
      <AttributeFilterSidebar
        categoryId={selectedCategoryId}
        filters={filters}
        onFiltersChange={setFilters}
        isOpen={isFilterSidebarOpen}
        onClose={() => setIsFilterSidebarOpen(false)}
      />

      {/* Filter-Konflikt Dialog */}
      <FilterConflictDialog
        open={isConflictDialogOpen}
        onOpenChange={setIsConflictDialogOpen}
        conflictingFilterNames={conflictingFilterNames}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
      />
    </>
  );
}
