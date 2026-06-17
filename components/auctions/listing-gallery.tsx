"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

type ListingGalleryProps = {
  imageCount: number;
  title: string;
};

export function ListingGallery({ imageCount, title }: ListingGalleryProps) {
  const images = Array.from({ length: imageCount }, (_, index) => index);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-100">
        <div className="aspect-[16/10]">
          <div className="flex h-full flex-col items-center justify-center gap-2 p-8">
            <svg
              viewBox="0 0 200 80"
              className="h-20 w-44 text-slate-300"
              fill="currentColor"
              aria-hidden
            >
              <path d="M12 52h14l6-18h96l6 18h14l-10-28H22L12 52zm22-12h112l-4-12H38l-4 12z" />
              <circle cx="44" cy="58" r="10" />
              <circle cx="156" cy="58" r="10" />
            </svg>
            <p className="text-sm text-slate-600">
              Photo {activeIndex + 1} of {imageCount}
            </p>
            <p className="sr-only">{title}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {images.map((index) => (
          <button
            key={index}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`View photo ${index + 1}`}
            aria-current={activeIndex === index ? "true" : undefined}
            className={cn(
              "aspect-[4/3] overflow-hidden rounded border bg-slate-100 transition-colors",
              activeIndex === index
                ? "border-slate-900"
                : "border-slate-200 hover:border-slate-400",
            )}
          >
            <div className="flex h-full items-center justify-center">
              <svg
                viewBox="0 0 120 48"
                className="h-4 w-8 text-slate-300"
                fill="currentColor"
                aria-hidden
              >
                <path d="M8 32h8l4-12h56l4 12h8l-6-18H14L8 32z" />
              </svg>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
