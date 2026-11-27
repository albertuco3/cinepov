import type { Metadata } from "next";
import Link from "@/components/LocaleLink";

export const metadata: Metadata = {
  title: "Política de privacidad · CinePOV",
  description:
    "Qué datos personales recoge CinePOV, con qué finalidad, durante cuánto tiempo, quién los trata y cómo puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad, oposición y limitación.",
};

export default function PrivacidadPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
          Legal
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-gradient">
          Política de privacidad
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          CinePOV funciona con dos datos sensibles a la vez que imprescindibles: tu edad y tu género. Sin ellos no
          existe el producto. Por eso esta página no es un trámite: explica exactamente qué guardamos, para qué,
          cuánto tiempo y qué puedes hacer para recuperarlo o borrarlo.
        </p>
        <p className="text-xs text-muted-foreground">Última actualización: julio de 2026.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">1. Quién es el responsable de tus datos</h2>
        <div className="glass-panel rounded-3xl border border-white/5 p-6 sm:p-8">
          <dl className="space-y-3 text-sm">
            <IdentityRow label="Responsable">
              <Pendiente>[PENDIENTE: razón social]</Pendiente>
            </IdentityRow>
            <IdentityRow label="NIF">
              <Pendiente>[PENDIENTE: NIF]</Pendiente>
            </IdentityRow>
            <IdentityRow label="Domicilio">
              <Pendiente>[PENDIENTE: dirección]</Pendiente>
            </IdentityRow>
            <IdentityRow label="Contacto">
              <Pendiente>[PENDIENTE: email de contacto]</Pendiente>
            </IdentityRow>
            <IdentityRow label="Sitio web">
              <Pendiente>[PENDIENTE: dominio]</Pendiente>
            </IdentityRow>
          </dl>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cualquier consulta relativa a esta política o al ejercicio de tus derechos puede dirigirse a la dirección
          de contacto indicada arriba. No hemos designado delegado de protección de datos porque el tratamiento que
          realizamos no alcanza los supuestos del artículo 37 del Reglamento (UE) 2016/679.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. Qué datos recogemos y para qué sirve cada uno</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Solo pedimos lo que hace funcionar el producto. No recogemos tu nombre real, tu dirección postal, tu
          teléfono, tu ubicación, tu profesión ni tu nivel de ingresos, y no compramos ni enriquecemos tu perfil con
          datos de terceros.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Dato
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Para qué lo usamos
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Correo electrónico</td>
                <td className="py-3 px-3">
                  Identificarte al iniciar sesión, verificar que la cuenta pertenece a una persona real, permitirte
                  recuperar la contraseña y enviarte los avisos del servicio a los que te hayas suscrito. Nunca se
                  muestra públicamente.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Contraseña</td>
                <td className="py-3 px-3">
                  Autenticarte. No la almacenamos: guardamos únicamente un resumen criptográfico calculado con
                  bcrypt, del que no es posible recuperar la contraseña original. Si accedes con Google no
                  almacenamos contraseña alguna.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Nombre público</td>
                <td className="py-3 px-3">
                  Identificarte dentro de la plataforma. Lo eliges tú y no tiene que coincidir con tu nombre real;
                  puedes cambiarlo cuando quieras.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Año de nacimiento</td>
                <td className="py-3 px-3">
                  Situarte en un tramo de edad para calcular las medias agregadas y comprobar que eres mayor de 18
                  años. Pedimos el año y no la fecha completa de forma deliberada: es el mínimo que permite calcular
                  el tramo y reduce el riesgo de que el dato sirva para identificarte.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Género</td>
                <td className="py-3 px-3">
                  Situarte en un segmento para calcular las medias agregadas. Las opciones son hombre, mujer, no
                  binario y prefiero no decirlo. Si eliges no decirlo, tus valoraciones cuentan en la nota global y
                  en los tramos de edad, pero no aparecen en ningún segmento por género.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Avatar (opcional)</td>
                <td className="py-3 px-3">
                  Mostrar una imagen en tu perfil. Guardamos la dirección de la imagen que indiques, no la imagen en
                  sí. Es un campo enteramente opcional.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Valoraciones y fecha de visionado</td>
                <td className="py-3 px-3">
                  Construir tu historial personal y calcular las medias por segmento. La nota que pones a una
                  película es el contenido central del servicio.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Sugerencias que nos envías</td>
                <td className="py-3 px-3">
                  Atender y resolver lo que nos cuentas a través del formulario de sugerencias del pie de página.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-white font-semibold">Datos técnicos de conexión</td>
                <td className="py-3 px-3">
                  Mantener el servicio en pie y protegerlo. Nuestro proveedor de alojamiento registra dirección IP y
                  agente de usuario en sus registros técnicos, y usamos contadores de peticiones asociados a un
                  identificador de conexión para frenar ataques automatizados y abusos.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">3. Con qué base legal tratamos tus datos</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            La base legal principal es tu <span className="text-white font-bold">consentimiento explícito</span>,
            que otorgas de forma activa en el momento del registro (artículo 6.1.a del Reglamento General de
            Protección de Datos). Ese consentimiento cubre de manera específica el tratamiento de tu año de
            nacimiento y de tu género con la finalidad de calcular medias agregadas por segmento demográfico.
          </p>
          <p>
            Como el género puede considerarse un dato especialmente protegido según las circunstancias, tratamos ese
            campo apoyándonos en el consentimiento explícito previsto en el artículo 9.2.a del mismo Reglamento, y
            no lo utilizamos para ninguna finalidad distinta de la agregación estadística descrita en esta página.
          </p>
          <p>
            Además de tu consentimiento, la ejecución del contrato de servicio sostiene el mantenimiento de tu
            cuenta y el envío de comunicaciones estrictamente transaccionales (verificación del correo,
            restablecimiento de contraseña, avisos relevantes sobre el servicio). Nuestro interés legítimo en
            proteger la plataforma sostiene las medidas de seguridad y prevención de abuso.
          </p>
          <p>
            Puedes retirar tu consentimiento en cualquier momento, sin que ello afecte a la licitud del tratamiento
            realizado hasta ese momento. Retirarlo implica dejar de participar en los agregados demográficos, lo que
            en la práctica se materializa eliminando tu cuenta según se explica en el apartado 8.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. Cómo protegemos tu identidad dentro de los datos</h2>
        <div className="glass-panel rounded-3xl border border-white/5 p-6 sm:p-8 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p className="text-white font-semibold">
            Tu edad y tu género nunca se muestran públicamente ni se asocian a tu perfil visible.
          </p>
          <p>
            No aparecen en tu página de perfil, no se muestran junto a tus valoraciones y ningún usuario puede
            consultarlos. Solo existen dentro de medias calculadas con las valoraciones de varias personas.
          </p>
          <p>
            Para que esa agregación no permita deducir la nota concreta de una persona, un segmento solo publica su
            media cuando reúne un mínimo de tres valoraciones reales. Por debajo de ese umbral la celda queda vacía,
            de modo que no es posible identificar a nadie por descarte a partir de un segmento con un único
            integrante.
          </p>
          <p>
            El detalle completo del cálculo y los umbrales de cada nivel de desglose están en la{" "}
            <Link href="/metodologia" className="text-primary-light font-semibold hover:underline">
              página de metodología
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">5. Cuánto tiempo conservamos cada dato</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Dato
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Plazo de conservación
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Datos de la cuenta</td>
                <td className="py-3 px-3">
                  Mientras la cuenta esté activa. Al eliminarla se anonimizan de forma irreversible según el
                  apartado 8.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Valoraciones</td>
                <td className="py-3 px-3">
                  De forma indefinida, pero desvinculadas de tu identidad en cuanto eliminas la cuenta.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">
                  Tokens de verificación y restablecimiento
                </td>
                <td className="py-3 px-3">
                  Caducan en cuestión de horas y se eliminan tras usarse. Se almacenan hasheados, de modo que una
                  filtración de la base de datos no permitiría tomar el control de una cuenta.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Sugerencias</td>
                <td className="py-3 px-3">
                  Mientras sean útiles para mejorar el producto. Al eliminar tu cuenta pierden el vínculo con ella.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Registros técnicos y de seguridad</td>
                <td className="py-3 px-3">
                  El periodo de retención que aplican nuestros proveedores de alojamiento y de registro de errores,
                  en el entorno de días o semanas, no de años.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-white font-semibold">Cuentas sin verificar</td>
                <td className="py-3 px-3">
                  Si nunca se completa la verificación del correo, la cuenta puede eliminarse por inactividad sin
                  llegar a participar en ningún agregado público.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Conservaremos, en su caso, la información estrictamente necesaria durante los plazos que impongan las
          obligaciones legales aplicables o para atender posibles reclamaciones.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">6. Quién más trata tus datos por nuestra cuenta</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          No vendemos tus datos, no los cedemos a anunciantes y no los compartimos con terceros para que los usen
          con fines propios. Sí trabajamos con proveedores tecnológicos que actúan como encargados del tratamiento,
          únicamente siguiendo nuestras instrucciones y con contrato de encargo firmado:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Proveedor
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Finalidad
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Ubicación
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Vercel</td>
                <td className="py-3 px-3">
                  Alojamiento de la aplicación y entrega de contenidos. Procesa los datos técnicos de conexión en
                  sus registros de servidor.
                </td>
                <td className="py-3 px-3">EEUU, con cláusulas contractuales tipo</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Neon / Vercel Postgres</td>
                <td className="py-3 px-3">
                  Base de datos donde residen tu cuenta, tus valoraciones y tus atributos demográficos.
                </td>
                <td className="py-3 px-3">Región de la Unión Europea siempre que el proveedor lo permite</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Resend</td>
                <td className="py-3 px-3">
                  Envío de correos transaccionales: verificación de la cuenta, restablecimiento de contraseña y
                  avisos del servicio.
                </td>
                <td className="py-3 px-3">EEUU, con cláusulas contractuales tipo</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">PostHog</td>
                <td className="py-3 px-3">
                  Analítica de producto para entender qué partes de la plataforma se usan. Configurada en modo sin
                  cookies y sin recogida de datos identificativos.
                </td>
                <td className="py-3 px-3">EEUU, con cláusulas contractuales tipo</td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Sentry</td>
                <td className="py-3 px-3">
                  Registro de errores de la aplicación para poder diagnosticarlos y corregirlos.
                </td>
                <td className="py-3 px-3">EEUU, con cláusulas contractuales tipo</td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-white font-semibold">Google</td>
                <td className="py-3 px-3">
                  Únicamente si decides identificarte con el acceso mediante Google. En ese caso Google nos
                  comunica tu correo y tu nombre para crear la cuenta.
                </td>
                <td className="py-3 px-3">EEUU, con cláusulas contractuales tipo</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Los datos de las películas provienen de la API de The Movie Database (TMDB). Esa consulta la realiza
          nuestro servidor, no tu navegador, de modo que TMDB no recibe información sobre ti al navegar por el
          catálogo. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">7. Transferencias internacionales</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Varios de los proveedores anteriores están establecidos en los Estados Unidos, por lo que tus datos
            pueden tratarse fuera del Espacio Económico Europeo. Esas transferencias se amparan en las cláusulas
            contractuales tipo aprobadas por la Comisión Europea y, cuando el proveedor está adherido a él, en el
            Marco de Privacidad de Datos UE-EEUU.
          </p>
          <p>
            Aplicamos además medidas adicionales de minimización: los proveedores estadounidenses solo reciben la
            información imprescindible para su función, y en el caso de la analítica esa información no incluye
            identificadores de usuario ni tus atributos demográficos.
          </p>
          <p>
            Puedes solicitarnos una copia de las garantías aplicables escribiendo a{" "}
            <Pendiente>[PENDIENTE: email de contacto]</Pendiente>.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">8. Qué ocurre exactamente si eliminas tu cuenta</h2>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-6 sm:p-8 space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p className="text-white font-semibold">
            Al ejercer el derecho de supresión anonimizamos tus datos personales y conservamos tus valoraciones
            desvinculadas de tu identidad.
          </p>
          <p>
            Esto significa que se eliminan o sustituyen de forma irreversible tu correo electrónico, tu resumen de
            contraseña, tu nombre público y tu avatar, y la cuenta queda marcada como anonimizada. También se
            borran el texto de tus reseñas, las fechas de tu diario de visionados, tus listas, tu lista de
            pendientes, tus seguimientos y tus notificaciones. Lo que permanece es la nota que pusiste a cada
            película junto a los atributos demográficos que la sitúan en un segmento, sin ningún elemento que
            permita volver a asociarla contigo.
          </p>
          <p>
            Te lo contamos con este nivel de detalle porque es una decisión relevante y queremos que la conozcas
            antes de registrarte. La razón es que una media agregada dejaría de ser veraz si desapareciesen
            retroactivamente las valoraciones que la formaron: el histórico de una película cambiaría cada vez que
            alguien se marcha. El resultado del proceso es un dato estadístico anónimo que, conforme al
            considerando 26 del Reglamento, ya no constituye dato personal, porque no existe forma razonable de
            revertir la anonimización ni de volver a vincular esas notas con una persona identificable.
          </p>
          <p>
            Si prefieres que tus valoraciones no permanezcan ni de forma anónima, puedes borrarlas una a una desde
            tu perfil antes de eliminar la cuenta. También puedes escribirnos y lo haremos por ti.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">9. Tus derechos y cómo ejercerlos aquí</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          El Reglamento te reconoce una serie de derechos sobre tus datos. Hemos intentado que puedas ejercer los
          principales sin escribir a nadie ni esperar respuesta, directamente desde tu perfil:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Derecho
                </th>
                <th className="text-left py-3 px-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Cómo ejercerlo en la práctica
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Acceso</td>
                <td className="py-3 px-3">
                  Tu perfil muestra en todo momento los datos que tenemos sobre ti: correo, nombre público, año de
                  nacimiento, género y el historial completo de tus valoraciones.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Rectificación</td>
                <td className="py-3 px-3">
                  Puedes editar tu nombre público, tu año de nacimiento y tu género desde los ajustes de tu perfil.
                  Los agregados se recalculan con el dato corregido, porque los tramos de edad se derivan del año de
                  nacimiento en cada consulta y nunca se almacenan como valor fijo.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Supresión</td>
                <td className="py-3 px-3">
                  Puedes eliminar tu cuenta desde tu perfil, con el resultado descrito en el apartado 8. También
                  puedes borrar valoraciones concretas sin cerrar la cuenta.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Portabilidad</td>
                <td className="py-3 px-3">
                  Desde tu perfil puedes exportar todas tus valoraciones en un archivo CSV, en un formato abierto y
                  legible por cualquier hoja de cálculo u otro servicio.
                </td>
              </tr>
              <tr className="border-b border-white/5">
                <td className="py-3 px-3 text-white font-semibold">Oposición</td>
                <td className="py-3 px-3">
                  Puedes desactivar los correos periódicos desde tus preferencias y rechazar la analítica no
                  esencial desde el banner de cookies. Para oponerte al tratamiento demográfico, retira el
                  consentimiento eliminando la cuenta o escríbenos y buscaremos la alternativa que te sirva.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-white font-semibold">Limitación</td>
                <td className="py-3 px-3">
                  Si discutes la exactitud de un dato o la licitud del tratamiento, escríbenos y suspenderemos el
                  uso de los datos afectados mientras lo comprobamos, conservándolos sin tratarlos.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Para lo que no puedas resolver desde la plataforma, escribe a{" "}
          <Pendiente>[PENDIENTE: email de contacto]</Pendiente> desde la dirección asociada a tu cuenta.
          Responderemos en el plazo máximo de un mes, ampliable a dos meses más si la solicitud es especialmente
          compleja, en cuyo caso te lo comunicaremos. Si no podemos verificar que la petición procede del titular,
          te pediremos información adicional antes de actuar.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">10. Cookies y analítica</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Usamos únicamente las cookies técnicamente necesarias para que la plataforma funcione: la que mantiene
            tu sesión abierta cuando inicias sesión y las que protegen los formularios frente a peticiones
            falsificadas. No requieren consentimiento porque sin ellas el servicio no puede prestarse, y desaparecen
            al cerrar sesión o al caducar.
          </p>
          <p>
            Además guardamos tu decisión sobre cookies en el almacenamiento local de tu navegador, bajo la clave{" "}
            <code className="text-white bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-xs">
              cinepov_cookie_consent
            </code>
            , para no volver a preguntarte en cada visita. Ese valor no se envía a ningún servidor.
          </p>
          <p>
            La analítica de producto está configurada en modo sin cookies y no se carga hasta que aceptas en el
            banner. Si rechazas las cookies no esenciales, no se inicializa ninguna herramienta de analítica y la
            plataforma sigue funcionando con normalidad. Puedes revocar tu decisión en cualquier momento borrando
            los datos del sitio en tu navegador, lo que hará que el banner vuelva a aparecer.
          </p>
          <p>
            No usamos cookies publicitarias, ni píxeles de redes sociales, ni herramientas de seguimiento entre
            sitios web.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">11. Menores de edad</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          CinePOV está dirigido exclusivamente a personas mayores de 18 años. No tratamos de forma consciente datos
          de menores y, si detectamos una cuenta que incumple este requisito, la eliminaremos. Si tienes constancia
          de que un menor se ha registrado, comunícanoslo en la dirección de contacto y actuaremos de inmediato.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">12. Seguridad</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Aplicamos medidas técnicas y organizativas proporcionadas al riesgo: cifrado en tránsito en todas las
          comunicaciones, contraseñas almacenadas solo como resumen bcrypt, tokens de verificación hasheados y de un
          solo uso, límites de peticiones frente a ataques automatizados y acceso a la base de datos restringido a
          las personas que lo necesitan. Ningún sistema es invulnerable: si se produjera una brecha con riesgo para
          tus derechos, te lo notificaríamos y lo comunicaríamos a la autoridad de control en los plazos legales.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">13. Reclamación ante la autoridad de control</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Si consideras que no hemos atendido correctamente tu solicitud o que tratamos tus datos de forma indebida,
          puedes presentar una reclamación ante la Agencia Española de Protección de Datos (C/ Jorge Juan 6, 28001
          Madrid,{" "}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-light font-semibold hover:underline"
          >
            www.aepd.es
          </a>
          ). Te agradeceríamos la oportunidad de resolverlo antes escribiéndonos a nosotros, pero es tu derecho y
          puedes ejercerlo directamente.
        </p>
      </section>

      <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-bold text-white">Cambios en esta política</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Si modificamos esta política actualizaremos la fecha del encabezado y, cuando el cambio afecte de forma
          sustancial a cómo tratamos tus datos, te avisaremos por correo electrónico o mediante un aviso destacado
          en la plataforma antes de que sea efectivo. Nunca ampliaremos las finalidades del tratamiento de tus datos
          demográficos sin pedirte un nuevo consentimiento.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Documentos relacionados:{" "}
          <Link href="/terminos" className="text-primary-light font-semibold hover:underline">
            términos de uso
          </Link>
          ,{" "}
          <Link href="/aviso-legal" className="text-primary-light font-semibold hover:underline">
            aviso legal
          </Link>{" "}
          y{" "}
          <Link href="/metodologia" className="text-primary-light font-semibold hover:underline">
            metodología
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function IdentityRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
      <dt className="text-[10px] font-black uppercase tracking-wider text-muted-foreground sm:w-32 sm:flex-shrink-0">
        {label}
      </dt>
      <dd className="text-muted-foreground">{children}</dd>
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
