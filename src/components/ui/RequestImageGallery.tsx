'use client';

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface RequestImage {
  id: number;
  url: string;
}

interface Props {
  images: RequestImage[];
  title: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

const clampZoom = (value: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));

export function RequestImageGallery({ images, title }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [isImageVisible, setIsImageVisible] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const hasImages = images.length > 0;
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const currentImage = images[displayIndex];

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  useEffect(() => {
    if (!isLightboxOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
        return;
      }

      if (images.length <= 1) return;

      if (event.key === "ArrowLeft") {
        setCurrentIndex((index) => (index - 1 + images.length) % images.length);
      }

      if (event.key === "ArrowRight") {
        setCurrentIndex((index) => (index + 1) % images.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images.length, isLightboxOpen]);

  useEffect(() => {
    if (!isLightboxOpen) {
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
      setIsDragging(false);
      return;
    }

    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  }, [currentIndex, isLightboxOpen]);

  const goTo = (index: number) => setCurrentIndex(index);
  const showPrevious = () => setCurrentIndex((index) => (index - 1 + images.length) % images.length);
  const showNext = () => setCurrentIndex((index) => (index + 1) % images.length);
  const openLightbox = () => setIsLightboxOpen(true);
  const closeLightbox = () => setIsLightboxOpen(false);
  const zoomIn = () => setZoomLevel((value) => clampZoom(Number((value + 0.25).toFixed(2))));
  const zoomOut = () =>
    setZoomLevel((value) => {
      const next = clampZoom(Number((value - 0.25).toFixed(2)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  const resetZoom = () => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const handleZoomWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();

    setZoomLevel((value) => {
      const next = clampZoom(Number((value + (event.deltaY < 0 ? 0.2 : -0.2)).toFixed(2)));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleDragStart = (event: React.MouseEvent<HTMLDivElement>) => {
    if (zoomLevel <= 1) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: event.clientX - pan.x,
      y: event.clientY - pan.y,
    };
  };

  const handleDragMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStartRef.current || zoomLevel <= 1) return;

    setPan({
      x: event.clientX - dragStartRef.current.x,
      y: event.clientY - dragStartRef.current.y,
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

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

  const lightbox = isLightboxOpen && currentImage ? (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/88 px-4 py-6 backdrop-blur-sm"
      onClick={closeLightbox}
      role="dialog"
      aria-modal="true"
      aria-label={`Visualizacao ampliada de ${title}`}
    >
      <button
        type="button"
        onClick={closeLightbox}
        className="absolute right-3 top-3 z-[110] flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-white/95 text-slate-950 shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-white"
        aria-label="Fechar visualizacao"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M18 6 6 18" />
          <path d="m6 6 12 12" />
        </svg>
      </button>

      <div
        className="relative flex w-full max-w-6xl flex-col gap-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 text-white">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/60">
              Visualizacao ampliada
            </p>
            <p className="mt-1 text-sm text-white/80">{title}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-950 shadow-sm">
              {currentIndex + 1} / {images.length}
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/95 p-1 text-slate-950 shadow-lg backdrop-blur-sm">
              <button
                type="button"
                onClick={zoomOut}
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Diminuir zoom"
                disabled={zoomLevel <= MIN_ZOOM}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M5 12h14" />
                </svg>
              </button>
              <button
                type="button"
                onClick={resetZoom}
                className="rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] text-slate-950 transition hover:bg-slate-100"
                aria-label="Redefinir zoom"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Aumentar zoom"
                disabled={zoomLevel >= MAX_ZOOM}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/30 shadow-2xl">
          <div
            className={`flex h-[min(78vh,820px)] items-center justify-center overflow-hidden p-4 md:p-8 ${
              zoomLevel > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
            }`}
            onWheel={handleZoomWheel}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            onDoubleClick={zoomLevel > 1 ? resetZoom : zoomIn}
          >
            <img
              src={currentImage.url}
              alt={`${title} - imagem ampliada ${displayIndex + 1}`}
              className={`max-h-full max-w-full object-contain transition-all duration-300 ease-out ${
                isImageVisible ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"
              }`}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                transformOrigin: "center center",
                transition: isDragging
                  ? "opacity 300ms ease-out"
                  : "transform 220ms ease-out, opacity 300ms ease-out",
                userSelect: "none",
              }}
              draggable={false}
            />
          </div>

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

        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {images.map((image, index) => {
              const active = index === currentIndex;
              return (
                <button
                  key={`lightbox-${image.id}`}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`relative h-20 min-w-[84px] overflow-hidden rounded-2xl border transition ${
                    active
                      ? "border-white shadow-lg"
                      : "border-white/15 hover:border-white/40"
                  }`}
                  aria-label={`Ver imagem ${index + 1} ampliada`}
                >
                  <img
                    src={image.url}
                    alt={`${title} - miniatura ampliada ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div
                    className={`absolute inset-0 transition ${
                      active ? "bg-transparent" : "bg-slate-950/30 hover:bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-slate-100 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-5">
            <div className="rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white shadow-sm backdrop-blur-sm">
              Clique para ampliar
            </div>
            <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              {currentIndex + 1} / {images.length}
            </div>
          </div>

          <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-200 md:aspect-[16/8]">
            <button
              type="button"
              onClick={openLightbox}
              className="h-full w-full cursor-zoom-in text-left"
              aria-label="Ampliar imagem"
            >
              <img
                src={currentImage.url}
                alt={`${title} - imagem ${displayIndex + 1}`}
                className={`h-full w-full object-cover transition-all duration-300 ease-out ${
                  isImageVisible ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"
                }`}
              />
            </button>

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

      {isMounted && lightbox ? createPortal(lightbox, document.body) : null}
    </>
  );
}
