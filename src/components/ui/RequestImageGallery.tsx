'use client';

import { useEffect, useRef, useState } from "react";

interface RequestImage {
  id: number;
  url: string;
}

interface Props {
  images: RequestImage[];
  title: string;
}

export function RequestImageGallery({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isImageVisible, setIsImageVisible] = useState(true);
  const hasImages = images.length > 0;
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentImage = images[displayIndex];

  useEffect(() => {
    if (currentIndex === displayIndex) return;

    setIsImageVisible(false);

    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
    }

    transitionTimeoutRef.current = setTimeout(() => {
      setDisplayIndex(currentIndex);
      requestAnimationFrame(() => setIsImageVisible(true));
    }, 180);

    return () => {
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, [currentIndex, displayIndex]);

  const goTo = (index: number) => setCurrentIndex(index);
  const showPrevious = () => setCurrentIndex((index) => (index - 1 + images.length) % images.length);
  const showNext = () => setCurrentIndex((index) => (index + 1) % images.length);

  if (!hasImages) {
    return (
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="flex min-h-[340px] flex-col items-center justify-center px-8 py-12 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
            Anexo visual
          </p>
          <h3 className="mt-3 text-2xl font-semibold text-slate-800">
            Nenhuma imagem anexada
          </h3>
          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-500">
            Esta solicitacao nao possui fotos do material. Os dados abaixo continuam disponiveis para consulta.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
     
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200 md:aspect-[16/8]">
          <img
            src={currentImage.url}
            alt={`${title} - imagem ${displayIndex + 1}`}
            className={`h-full w-full object-cover transition-all duration-300 ease-out ${
              isImageVisible ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"
            }`}
          />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                aria-label="Imagem anterior"
                className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-lg transition hover:scale-105 hover:bg-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={showNext}
                aria-label="Proxima imagem"
                className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-lg transition hover:scale-105 hover:bg-white"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {images.map((image, index) => {
            const active = index === currentIndex;
            return (
              <button
                key={image.id}
                type="button"
                onClick={() => goTo(index)}
                className={`group relative h-24 min-w-[96px] overflow-hidden rounded-2xl border transition ${
                  active
                    ? "border-slate-900 shadow-md"
                    : "border-slate-200 hover:border-slate-300"
                }`}
                aria-label={`Ver imagem ${index + 1}`}
              >
                <img
                  src={image.url}
                  alt={`${title} - miniatura ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <div
                  className={`absolute inset-0 transition ${
                    active ? "bg-transparent" : "bg-slate-900/10 group-hover:bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
