"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-4">
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="text-zinc-400 hover:text-zinc-300 disabled:opacity-30 h-8 w-8 p-0"
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      {start > 1 && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(1)}
            className="text-zinc-400 hover:text-zinc-300 h-8 w-8 p-0"
          >
            1
          </Button>
          {start > 2 && <span className="text-zinc-600 px-1">...</span>}
        </>
      )}
      {pages.map((p) => (
        <Button
          key={p}
          variant="ghost"
          size="sm"
          onClick={() => onPageChange(p)}
          className={`h-8 w-8 p-0 ${
            p === page
              ? "bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30"
              : "text-zinc-400 hover:text-zinc-300"
          }`}
        >
          {p}
        </Button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && (
            <span className="text-zinc-600 px-1">...</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(totalPages)}
            className="text-zinc-400 hover:text-zinc-300 h-8 w-8 p-0"
          >
            {totalPages}
          </Button>
        </>
      )}
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="text-zinc-400 hover:text-zinc-300 disabled:opacity-30 h-8 w-8 p-0"
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}