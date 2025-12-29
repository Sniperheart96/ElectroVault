'use client';

import { useState, useEffect } from 'react';
import { CategorySidebar } from './category-sidebar';
import { ComponentsList } from './components-list';
import { type Component, type CategoryTreeNode } from '@/lib/api';

interface ComponentsPageLayoutProps {
  initialComponents: Component[];
  initialPagination?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  initialCategories: CategoryTreeNode[];
  canEdit: boolean;
}

const SIDEBAR_WIDTH_KEY = 'electrovault-sidebar-width';
const DEFAULT_SIDEBAR_WIDTH = 220;

export function ComponentsPageLayout({
  initialComponents,
  initialPagination,
  initialCategories,
  canEdit,
}: ComponentsPageLayoutProps) {
  // Initialize with default, then update from localStorage after hydration
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);

  // Load from localStorage only on client after hydration
  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (stored) {
      const parsed = parseInt(stored, 10);
      if (!isNaN(parsed) && parsed >= 150 && parsed <= 400) {
        setSidebarWidth(parsed);
      }
    }
  }, []);

  const handleWidthChange = (width: number) => {
    setSidebarWidth(width);
    localStorage.setItem(SIDEBAR_WIDTH_KEY, width.toString());
  };

  return (
    <div className="flex-1 flex">
      {/* Category Sidebar */}
      <aside className="flex-shrink-0 hidden md:block border-r">
        <div className="sticky top-0 h-[calc(100vh-4rem)]">
          <CategorySidebar
            initialCategories={initialCategories}
            canEdit={canEdit}
            width={sidebarWidth}
            onWidthChange={handleWidthChange}
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        <div className="h-[calc(100vh-8rem)]">
          <ComponentsList
            initialData={initialComponents}
            initialPagination={initialPagination}
            initialCategories={initialCategories}
            canEdit={canEdit}
          />
        </div>
      </main>
    </div>
  );
}
