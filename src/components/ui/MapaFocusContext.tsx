"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface FocusTarget {
  id: number;
  /** Muda a cada clique para reativar o efeito mesmo que o id seja o mesmo. */
  nonce: number;
}

interface MapaFocusValue {
  target: FocusTarget | null;
  focar: (id: number) => void;
}

const MapaFocusCtx = createContext<MapaFocusValue | null>(null);

/**
 * Coordena o botão "Mostrar no mapa" dos cards com o mapa de coletas: o botão
 * chama `focar(id)` e o mapa reage centralizando no marcador correspondente.
 */
export function MapaFocusProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<FocusTarget | null>(null);

  const focar = useCallback((id: number) => {
    setTarget({ id, nonce: Date.now() });
  }, []);

  return <MapaFocusCtx.Provider value={{ target, focar }}>{children}</MapaFocusCtx.Provider>;
}

/** Retorna null quando usado fora do provider (mapa continua funcionando sozinho). */
export function useMapaFocus() {
  return useContext(MapaFocusCtx);
}
