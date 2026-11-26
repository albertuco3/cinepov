import { Metadata } from "next";
import Link from "@/components/LocaleLink";

export const metadata: Metadata = {
  title: "Política de Moderación y Normas de la Comunidad — CinePOV",
  description: "Conoce los principios de convivencia, las normas de publicación de opiniones y cómo protegemos la autenticidad del debate cinematográfico.",
};

export default function ModeracionPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="space-y-4 mb-10">
        <span className="text-xs uppercase tracking-widest text-primary font-bold">
          Comunidad y Convivencia
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
          Normas de la Comunidad y Política de Moderación
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
          CinePOV nace para celebrar la diversidad de miradas y puntos de vista sobre el cine.
          Para que el contraste generacional y demográfico sea enriquecedor, fomentamos un entorno de respeto mutuo, honestidad y análisis constructivo.
        </p>
      </div>

      <div className="space-y-10 text-sm sm:text-base text-white/90 leading-relaxed">
        {/* Sección 1 */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl space-y-4 border border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">
            1. Respeto Mutuo y Tolerancia Cero al Odio
          </h2>
          <p className="text-muted-foreground">
            El desacuerdo cinematográfico es bienvenido, pero el ataque personal es inaceptable.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-white">Prohibición de insultos y vejaciones:</strong> No se toleran descalificaciones dirigidas hacia otros usuarios, creadores, actores o directores.
            </li>
            <li>
              <strong className="text-white">Lenguaje de odio:</strong> Queda terminantemente prohibido cualquier comentario que discrimine, degrade o incite a la violencia por motivos de raza, etnia, género, identidad sexual, religión, edad, discapacidad o nacionalidad.
            </li>
            <li>
              <strong className="text-white">Acoso y hostigamiento:</strong> No se permiten conductas reiteradas destinadas a intimidar o incomodar a cualquier miembro de la comunidad.
            </li>
          </ul>
        </section>

        {/* Sección 2 */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl space-y-4 border border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">
            2. Tratamiento de Revelaciones de Trama (Spoilers)
          </h2>
          <p className="text-muted-foreground">
            Queremos que cada usuario viva la experiencia cinematográfica al máximo.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              Si tu reseña revela giros narrativos esenciales, finales o sorpresas de la trama, debes advertirlo claramente al inicio de tu texto con la indicación <strong className="text-white">[AVISO DE SPOILERS]</strong>.
            </li>
            <li>
              Las opiniones que incluyan revelaciones graves sin previo aviso podrán ser ocultadas preventivamente tras reporte de la comunidad.
            </li>
          </ul>
        </section>

        {/* Sección 3 */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl space-y-4 border border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">
            3. Autenticidad, Voto Limpio y Anti-Abuso
          </h2>
          <p className="text-muted-foreground">
            La veracidad estadística es el corazón de CinePOV. Cualquier intento de manipular los agregados demográficos distorsiona el servicio para todos.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
            <li>
              <strong className="text-white">Boicot y review bombing:</strong> Prohibimos las campañas orquestadas para inflar o hundir de forma artificial la calificación de una obra. Disponemos de algoritmos de detección de ráfagas anómalas.
            </li>
            <li>
              <strong className="text-white">Cuentas múltiples y bots:</strong> El uso de cuentas duplicadas para multiplicar votos o el empleo de scripts automáticos conlleva la suspensión permanente de todas las cuentas asociadas.
            </li>
            <li>
              <strong className="text-white">Publicidad y spam:</strong> No se permite la publicación de enlaces comerciales, promociones de esquemas financieros, criptomonedas o canales de mensajería externos.
            </li>
          </ul>
        </section>

        {/* Sección 4 */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl space-y-4 border border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">
            4. Sistema de Reportes Comunitarios y Moderación
          </h2>
          <p className="text-muted-foreground">
            La moderación en CinePOV es colaborativa y cuenta con salvaguardas técnicas:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-semibold text-white">Filtro Preventivo</h3>
              <p className="text-xs text-muted-foreground">
                Las reseñas pasan por un análisis automático de lenguaje de odio antes de su persistencia. Si se detectan términos censurables, se solicita su corrección inmediata.
              </p>
            </div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2">
              <h3 className="font-semibold text-white">Ocultamiento por Reportes</h3>
              <p className="text-xs text-muted-foreground">
                Si una opinión acumula 3 o más reportes de usuarios distintos, queda oculta automáticamente del feed público a la espera de resolución administrativa.
              </p>
            </div>
          </div>
        </section>

        {/* Sección 5 */}
        <section className="glass-panel p-6 sm:p-8 rounded-2xl space-y-4 border border-white/10">
          <h2 className="text-xl font-bold text-white tracking-tight">
            5. Apelaciones y Revisión
          </h2>
          <p className="text-muted-foreground">
            Si consideras que una reseña tuya ha sido ocultada por error o que una decisión de moderación no se ajusta a estas normas, puedes contactar con nuestro equipo a través de la sección de sugerencias o enviando un correo a soporte.
          </p>
          <div className="pt-2 flex flex-wrap gap-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-white font-medium text-xs sm:text-sm hover:bg-primary-hover interactive-transition"
            >
              Volver al inicio
            </Link>
            <Link
              href="/metodologia"
              className="inline-flex items-center px-4 py-2 rounded-xl bg-white/10 text-white font-medium text-xs sm:text-sm hover:bg-white/20 interactive-transition"
            >
              Consultar metodología
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
