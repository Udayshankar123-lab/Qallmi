"use client";

import React from "react";
import { Category } from "@/types/cafe";

interface CategoryChipsProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  itemCounts: Record<string, number>;
}

export default function CategoryChips({
  categories,
  selectedCategory,
  onSelectCategory,
  itemCounts,
}: CategoryChipsProps) {
  return (
    <div className="sticky top-[61px] z-30 bg-[#F7F2EA]/95 backdrop-blur-md border-b border-[#B8A99A]/20 py-2.5 px-4">
      <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const count = itemCounts[cat.id] ?? 0;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isSelected
                  ? "bg-[#241713] text-[#F7F2EA] shadow-sm border border-[#C6A46C]/40"
                  : "bg-[#FFFFFF] text-[#493126] border border-[#B8A99A]/30 hover:border-[#493126]"
              }`}
            >
              <span>{cat.name}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected
                      ? "bg-[#C6A46C] text-[#241713]"
                      : "bg-[#F7F2EA] text-[#493126]"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
