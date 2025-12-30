'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ArrowUpDown,
  Check,
  X,
  FolderOpen,
} from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type PackageGroup } from '@/lib/api';
import { PackageGroupDialog } from '@/components/admin/package-group-dialog';
import { DeleteConfirmDialog } from '@/components/admin/delete-confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { useApi } from '@/hooks/use-api';
import { cn } from '@/lib/utils';
import { getLocalizedValue } from '@/components/ui/localized-text';
import { type UILocale } from '@electrovault/schemas';

// ============================================
// SORTABLE GROUP ITEM
// ============================================

interface SortableGroupItemProps {
  group: PackageGroup;
  locale: UILocale;
}

function SortableGroupItem({ group, locale }: SortableGroupItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: group.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-1 py-1.5 px-2 rounded-md transition-colors',
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
        {getLocalizedValue(group.name, locale)}
      </span>
      {group._count && (
        <Badge variant="secondary" className="text-xs">
          {group._count.packages}
        </Badge>
      )}
    </div>
  );
}

// ============================================
// PACKAGE GROUP SIDEBAR
// ============================================

interface PackageGroupSidebarProps {
  initialGroups: PackageGroup[];
  canEdit: boolean;
  width: number;
  onWidthChange: (width: number) => void;
  minWidth?: number;
  maxWidth?: number;
}

export function PackageGroupSidebar({
  initialGroups,
  canEdit,
  width,
  onWidthChange,
  minWidth = 150,
  maxWidth = 350,
}: PackageGroupSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const api = useApi();
  const { toast } = useToast();
  const t = useTranslations('packages');
  const locale = useLocale() as UILocale;
  const resizeRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const [groups, setGroups] = useState<PackageGroup[]>(initialGroups);
  const [loading, setLoading] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<PackageGroup | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<PackageGroup | null>(null);

  // Sort mode state
  const [isSortMode, setIsSortMode] = useState(false);
  const [sortedGroups, setSortedGroups] = useState<PackageGroup[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const selectedGroupId = searchParams.get('group');

  // Resize handlers
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

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadGroups = async () => {
    try {
      setLoading(true);
      const result = await api.getAllPackageGroups();
      setGroups(result.data);
    } catch (error) {
      toast({
        title: t('groups.error'),
        description: t('groups.loadError'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (groupId: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (groupId) {
      params.set('group', groupId);
    } else {
      params.delete('group');
    }
    params.delete('page');
    router.push(`?${params.toString()}`);
  };

  // Sort mode handlers
  const enterSortMode = () => {
    setSortedGroups([...groups]);
    setHasChanges(false);
    setIsSortMode(true);
  };

  const cancelSortMode = () => {
    setSortedGroups([]);
    setHasChanges(false);
    setIsSortMode(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sortedGroups.findIndex((g) => g.id === active.id);
      const newIndex = sortedGroups.findIndex((g) => g.id === over.id);
      setSortedGroups(arrayMove(sortedGroups, oldIndex, newIndex));
      setHasChanges(true);
    }
  };

  const saveSortOrder = async () => {
    setIsSaving(true);
    try {
      const reorderData = sortedGroups.map((g, index) => ({
        id: g.id,
        sortOrder: index,
      }));
      await api.reorderPackageGroups(reorderData);
      toast({ title: t('groups.success'), description: t('groups.sortSaved') });
      setGroups(sortedGroups);
      setIsSortMode(false);
      setSortedGroups([]);
      setHasChanges(false);
    } catch (error) {
      toast({
        title: t('groups.error'),
        description: t('groups.sortFailed'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // CRUD handlers
  const handleDelete = async (group: PackageGroup) => {
    try {
      await api.deletePackageGroup(group.id);
      toast({ title: t('groups.success'), description: t('groups.deleteSuccess') });
      loadGroups();
      setGroupToDelete(null);
      if (selectedGroupId === group.id) {
        handleSelect(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('groups.deleteError');
      toast({ title: t('groups.error'), description: message, variant: 'destructive' });
    }
  };

  const handleSaved = () => {
    loadGroups();
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedGroup(null);
  };

  return (
    <>
      <div
        className="flex flex-col h-full bg-background relative border-r"
        style={{ width }}
      >
        {/* Header */}
        <div className="p-2 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-sm flex items-center gap-1.5">
              <FolderOpen className="h-4 w-4" />
              {t('groups.title')}
            </h2>
            <div className="flex gap-1">
              {isSortMode ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={cancelSortMode}
                    disabled={isSaving}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn('h-6 w-6 p-0', hasChanges && 'text-primary')}
                    onClick={saveSortOrder}
                    disabled={isSaving || !hasChanges}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  {canEdit && groups.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={enterSortMode}
                      title={t('groups.reorder')}
                    >
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => setIsCreateDialogOpen(true)}
                      title={t('groups.create')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Group List */}
        <div className="flex-1 overflow-y-auto p-1.5">
          {isSortMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={sortedGroups.map((g) => g.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-0.5">
                  {sortedGroups.map((group) => (
                    <SortableGroupItem key={group.id} group={group} locale={locale} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <>
              {/* "All" option */}
              <div
                className={cn(
                  'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors mb-1',
                  !selectedGroupId && 'bg-primary/10 text-primary',
                  selectedGroupId && 'hover:bg-muted/50'
                )}
                onClick={() => handleSelect(null)}
              >
                <span className="text-sm font-medium">{t('groups.all')}</span>
              </div>

              {loading ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t('groups.loading')}
                </div>
              ) : groups.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  {t('groups.noGroups')}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={cn(
                        'flex items-center gap-1 py-1.5 px-2 rounded-md cursor-pointer transition-colors group',
                        selectedGroupId === group.id && 'bg-primary/10 text-primary',
                        selectedGroupId !== group.id && 'hover:bg-muted/50'
                      )}
                      onClick={() => handleSelect(group.id)}
                    >
                      <span className="text-sm truncate flex-1">
                        {getLocalizedValue(group.name, locale)}
                      </span>
                      {group._count && (
                        <Badge variant="secondary" className="text-xs mr-1">
                          {group._count.packages}
                        </Badge>
                      )}
                      {canEdit && (
                        <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedGroup(group);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setGroupToDelete(group);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Resize Handle */}
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

      {/* Dialogs */}
      {canEdit && (
        <>
          <PackageGroupDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSaved={handleSaved}
          />
          <PackageGroupDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            group={selectedGroup}
            onSaved={handleSaved}
          />
          <DeleteConfirmDialog
            open={!!groupToDelete}
            onOpenChange={(open) => !open && setGroupToDelete(null)}
            title={t('groups.deleteDialog.title')}
            description={t('groups.deleteDialog.description', {
              name: groupToDelete ? getLocalizedValue(groupToDelete.name, locale) : '',
            })}
            onConfirm={() => groupToDelete && handleDelete(groupToDelete)}
          />
        </>
      )}
    </>
  );
}
