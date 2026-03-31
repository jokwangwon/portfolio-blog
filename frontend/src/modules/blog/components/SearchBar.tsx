"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  placeholder?: string;
}

export default function SearchBar({
  onSearch,
  placeholder = "게시글 검색...",
}: SearchBarProps) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder={placeholder}
      className="max-w-sm"
    />
  );
}
