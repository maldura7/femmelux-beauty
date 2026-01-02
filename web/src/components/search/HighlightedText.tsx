'use client';

import React from 'react';

interface HighlightedTextProps {
  text: string;
  highlight: string;
  className?: string;
  highlightClassName?: string;
}

/**
 * Component to highlight search terms in text
 * Wraps matching text in <mark> tags with styling
 */
export function HighlightedText({
  text,
  highlight,
  className = '',
  highlightClassName = 'bg-yellow-200 text-gray-900 rounded px-0.5',
}: HighlightedTextProps) {
  if (!highlight.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Escape special regex characters
  const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Create regex for case-insensitive matching
  const regex = new RegExp(`(${escapedHighlight})`, 'gi');

  // Split text by the regex (keeping the matched parts)
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        // Check if this part matches the highlight (case insensitive)
        const isMatch = part.toLowerCase() === highlight.toLowerCase();

        if (isMatch) {
          return (
            <mark key={index} className={highlightClassName}>
              {part}
            </mark>
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </span>
  );
}

export default HighlightedText;
