import type { Metadata } from "next";
import Link from "@/components/LocaleLink";

export const metadata: Metadata = {
  title: "Términos de uso · CinePOV",
  description:
    "Condiciones de uso de CinePOV: requisitos de la cuenta, reglas sobre la veracidad de los datos demográficos, propiedad de tus valoraciones, limitación de responsabilidad y legislación aplicable.",
};

export default function TerminosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
          Legal
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-gradient">Términos de uso</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Estas condiciones regulan el uso de CinePOV. La parte importante cabe en una frase: la plataforma solo
          funciona si los datos son ciertos, así que casi todo lo que sigue trata de proteger la veracidad de los
          números que publicamos.
        </p>
        <p className="text-xs text-muted-foreground">Última actualización: julio de 2026.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">1. Quiénes somos y qué aceptas al usar CinePOV</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            CinePOV es un servicio operado por <Pendiente>[PENDIENTE: razón social]</Pendiente>, con NIF{" "}
            <Pendiente>[PENDIENTE: NIF]</Pendiente> y domicilio en <Pendiente>[PENDIENTE: dirección]</Pendiente>,
            accesible en <Pendiente>[PENDIENTE: dominio]</Pendiente>. Los datos completos de identificación figuran
            en el{" "}
            <Link href="/aviso-legal" className="text-primary-light font-semibold hover:underline">
              aviso legal
            </Link>
            .
          </p>
          <p>
            Al registrarte o utilizar la plataforma aceptas estas condiciones en su totalidad. Si no estás de acuerdo
            con alguna de ellas, no uses el servicio. El tratamiento de tus datos personales se rige por la{" "}
            <Link href="/privacidad" className="text-primary-light font-semibold hover:underline">
              política de privacidad
            </Link>
            , que forma parte inseparable de estos términos.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. Objeto del servicio</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            CinePOV es una plataforma de valoración de películas cuya particularidad es mostrar las notas
            segmentadas por perfil demográfico: permite ver cómo valoran una película las personas de una franja de
            edad y un género determinados, en lugar de una única nota media indiferenciada.
          </p>
          <p>
            El servicio consiste en poder registrar tus propias valoraciones, consultar tu historial, explorar el
            catálogo y ver los desgloses agregados cuando existen datos suficientes. El acceso es gratuito, sin que
            eso implique compromiso de gratuidad indefinida: si en el futuro incorporásemos funciones de pago, las
            actuales seguirían disponibles en las condiciones que se anuncien con antelación.
          </p>
          <p>
            Los desgloses son datos estadísticos descriptivos, no recomendaciones ni juicios de valor sobre ninguna
            película o colectivo. La forma en que se calculan y los umbrales mínimos están explicados en la{" "}
            <Link href="/metodologia" className="text-primary-light font-semibold hover:underline">
              página de metodología
            </Link>
            , cuya lectura te recomendamos antes de sacar conclusiones de una cifra.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">3. Requisitos de la cuenta</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>Para registrarte y mantener una cuenta activa debes cumplir estas condiciones:</p>
          <ul className="space-y-2.5 pl-1">
            {[
              "Ser mayor de 18 años. La plataforma no está dirigida a menores y no permitimos su registro.",
              "Tener una única cuenta. Una persona, un perfil: es la condición mínima para que una media represente a un conjunto de personas y no a alguien votando varias veces.",
              "Verificar tu dirección de correo electrónico. Hasta que lo hagas, tus valoraciones no entran en los agregados públicos.",
              "Facilitar datos demográficos veraces, es decir, tu año de nacimiento y tu género reales.",
              "Mantener la confidencialidad de tus credenciales y avisarnos si sospechas que alguien ha accedido a tu cuenta.",
            ].map((requirement, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-primary-light font-black flex-shrink-0">{i + 1}.</span>
                <span>{requirement}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel rounded-3xl border border-white/5 p-6 sm:p-8 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <h3 className="text-base font-bold text-white">Por qué la veracidad demográfica no es un detalle</h3>
          <p>
            En una plataforma de valoraciones convencional, mentir sobre tu edad no afecta a nadie. Aquí sí: tu año
            de nacimiento y tu género determinan en qué segmento se cuenta tu voto, y por tanto alteran directamente
            la cifra que otra persona lee como respuesta a la pregunta &ldquo;cómo valora esta película la gente
            como yo&rdquo;.
          </p>
          <p>
            Falsear esos datos no es una travesura sobre tu privacidad: es introducir un error en un dato público
            que otros usan para decidir qué ver. Si no quieres declarar tu género, existe la opción de no decirlo, y
            tu voto seguirá contando en la nota global. Esa es la salida correcta, no rellenar un valor cualquiera.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. Reglas de uso</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>Queda expresamente prohibido:</p>
          <ul className="space-y-2.5 pl-1">
            {[
              "Crear varias cuentas, por ti o mediante terceros, con independencia del motivo.",
              "Declarar un año de nacimiento o un género que no sean los tuyos, especialmente si el objetivo es influir en el resultado de un segmento concreto.",
              "Coordinar votaciones con otras personas para inflar o hundir la nota de una película, práctica conocida como review bombing, así como cualquier otra maniobra dirigida a manipular los agregados.",
              "Usar programas, guiones o cualquier medio automatizado para registrar valoraciones, crear cuentas o extraer datos de la plataforma de forma masiva.",
              "Intentar acceder a cuentas ajenas, a la infraestructura o a datos que no te correspondan, así como sortear los límites técnicos o las medidas de seguridad del servicio.",
              "Introducir en los campos libres, incluido el nombre público o el formulario de sugerencias, contenido ilícito, injurioso, discriminatorio, publicitario o que vulnere derechos de terceros.",
              "Suplantar la identidad de otra persona o hacer creer que representas a CinePOV.",
            ].map((rule, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-primary-light font-black flex-shrink-0">·</span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <p>
            Para detectar estas conductas aplicamos controles automáticos, como la verificación obligatoria del
            correo, límites de frecuencia de peticiones y análisis de patrones de votación anómalos. Cuando un
            patrón resulta claramente artificial podemos excluir las valoraciones afectadas de los agregados
            públicos, además de adoptar las medidas del apartado 8.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">5. Tu contenido: propiedad y licencia</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Las valoraciones que registras y el resto del contenido que aportas siguen siendo tuyos. No adquirimos
            su propiedad ni reclamamos derechos exclusivos sobre ellos.
          </p>
          <p>
            Al publicar contenido en la plataforma nos concedes una licencia gratuita, no exclusiva y de ámbito
            mundial para almacenarlo, reproducirlo y comunicarlo públicamente con la única finalidad de operar el
            servicio: mostrarlo en tu perfil e incorporarlo a las medias agregadas, los desgloses por segmento y los
            rankings. Esa licencia está limitada a dicha finalidad y no nos autoriza a cederlo a terceros para usos
            propios ni a explotarlo con fines publicitarios.
          </p>
          <p>
            La licencia se extingue cuando eliminas el contenido, con una salvedad que conviene conocer antes de
            registrarse: las valoraciones que ya se hubieran integrado en datos estadísticos agregados permanecen en
            ellos de forma anónima, sin vínculo con tu identidad, en los términos explicados en la{" "}
            <Link href="/privacidad" className="text-primary-light font-semibold hover:underline">
              política de privacidad
            </Link>
            .
          </p>
          <p>
            Los datos estadísticos agregados que generamos a partir del conjunto de valoraciones, así como su
            selección, ordenación y presentación, corresponden a CinePOV como base de datos elaborada.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">6. Propiedad intelectual</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            El nombre CinePOV, su identidad visual, el diseño de la plataforma, el código y los textos son
            titularidad del operador del servicio o de sus licenciantes, y quedan protegidos por la normativa de
            propiedad intelectual e industrial. No se concede ninguna licencia sobre ellos por el hecho de usar el
            sitio.
          </p>
          <p>
            La información de las películas (títulos, sinopsis, carteles, imágenes, reparto, dirección y duración)
            procede de{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-light font-semibold hover:underline"
            >
              The Movie Database (TMDB)
            </a>{" "}
            y pertenece a TMDB o a los titulares de derechos correspondientes. Se utiliza conforme a las condiciones
            de uso de su API.{" "}
            <span className="text-white font-semibold">
              Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
            </span>
          </p>
          <p>
            Los carteles y las imágenes promocionales pertenecen a sus respectivos estudios y distribuidoras, y se
            muestran con finalidad identificativa e informativa. Si eres titular de derechos y consideras que algún
            contenido debe retirarse, escríbenos a <Pendiente>[PENDIENTE: email de contacto]</Pendiente> y lo
            atenderemos con diligencia.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">7. Naturaleza de los datos publicados</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Las notas por segmento son medias de opiniones subjetivas de otros usuarios. No constituyen un juicio
            crítico, ni un asesoramiento, ni una verdad sobre la calidad de una película, y no deben interpretarse
            como una afirmación sobre lo que piensa un colectivo en su conjunto.
          </p>
          <p>
            Todas las notas se calculan exclusivamente con valoraciones de personas reales con el email
            verificado. La plataforma no genera valoraciones simuladas ni estimaciones. La explicación completa
            está en la{" "}
            <Link href="/metodologia" className="text-primary-light font-semibold hover:underline">
              metodología
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">8. Suspensión y cancelación de cuentas</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Podemos suspender temporalmente o cancelar de forma definitiva una cuenta, y excluir sus valoraciones de
            los agregados, cuando concurra alguna de estas circunstancias:
          </p>
          <ul className="space-y-2.5 pl-1">
            {[
              "Incumplimiento de las reglas de uso del apartado 4, en particular la existencia de cuentas múltiples o de datos demográficos falseados.",
              "Indicios razonables de manipulación coordinada de las valoraciones.",
              "Uso automatizado o extracción masiva de datos.",
              "Incumplimiento del requisito de edad mínima.",
              "Conductas que comprometan la seguridad del servicio o los derechos de otros usuarios.",
            ].map((cause, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-primary-light font-black flex-shrink-0">·</span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
          <p>
            Salvo que la gravedad o la normativa aplicable lo impidan, te informaremos del motivo y podrás
            responder. Las medidas serán proporcionadas: siempre que sea suficiente, corregiremos el dato o
            excluiremos las valoraciones afectadas antes de cancelar una cuenta.
          </p>
          <p>
            Tú puedes dejar de usar el servicio cuando quieras y eliminar tu cuenta desde tu perfil, sin necesidad
            de justificarlo y sin coste alguno.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">9. Limitación de responsabilidad</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            El servicio se presta &ldquo;tal cual&rdquo;. Ponemos un cuidado razonable en que los datos sean exactos
            y la plataforma esté disponible, pero no garantizamos que funcione sin interrupciones ni errores, ni que
            la información de las películas procedente de TMDB esté completa o actualizada.
          </p>
          <p>
            No respondemos de las decisiones que tomes basándote en las valoraciones publicadas, de los contenidos
            aportados por otros usuarios, ni de los daños derivados de un uso del servicio contrario a estas
            condiciones. Tampoco respondemos de las interrupciones o fallos imputables a terceros proveedores, a la
            red o a causas de fuerza mayor.
          </p>
          <p>
            Nada de lo anterior limita nuestra responsabilidad en los casos en que la ley no lo permite, incluidos
            el dolo, la culpa grave, los daños a la vida o la integridad de las personas y los derechos que
            correspondan a los consumidores conforme a la normativa imperativa.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">10. Modificaciones del servicio y de estas condiciones</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            CinePOV es un producto en evolución. Podemos añadir, modificar o retirar funcionalidades, ajustar los
            umbrales de desglose o cambiar la forma de presentar los datos cuando ello mejore el servicio o resulte
            necesario por motivos técnicos, legales o de seguridad. Los cambios relevantes se anunciarán en la
            plataforma.
          </p>
          <p>
            También podemos modificar estas condiciones. Actualizaremos la fecha del encabezado y, cuando la
            modificación afecte sustancialmente a tus derechos u obligaciones, te lo comunicaremos por correo o
            mediante un aviso destacado con antelación razonable. Si no aceptas la nueva versión, puedes eliminar tu
            cuenta antes de que entre en vigor; continuar usando el servicio después de esa fecha implica su
            aceptación.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">11. Ley aplicable y jurisdicción</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Estas condiciones se rigen por la legislación española, en particular por la Ley 34/2002 de servicios de
            la sociedad de la información y de comercio electrónico, el texto refundido de la Ley General para la
            Defensa de los Consumidores y Usuarios y el Reglamento (UE) 2016/679 de protección de datos.
          </p>
          <p>
            Para cualquier controversia serán competentes los juzgados y tribunales españoles. Si actúas como
            consumidor, la competencia corresponderá a los tribunales de tu domicilio conforme a la normativa
            aplicable, sin que estas condiciones puedan privarte de ese derecho.
          </p>
          <p>
            Si alguna cláusula fuese declarada nula o inaplicable, el resto mantendrá su plena vigencia. Antes de
            acudir a la vía judicial te agradeceremos que nos escribas a{" "}
            <Pendiente>[PENDIENTE: email de contacto]</Pendiente>: la mayoría de los problemas se resuelven así.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-bold text-white">Documentos relacionados</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <Link href="/privacidad" className="text-primary-light font-semibold hover:underline">
            Política de privacidad
          </Link>
          ,{" "}
          <Link href="/aviso-legal" className="text-primary-light font-semibold hover:underline">
            aviso legal
          </Link>{" "}
          y{" "}
          <Link href="/metodologia" className="text-primary-light font-semibold hover:underline">
            metodología de los datos
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function Pendiente({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
      {children}
    </span>
  );
}
