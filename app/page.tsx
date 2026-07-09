import Link from "next/link";
import LandingDemo from "@/components/LandingDemo";
import SearchBar from "@/components/SearchBar";

export const metadata = {
  title: "CinePOV — La Película no tiene un 7.2. Tiene un 8.6 para ti.",
  description: "Rompe la tiranía de la nota media. CinePOV filtra las puntuaciones de las películas por género y edad para descubrir qué gusta de verdad a personas como tú.",
};

export default function Home() {
  return (
    <div className="flex-1 flex flex-col justify-start w-full">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-16 pb-20 sm:pt-20 sm:pb-28">
        {/* Iluminación de fondo sutil (Background Glow) */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
              La película no tiene un <span className="text-muted-foreground/60">7.2</span>.
              <br />
              Tiene un <span className="accent-gradient">8.6 para ti</span>.
            </h1>
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground leading-relaxed">
              Rompiendo la tiranía de la nota media. CinePOV es el primer recomendador que desglosa las valoraciones por <strong>género y edad</strong>. Encuentra el cine que realmente conecta contigo.
            </p>
          </div>

          {/* Buscador de películas integrado en la Landing */}
          <div className="max-w-lg mx-auto bg-[#0f111a] p-2.5 rounded-3xl border border-white/10 shadow-xl">
            <SearchBar />
          </div>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
            <Link
              href="/register"
              className="px-6 py-3.5 rounded-full text-xs font-black tracking-wide uppercase bg-primary hover:bg-primary-hover text-white transition-all shadow-lg shadow-primary/15 cursor-pointer"
            >
              Registrarse gratis
            </Link>
            <Link
              href="/explore"
              className="px-6 py-3.5 rounded-full text-xs font-black tracking-wide uppercase bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white transition-all cursor-pointer"
            >
              Explorar Catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* 2. SIMULADOR INTERACTIVO (DEMO) */}
      <section className="py-12 bg-white/[0.01] border-y border-white/5">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">Mira el Concepto en Acción</h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Las películas no gustan a todos por igual. Interactúa con nuestro simulador y observa cómo cambia el punto de vista demográfico.
            </p>
          </div>
          <LandingDemo />
        </div>
      </section>

      {/* 3. CÓMO FUNCIONA EN 3 PASOS */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-white">¿Cómo funciona CinePOV?</h2>
            <p className="text-sm text-muted-foreground">Tres pasos para romper la tiranía de la nota media general.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tarjeta Paso 1 */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4 hover:border-white/10 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-white">Completa tu perfil</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Regístrate y define tu género y año de nacimiento. Tu identidad es privada: solo se utilizará de forma agregada para agrupar las notas de la comunidad.
              </p>
            </div>

            {/* Tarjeta Paso 2 */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4 hover:border-white/10 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-white">Puntúa tus películas</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Busca cualquier película en el catálogo global de TMDB y califícala del 1 al 10. Tu voto se clasificará de forma instantánea en tu correspondiente segmento demográfico.
              </p>
            </div>

            {/* Tarjeta Paso 3 */}
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/5 space-y-4 hover:border-white/10 transition-all duration-300">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-white">Filtra y descubre</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Accede a los desgloses interactivos, gráficos de barras y matrices de calor por edad y género. Encuentra recomendaciones avaladas por personas afines a ti.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. POOL DE BOTS Y AUDIENCIA */}
      <section className="pb-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01] p-8 sm:p-12 text-center space-y-6">
            {/* Background Glow */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-2xl mx-auto space-y-4">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Masa Crítica Activa desde el Primer Minuto
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                CinePOV cuenta con una red de **5000 perfiles demográficos simulados** que han calificado de forma coherente las tendencias y blockbusters del catálogo. No te preocupes por el arranque en frío: cualquier película que busques tendrá análisis demográficos listos e interactivos.
              </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-8 pt-4">
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white">5,000+</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Usuarios Activos
                </div>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white">100%</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Desglose Demográfico
                </div>
              </div>
              <div className="h-8 w-px bg-white/10 hidden sm:block" />
              <div className="space-y-1">
                <div className="text-2xl sm:text-3xl font-black text-white">TMDB</div>
                <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                  Catálogo Global
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA DE REGISTRO FINAL */}
      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary to-indigo-600 p-8 sm:p-12 text-center space-y-6 shadow-xl shadow-primary/10">
            <div className="max-w-md mx-auto space-y-3">
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                ¿Listo para ver tu punto de vista?
              </h2>
              <p className="text-xs sm:text-sm text-white/80 leading-relaxed">
                Regístrate ahora, califica tus películas favoritas y empieza a descubrir cómo valoran el cine las personas como tú.
              </p>
            </div>

            <div className="pt-2">
              <Link
                href="/register"
                className="inline-block px-8 py-4 rounded-full text-xs font-black tracking-wide uppercase bg-[#0f111a] hover:bg-black text-white transition-all shadow-xl cursor-pointer"
              >
                Crear mi cuenta gratis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
