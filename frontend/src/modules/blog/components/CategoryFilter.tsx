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
    <div className="flex flex-wrap gap-2 mb-6">
      <Button
        variant={!selectedId ? "default" : "outline"}
        size="sm"
        onClick={() => onSelect(undefined)}
      >
        전체
      </Button>
      {categories.map((cat) => (
        <Button
          key={cat.id}
          variant={selectedId === cat.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelect(cat.id)}
        >
          {cat.name}
        </Button>
      ))}
    </div>
  );
}
