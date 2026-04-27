"use client";

import { useRouter } from "next/navigation";

type BackButtonProps = {
  children: React.ReactNode;
  className?: string;
  fallbackHref?: string;
};

export function BackButton({ children, className, fallbackHref = "/" }: BackButtonProps) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {children}
    </button>
  );
}
