"use client";

import type { CategoryResponse } from "@/src/types/api";
import { Button } from "@/components/ui/button";

interface CategoryFilterProps {
  categories: CategoryResponse[];
  selectedId?: number;
  onSelect: (categoryId?: number) => void;
}

export default function CategoryFilter({
  categories,
  selectedId,
  onSelect,
}: CategoryFilterProps) {
  return (
    <nav className="glass-sidebar flex flex-col gap-1">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        카테고리
      </h3>
      <Button
        variant="ghost"
        size="sm"
        className={`justify-start ${!selectedId ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"}`}
        onClick={() => onSelect(undefined)}
      >
        전체
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant="ghost"
          size="sm"
          className={`justify-start ${selectedId === cat.id ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground"}`}
          onClick={() => onSelect(cat.id)}
        >
          {cat.name}
        </Button>
      ))}
    </nav>
  );
}
