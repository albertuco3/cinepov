"use client";

import { errorMessage } from "@/lib/errors";
import { useState, useRef } from "react";
import Link from "@/components/LocaleLink";

interface ImportedMovie {
  title: string;
  score: number;
}

interface FailedMovie {
  title: string;
  reason: string;
}

interface ImportSummary {
  totalProcessed: number;
  totalInFile: number;
  importedCount: number;
  failedCount: number;
  imported: ImportedMovie[];
  failed: FailedMovie[];
  limitApplied: boolean;
  limit: number;
}

export default function ImportClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  // Manejar el arrastre
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Manejar el soltado del archivo
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Manejar la selección del archivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Activar selección de archivo al hacer clic en el contenedor
  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  // Procesar archivo CSV
  const processFile = (file: File) => {
    setError(null);
    setSummary(null);

    // Validar extensión
    if (!file.name.endsWith(".csv")) {
      setError("Por favor, sube únicamente archivos en formato .csv.");
      return;
    }

    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const csvText = e.target?.result;
      if (typeof csvText !== "string") {
        setError("Error al leer el archivo.");
        setLoading(false);
        return;
      }

      try {
        const firstLine = csvText.split(/\r?\n/)[0]?.toLowerCase() || "";
        let endpoint = "";

        // Detección automática del formato analizando los encabezados
        if (firstLine.includes("const") || firstLine.includes("imdb rating") || firstLine.includes("your rating")) {
          endpoint = "/api/import/imdb";
        } else if (firstLine.includes("letterboxd uri") || firstLine.includes("name") || firstLine.includes("rating")) {
          endpoint = "/api/import/letterboxd";
        } else {
          throw new Error("Formato de CSV no reconocido. Asegúrate de subir el ratings.csv oficial de Letterboxd o IMDb.");
        }

        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ csvText }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Ocurrió un error al procesar el archivo.");
        }

        setSummary(data);
      } catch (err) {
        setError(errorMessage(err) || "Error de conexión al servidor.");
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setError("Error al abrir el archivo.");
      setLoading(false);
    };

    reader.readAsText(file, "UTF-8");
  };

  return (
    <div className="max-w-3xl w-full mx-auto space-y-8">
      {/* Cabecera */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-gradient">
          Importar Valoraciones
        </h1>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          Trae tu historial de películas puntuadas de golpe desde Letterboxd o IMDb y sincronízalas en tu perfil demográfico de CinePOV de forma automática.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-sm text-center">
          {error}
        </div>
      )}

      {/* Estado de Carga */}
      {loading && (
        <div className="glass-panel p-10 rounded-3xl text-center space-y-6 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-center space-x-2 py-4">
            <div className="w-4 h-4 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-4 h-4 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-4 h-4 bg-primary rounded-full animate-bounce"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Importando tu historial...</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Buscando películas en TMDB y sincronizando tus puntuaciones en CinePOV. Esto puede tardar hasta un minuto.
            </p>
          </div>
        </div>
      )}

      {/* Pantalla de Resumen Final */}
      {!loading && summary && (
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-white/5 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-2">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-white">¡Sincronización completada!</h2>
            <p className="text-xs text-muted-foreground">
              Se han procesado las películas de tu archivo de exportación.
            </p>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
              <span className="text-2xl sm:text-3xl font-black text-white block">
                {summary.importedCount}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block mt-1">
                Importadas con éxito
              </span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center">
              <span className="text-2xl sm:text-3xl font-black text-white block">
                {summary.failedCount}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-wider block mt-1">
                No encontradas / Error
              </span>
            </div>
          </div>

          {summary.limitApplied && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 p-3.5 rounded-xl text-xs leading-relaxed text-center">
              Aviso: Tu archivo contiene {summary.totalInFile} valoraciones. Para evitar saturación del servidor, hemos procesado únicamente el lote de las primeras {summary.limit} películas.
            </div>
          )}

          {/* Listado de fallidos (si los hay) */}
          {summary.failed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Películas no mapeadas ({summary.failed.length})
              </h3>
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 max-h-40 overflow-y-auto space-y-2 text-xs divide-y divide-white/5">
                {summary.failed.map((movie, idx) => (
                  <div key={idx} className="flex justify-between py-1.5 first:pt-0 last:pb-0 gap-4">
                    <span className="text-white font-medium truncate">{movie.title}</span>
                    <span className="text-muted-foreground text-[10px] uppercase flex-shrink-0">
                      {movie.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Enlaces de Acción */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href="/profile"
              className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-hover shadow-lg hover:shadow-primary/25 interactive-transition cursor-pointer text-center"
            >
              Ver en Mi Perfil
            </Link>
            <Link
              href="/explore"
              className="flex-1 flex justify-center py-3 px-4 border border-white/10 hover:border-white/20 rounded-xl text-sm font-semibold text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 interactive-transition cursor-pointer text-center"
            >
              Ir a Explorar
            </Link>
          </div>
        </div>
      )}

      {/* Selector de archivos Drag & Drop */}
      {!loading && !summary && (
        <div className="space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer interactive-transition flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden bg-white/[0.02] ${
              dragActive
                ? "border-primary bg-primary/5 scale-[1.02]"
                : "border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="p-4 rounded-full bg-white/5 border border-white/10 text-muted-foreground">
              <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            <div className="space-y-1">
              <p className="text-base font-bold text-white">
                Arrastra tu archivo CSV o haz clic aquí
              </p>
              <p className="text-xs text-muted-foreground">
                Sube el archivo <strong className="text-white">ratings.csv</strong> exportado de Letterboxd o IMDb.
              </p>
            </div>
          </div>

          {/* Guías de ayuda en rejilla de 2 columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white/5 border border-white/5 rounded-3xl p-6 sm:p-8">
            
            {/* Guía Letterboxd */}
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="h-5 w-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ¿Cómo exportar de Letterboxd?
              </h2>
              <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-2 leading-relaxed pl-1">
                <li>Inicia sesión en <a href="https://letterboxd.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">Letterboxd.com</a>.</li>
                <li>Ve a tu cuenta, selecciona <strong className="text-white font-semibold">Settings</strong>.</li>
                <li>Haz clic en la pestaña <strong className="text-white font-semibold">Import & Export</strong>.</li>
                <li>Pulsa en <strong className="text-white font-semibold">Export Your Data</strong>.</li>
                <li>Descomprime el archivo <strong className="text-white font-semibold">.zip</strong> descargado.</li>
                <li>Sube el archivo <strong className="text-white font-semibold">ratings.csv</strong> que hay dentro.</li>
              </ol>
            </div>

            {/* Guía IMDb */}
            <div className="space-y-3 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <svg className="h-5 w-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ¿Cómo exportar de IMDb?
              </h2>
              <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-2 leading-relaxed pl-1">
                <li>Inicia sesión en <a href="https://www.imdb.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">IMDb.com</a>.</li>
                <li>Haz clic en tu perfil arriba a la derecha y ve a <strong className="text-white font-semibold">Your Ratings</strong>.</li>
                <li>Haz clic en el botón de los tres puntos verticales en la esquina superior de la lista.</li>
                <li>Selecciona <strong className="text-white font-semibold">Export</strong> del menú desplegable.</li>
                <li>Se descargará directamente un archivo <strong className="text-white font-semibold">.csv</strong>.</li>
                <li>Sube ese archivo descargado directamente aquí.</li>
              </ol>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
