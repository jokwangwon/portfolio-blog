"use client";

import type { CategoryResponse } from "@/src/types/api";

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
      <button
        onClick={() => onSelect(undefined)}
        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
          !selectedId
            ? "bg-gray-900 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        전체
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            selectedId === cat.id
              ? "bg-gray-900 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
