"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MarkdownTextProps {
  content: string;
  className?: string;
}

function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: React.ReactNode[] = [];
  let key = 0;

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${key++}`} className="list-disc list-inside space-y-1 text-sm">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      flushList();
      continue;
    }

    // List item
    if (/^[-*]\s/.test(line.trim())) {
      inList = true;
      const itemText = line.trim().replace(/^[-*]\s/, "");
      listItems.push(
        <li key={`li-${key++}`}>{renderInline(itemText)}</li>
      );
      continue;
    }

    flushList();

    // Heading
    if (/^###\s/.test(line)) {
      elements.push(
        <h4 key={`h4-${key++}`} className="mt-3 mb-1 text-sm font-semibold text-foreground">
          {renderInline(line.replace(/^###\s/, ""))}
        </h4>
      );
      continue;
    }

    if (/^##\s/.test(line)) {
      elements.push(
        <h3 key={`h3-${key++}`} className="mt-3 mb-1 text-base font-semibold text-foreground">
          {renderInline(line.replace(/^##\s/, ""))}
        </h3>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${key++}`} className="text-sm leading-relaxed">
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  return elements;
}

function renderInline(text: string): React.ReactNode {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

export default function MarkdownText({ content, className }: MarkdownTextProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {renderMarkdown(content)}
    </div>
  );
}
