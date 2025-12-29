'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Category, type CategoryTreeNode } from '@/lib/api';
import { CategoryDialog } from '@/components/admin/category-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';

// Check if a category ID exists in the subtree of a node
function hasSelectedInSubtree(node: CategoryTreeNode, selectedId: string | null): boolean {
  if (!selectedId) return false;
  if (node.id === selectedId) return true;
  if (node.children) {
    return node.children.some(child => hasSelectedInSubtree(child, selectedId));
  }
  return false;
}

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  onCreate?: (parentId: string) => void;
  canEdit: boolean;
}

function CategoryTreeItem({
  node,
  selectedCategoryId,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  canEdit,
}: CategoryTreeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedCategoryId === node.id;
  // Auto-expand if the selected category is in this node's subtree (but not this node itself)
  const shouldAutoExpand = hasChildren && hasSelectedInSubtree(node, selectedCategoryId) && !isSelected;
  const [isExpanded, setIsExpanded] = useState(shouldAutoExpand);

  // Update expanded state when selected category changes
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
          !isSelected && 'hover:bg-muted/50',
          !node.isActive && 'opacity-60'
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
            {node.name.de || node.name.en}
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

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
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [parentIdForCreate, setParentIdForCreate] = useState<string | null>(null);

  const selectedCategoryId = searchParams.get('category');

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

  const handleSelect = (categoryId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (categoryId) {
      params.set('category', categoryId);
    } else {
      params.delete('category');
    }
    params.delete('page');
    router.push(`/components?${params.toString()}`);
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
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5">
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
                />
              ))}
            </div>
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
            description={`Möchten Sie die Kategorie "${categoryToDelete?.name.de || categoryToDelete?.name.en}" wirklich löschen? Dies ist nur möglich, wenn die Kategorie keine Unterkategorien oder Bauteile enthält.`}
            onConfirm={() => categoryToDelete && handleDelete(categoryToDelete)}
          />
        </>
      )}
    </>
  );
}
