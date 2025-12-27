'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { api, type Category, type CategoryTreeNode } from '@/lib/api';
import { CategoryDialog } from '@/components/admin/category-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CategoryTreeItemProps {
  node: CategoryTreeNode;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
  onCreate: (parentId: string) => void;
}

function CategoryTreeItem({ node, onEdit, onDelete, onCreate }: CategoryTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors group',
          !node.isActive && 'opacity-60'
        )}
      >
        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          className={cn('h-6 w-6 p-0', !hasChildren && 'invisible')}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>

        {/* Icon */}
        {node.iconUrl ? (
          <img
            src={node.iconUrl}
            alt=""
            className="h-5 w-5 object-contain"
          />
        ) : (
          <FolderTree className="h-5 w-5 text-muted-foreground" />
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className="font-medium">
            {node.name.de || node.name.en}
          </span>
          {node.description && (
            <span className="text-sm text-muted-foreground ml-2 truncate">
              {node.description.de || node.description.en}
            </span>
          )}
        </div>

        {/* Badges */}
        <Badge variant="outline" className="ml-2">
          Level {node.level}
        </Badge>
        {!node.isActive && (
          <Badge variant="destructive">Inaktiv</Badge>
        )}

        {/* Actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCreate(node.id)}
            title="Unterkategorie erstellen"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(node)}
            title="Bearbeiten"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(node)}
            title="Löschen"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-8 mt-2 space-y-2 border-l pl-4">
          {node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onCreate={onCreate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [parentIdForCreate, setParentIdForCreate] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadCategories();
  }, []);

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
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Kategorie konnte nicht gelöscht werden. Möglicherweise enthält sie noch Unterkategorien oder Bauteile.',
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

  // Count total categories
  const countCategories = (nodes: CategoryTreeNode[]): number => {
    return nodes.reduce((count, node) => {
      return count + 1 + countCategories(node.children || []);
    }, 0);
  };

  const totalCategories = countCategories(categoryTree);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kategorien</h1>
          <p className="text-muted-foreground">
            Verwalten Sie die Kategorie-Hierarchie ({totalCategories} Kategorien)
          </p>
        </div>
        <Button onClick={handleCreateRoot}>
          <Plus className="mr-2 h-4 w-4" />
          Neue Hauptkategorie
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Kategorie-Baum
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : categoryTree.length === 0 ? (
            <div className="text-center py-8">
              <FolderTree className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Keine Kategorien</h3>
              <p className="text-muted-foreground mb-4">
                Erstellen Sie Ihre erste Kategorie, um Bauteile zu organisieren.
              </p>
              <Button onClick={handleCreateRoot}>
                <Plus className="mr-2 h-4 w-4" />
                Erste Kategorie erstellen
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {categoryTree.map((node) => (
                <CategoryTreeItem
                  key={node.id}
                  node={node}
                  onEdit={handleEdit}
                  onDelete={(cat) => setCategoryToDelete(cat)}
                  onCreate={handleCreateChild}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSaved={handleSaved}
      />

      <CategoryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        category={selectedCategory}
        onSaved={handleSaved}
      />

      <DeleteConfirmDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Kategorie löschen?"
        description={`Möchten Sie die Kategorie "${categoryToDelete?.name.de || categoryToDelete?.name.en}" wirklich löschen? Dies ist nur möglich, wenn die Kategorie keine Unterkategorien oder Bauteile enthält.`}
        onConfirm={() => categoryToDelete && handleDelete(categoryToDelete)}
      />
    </div>
  );
}
