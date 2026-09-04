import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Acerca de CinePOV — Nuestra Misión",
  description: "Descubre por qué nació CinePOV y cómo desafiamos la tiranía de la nota media tradicional para ofrecerte el cine desde tu verdadero punto de vista.",
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Encabezado */}
      <div className="space-y-4 mb-12 text-center sm:text-left">
        <span className="text-xs uppercase tracking-widest text-primary font-bold">
          Manifiesto y Misión
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          El cine desde tu punto de vista
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
          Las plataformas tradicionales reducen obras complejas a una sola cifra plana.
          En CinePOV creemos que la nota media no representa a nadie: descubre lo que opinan las personas de tu misma generación.
        </p>
      </div>

      <div className="space-y-10 text-sm sm:text-base leading-relaxed">
        {/* Sección 1: El problema */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            La falacia de la nota media única
          </h2>
          <p className="text-muted-foreground">
            Cuando una película en IMDb, FilmAffinity o Rotten Tomatoes marca un 6.5, ¿qué significa realmente esa puntuación?
          </p>
          <p className="text-muted-foreground">
            En la mayoría de los casos, oculta una realidad fascinante: tal vez para las personas de 18 a 24 años es una obra de culto valorada con un 8.8, mientras que para los mayores de 50 años resulta incomprensible y recibe un 4.2.
          </p>
          <p className="text-white font-medium">
            Al promediar todas las edades y géneros en un solo número sin matices, la nota resultante decepciona a todos y ayuda a muy pocos a decidir qué ver esta noche.
          </p>
        </section>

        {/* Sección 2: La solución */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Nuestros tres pilares fundacionales
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/5 p-5 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-base">Segmentación Real</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Desglosamos las valoraciones por grupos de edad (18-24, 25-34, 35-44, 45-54, 55+) y por género para que encuentres tu verdadero colectivo afín.
              </p>
            </div>

            <div className="bg-white/5 p-5 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-base">Privacidad Rigurosa</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tu año de nacimiento y tu género jamás se muestran en tu perfil público. La información demográfica se procesa de forma estrictamente agregada y anónima.
              </p>
            </div>

            <div className="bg-white/5 p-5 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-bold text-white text-base">Transparencia Algorítmica</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Explicamos abiertamente de dónde procede cada dato, diferenciando con honestidad las valoraciones reales verificadas de las estimaciones estadísticas de arranque.
              </p>
            </div>
          </div>
        </section>

        {/* Sección 3: Herramientas distintivas */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl border border-white/10 space-y-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Herramientas pensadas para cinéfilos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <h4 className="font-semibold text-white mb-1">Batallas Demográficas</h4>
              <p className="text-xs text-muted-foreground">
                Infografías de contraste inmediato entre generaciones listas para compartir y debatir.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <h4 className="font-semibold text-white mb-1">Modo Pareja</h4>
              <p className="text-xs text-muted-foreground">
                Encuentra consenso entre perfiles demográficos distintos para evitar discusiones en el salón.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <h4 className="font-semibold text-white mb-1">Películas Polarizantes</h4>
              <p className="text-xs text-muted-foreground">
                Descubre los títulos que dividen al público y desatan debates generacionales apasionados.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <h4 className="font-semibold text-white mb-1">Tu Año en Cine</h4>
              <p className="text-xs text-muted-foreground">
                Resumen anual interactivo que compara tu criterio personal frente a tu propio colectivo.
              </p>
            </div>
          </div>
        </section>

        {/* Sección 4: Llamada a la acción */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/20 via-violet-900/10 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white">
              ¿Listo para descubrir tu verdadero perfil cinéfilo?
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Únete a la comunidad de CinePOV y empieza a valorar tus primeras películas.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-semibold interactive-transition"
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/rankings"
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold interactive-transition"
            >
              Ver rankings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
