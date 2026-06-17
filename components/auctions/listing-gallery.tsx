"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

type ListingGalleryProps = {
  imageCount: number;
  title: string;
};

const IMAGE_LABELS = [
  "Exterior front",
  "Exterior rear",
  "Interior cockpit",
  "Interior rear",
  "Engine bay",
  "Wheel & tire",
  "Dashboard detail",
  "Trunk / cargo",
  "Undercarriage",
  "Documentation",
] as const;

export function ListingGallery({ imageCount, title }: ListingGalleryProps) {
  const images = Array.from({ length: imageCount }, (_, index) => index);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeLabel = IMAGE_LABELS[activeIndex % IMAGE_LABELS.length];

  return (
    <div className="space-y-3">
      <div
        className={cn(
          "overflow-hidden rounded-md border border-slate-200 transition-colors",
          activeIndex % 2 === 0 ? "bg-slate-100" : "bg-slate-200/60",
        )}
        aria-live="polite"
        aria-label={`${title}, ${activeLabel}`}
      >
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
            <p className="text-sm font-medium text-slate-700">{activeLabel}</p>
            <p className="text-xs text-slate-500">
              Photo {activeIndex + 1} of {imageCount}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
        {images.map((index) => {
          const isActive = activeIndex === index;
          const label = IMAGE_LABELS[index % IMAGE_LABELS.length];

          return (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View ${label}, photo ${index + 1}`}
              aria-pressed={isActive}
              className={cn(
                "aspect-[4/3] overflow-hidden rounded border bg-slate-100 transition-colors",
                isActive
                  ? "border-slate-900 ring-1 ring-slate-900"
                  : "border-slate-200 hover:border-slate-400",
              )}
            >
              <div className="flex h-full flex-col items-center justify-center gap-1 px-1">
                <svg
                  viewBox="0 0 120 48"
                  className="h-4 w-8 text-slate-300"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8 32h8l4-12h56l4 12h8l-6-18H14L8 32z" />
                </svg>
                <span className="truncate text-[10px] text-slate-500">{index + 1}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
