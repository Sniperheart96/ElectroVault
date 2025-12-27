'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleItem = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="border rounded-lg overflow-hidden bg-card"
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium pr-4">{item.question}</span>
            <ChevronDown
              className={cn(
                'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0',
                openIndex === index && 'rotate-180'
              )}
            />
          </button>
          {openIndex === index && (
            <div className="px-6 py-4 border-t bg-muted/20">
              <p className="text-muted-foreground">{item.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
