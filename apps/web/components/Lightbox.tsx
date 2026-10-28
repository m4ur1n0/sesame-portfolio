"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { mediaUrl } from "@/lib/media";
import type { ArtworkImage } from "@/lib/types";

interface Props {
  images: ArtworkImage[];
  currentIndex: number;
  alt: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function Lightbox({
  images,
  currentIndex,
  alt,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const current = images[currentIndex];
  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Image viewer: ${alt}`}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      {/* close */}
      <button
        aria-label="Close image viewer"
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors"
        onClick={onClose}
      >
        <X size={24} />
      </button>

      {/* prev */}
      {images.length > 1 && (
        <button
          aria-label="Previous image"
          className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
        >
          <ChevronLeft size={32} />
        </button>
      )}

      {/* image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mediaUrl(current, "large")}
        alt={current.alt || alt}
        className="max-w-[90vw] max-h-[90vh] object-contain select-none"
        onClick={(e) => e.stopPropagation()}
        draggable={false}
      />

      {/* next */}
      {images.length > 1 && (
        <button
          aria-label="Next image"
          className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
        >
          <ChevronRight size={32} />
        </button>
      )}

      {/* counter */}
      {images.length > 1 && (
        <p className="absolute bottom-4 inset-x-0 text-center text-xs text-white/50">
          {currentIndex + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
