import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { GRANULARITY_THRESHOLDS, SEGMENT_MIN_VOTES } from "@/lib/demographics";

export const metadata: Metadata = {
  title: "Metodología · CinePOV",
  description:
    "Cómo calcula CinePOV las valoraciones por segmento demográfico, qué son las estimaciones de arranque y cómo distinguimos los datos reales de las proyecciones estadísticas.",
};

export const dynamic = "force-dynamic";

export default async function MetodologiaPage() {
  const [realCount, estimatedCount, userCount, movieCount] = await Promise.all([
    db.rating.count({ where: { isArtificial: false } }),
    db.rating.count({ where: { isArtificial: true } }),
    db.user.count({ where: { email: { not: { startsWith: "bot." } } } }),
    db.movie.count(),
  ]);

  const total = realCount + estimatedCount;
  const realPct = total > 0 ? Math.round((realCount / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      {/* Cabecera */}
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
          Transparencia
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-gradient">
          Cómo funcionan nuestros datos
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          CinePOV existe para decirte cómo valoran una película las personas de tu edad y tu género. Una promesa
          así solo vale algo si puedes comprobar de dónde salen los números. Esta página explica exactamente eso,
          incluida la parte incómoda.
        </p>
      </header>

      {/* Estado actual del dataset, en vivo */}
      <section className="glass-panel rounded-3xl border border-white/5 p-6 sm:p-8 space-y-5">
        <h2 className="text-lg font-bold text-white">Estado actual de la base de datos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Valoraciones reales" value={realCount.toLocaleString("es-ES")} accent="text-emerald-400" />
          <Stat label="Estimaciones de arranque" value={estimatedCount.toLocaleString("es-ES")} accent="text-amber-400" />
          <Stat label="Usuarios registrados" value={userCount.toLocaleString("es-ES")} accent="text-white" />
          <Stat label="Películas en catálogo" value={movieCount.toLocaleString("es-ES")} accent="text-white" />
        </div>
        <div className="space-y-2">
          <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden flex">
            <div className="h-full bg-emerald-500/70" style={{ width: `${realPct}%` }} />
            <div
              className="h-full bg-amber-500/30 border-l border-dashed border-amber-500/50"
              style={{ width: `${100 - realPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            El <span className="text-emerald-400 font-bold">{realPct}%</span> de las valoraciones de la
            plataforma son de personas reales. Esta cifra se calcula en vivo cada vez que cargas esta página, y
            nuestro objetivo declarado es que llegue al 100%.
          </p>
        </div>
      </section>

      {/* Cómo se calcula */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">1. Cómo calculamos la nota de un segmento</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Cuando te registras te pedimos dos datos: tu año de nacimiento (no la fecha completa) y tu género.
            Cada valoración que haces queda asociada a tu cuenta, y al calcular la nota de un segmento hacemos
            simplemente la media aritmética de las valoraciones de las personas que pertenecen a él.
          </p>
          <p>
            No hay ponderaciones ocultas, ni algoritmos de recomendación, ni ajustes editoriales. La nota de
            &ldquo;mujeres de 25 a 34&rdquo; es la media de las notas que han puesto las usuarias de entre 25 y 34
            años. Nada más.
          </p>
          <p>
            Los tramos de edad se calculan de forma dinámica a partir del año de nacimiento, así que un usuario
            cambia de tramo automáticamente al cumplir años. Nunca almacenamos la edad como un dato fijo.
          </p>
        </div>
      </section>

      {/* Umbrales */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. Por qué a veces no te mostramos un dato</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            La media de tres personas no es información: es anécdota. Por eso un segmento solo muestra su nota
            cuando alcanza un mínimo de <span className="text-white font-bold">{SEGMENT_MIN_VOTES} valoraciones
            reales</span>. Por debajo de ese umbral verás cuántas faltan, no un número inventado.
          </p>
          <p>
            Ese umbral cumple una segunda función: la privacidad. Si mostráramos la nota de un segmento con una
            sola persona dentro, estaríamos revelando la valoración individual de un usuario identificable por
            descarte.
          </p>
          <p>
            Además, el desglose completo no aparece de golpe: se desbloquea por niveles según la película acumula
            datos reales. Estos son los umbrales exactos:
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Nivel de detalle
                </th>
                <th className="text-right py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Valoraciones reales necesarias
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/5">
                <td className="py-3 px-3">Nota global de la película</td>
                <td className="py-3 px-3 text-right text-white font-bold tabular-nums">1</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3">Por generación (18-34, 35-54, 55+)</td>
                <td className="py-3 px-3 text-right text-white font-bold tabular-nums">
                  {GRANULARITY_THRESHOLDS.age_broad.minTotal}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3">Por género</td>
                <td className="py-3 px-3 text-right text-white font-bold tabular-nums">
                  {GRANULARITY_THRESHOLDS.gender.minTotal}
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3">Por edad detallada (cinco tramos)</td>
                <td className="py-3 px-3 text-right text-white font-bold tabular-nums">
                  {GRANULARITY_THRESHOLDS.age_full.minTotal}
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3">Matriz completa género × edad</td>
                <td className="py-3 px-3 text-right text-white font-bold tabular-nums">
                  {GRANULARITY_THRESHOLDS.cross.minTotal}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Cada nivel exige además que al menos dos de sus segmentos superen el mínimo individual. Un desglose en
          el que todos los votos están en un mismo grupo no compara nada.
        </p>
      </section>

      {/* La parte incómoda */}
      <section className="space-y-4">
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 sm:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            3. Las estimaciones de arranque
          </h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p className="text-white font-semibold">
              Esta es la parte que preferimos contarte nosotros antes de que la descubras tú.
            </p>
            <p>
              Una plataforma de valoraciones colaborativas tiene un problema de origen conocido como
              &ldquo;arranque en frío&rdquo;: no es útil hasta que mucha gente ha votado, y cuesta atraer gente
              cuando todavía no es útil. Para que las fichas no estuvieran completamente vacías el primer día,
              generamos un conjunto de valoraciones simuladas mediante un modelo estadístico.
            </p>
            <p>
              Son proyecciones calculadas a partir de la nota global de la película y de patrones demográficos
              generales. <span className="text-white font-bold">No son opiniones de personas.</span> Nadie las ha
              escrito, nadie ha visto esas películas, y no representan a ningún usuario real.
            </p>
            <p className="text-white font-semibold pt-1">Estas son las reglas que nos autoimponemos:</p>
            <ul className="space-y-2.5 pl-1">
              {[
                "Nunca se suman a las valoraciones reales en un mismo número. La nota de CinePOV que ves en una ficha se calcula exclusivamente con votos de personas.",
                "Siempre están etiquetadas y visualmente diferenciadas, con borde discontinuo y color propio. Están ocultas por defecto y tienes que pedir verlas.",
                "Nunca desbloquean un nivel de detalle. Los umbrales de la tabla anterior cuentan solo valoraciones reales.",
                "Nunca aparecen en rankings, en contenido compartible ni en informes. Solo se viraliza y se publica lo que es real.",
                "Desaparecen a medida que llegan datos reales: cada valoración de una persona elimina una estimación de esa película.",
                "Publicamos el porcentaje exacto que representan, arriba en esta misma página, actualizado en vivo.",
              ].map((rule, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="text-amber-400 font-black flex-shrink-0">{i + 1}.</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h3 className="text-base font-bold text-white">Por qué no usamos inteligencia artificial para esto</h3>
          <p>
            Nos lo hemos planteado y lo hemos descartado por una razón de fondo: un modelo de lenguaje no sabe qué
            opina una mujer de 22 años sobre una película, sabe qué se dice en internet sobre lo que opinan las
            mujeres de 22 años. Es decir, devuelve el estereotipo.
          </p>
          <p>
            CinePOV existe precisamente para comprobar con datos si esos estereotipos son ciertos. Rellenar los
            huecos con la salida de un modelo convertiría la plataforma en un espejo de prejuicios disfrazado de
            estadística. Preferimos una celda vacía que dice la verdad.
          </p>
        </div>
      </section>

      {/* Privacidad */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. Qué hacemos con tus datos personales</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Pedimos el mínimo imprescindible: año de nacimiento y género. No pedimos tu nombre real, ni tu
            ubicación, ni tu profesión, ni nada que no haga funcionar el producto.
          </p>
          <p>
            Tu edad y tu género <span className="text-white font-bold">nunca son públicos</span>. No aparecen en
            tu perfil, no se muestran junto a tus valoraciones, y nadie puede consultarlos. Solo existen dentro de
            medias agregadas de decenas de personas.
          </p>
          <p>
            Puedes cambiarlos, exportar todas tus valoraciones o eliminar tu cuenta en cualquier momento desde tu
            perfil. Los detalles completos están en la{" "}
            <Link href="/privacidad" className="text-primary-light font-semibold hover:underline">
              política de privacidad
            </Link>
            .
          </p>
        </div>
      </section>

      {/* Sesgos */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">5. Nuestra postura sobre los sesgos</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Mostrar que dos grupos valoran una película de forma distinta es un dato descriptivo. No es un juicio
            sobre ninguno de los dos, y no existe una nota correcta.
          </p>
          <p>
            Por eso nunca ordenamos los segmentos en un ranking de acierto, siempre mostramos la nota global junto
            a las segmentadas, e incluimos opciones de género no binarias y la posibilidad de no declararlo. Un
            usuario que prefiere no decir su género cuenta en la nota global aunque no aparezca en ningún segmento.
          </p>
          <p>
            También somos conscientes de que nuestra base de usuarios no está repartida de forma equilibrada, y
            que eso afecta a la calidad de los datos. Es un problema que vigilamos activamente y que solo se
            resuelve con más gente de los segmentos menos representados.
          </p>
        </div>
      </section>

      {/* Fuentes */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">6. Fuentes y atribución</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            La información de las películas (títulos, sinopsis, carteles, reparto, dirección y duración) proviene
            de{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-light font-semibold hover:underline"
            >
              The Movie Database (TMDB)
            </a>
            . Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
          </p>
          <p>
            La nota de TMDB que mostramos junto a la nuestra es una referencia externa y se identifica siempre
            como tal. Nunca se mezcla con las valoraciones de CinePOV.
          </p>
        </div>
      </section>

      {/* Contacto */}
      <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-bold text-white">¿Has encontrado algo que no cuadra?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Nos interesa mucho saberlo. Si detectas un dato que parece incorrecto, un cálculo que no encaja o
          cualquier cosa que contradiga lo que dice esta página, escríbenos desde el formulario de sugerencias del
          pie de página. Corregirlo y explicarlo públicamente nos importa más que quedar bien.
        </p>
        <p className="text-xs text-muted-foreground">
          Última revisión de esta página: julio de 2026.
        </p>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="space-y-1">
      <p className={`text-2xl font-black tabular-nums ${accent}`}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}
