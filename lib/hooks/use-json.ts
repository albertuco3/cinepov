"use client";

import { useEffect, useState } from "react";
import { errorMessage } from "@/lib/errors";

interface JsonState<T> {
  url: string | null;
  data: T | null;
  error: string | null;
}

/**
 * Carga JSON de `url` cada vez que cambia. Con `url = null` no hace nada.
 *
 * - `loading` se deriva (la respuesta guardada no corresponde a la URL
 *   actual), así que no hace falta un `setLoading(true)` dentro del efecto,
 *   que provocaría un render extra.
 * - Una respuesta que llega después de cambiar de URL se descarta: si el
 *   usuario cambia de filtro deprisa, una respuesta antigua no pisa la nueva.
 * - `data` conserva el último resultado mientras carga el siguiente.
 */
export function useJson<T>(url: string | null) {
  const [state, setState] = useState<JsonState<T>>({ url: null, data: null, error: null });

  useEffect(() => {
    if (!url) return;
    let cancelled = false;

    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Error HTTP ${res.status}`);
        }
        return res.json() as Promise<T>;
      })
      .then((data) => {
        if (!cancelled) setState({ url, data, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState((prev) => ({ url, data: prev.data, error: errorMessage(err) || "Error de conexión." }));
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return {
    data: state.data,
    error: state.url === url ? state.error : null,
    loading: url !== null && state.url !== url,
  };
}
