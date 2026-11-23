import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aviso legal · CinePOV",
  description:
    "Datos de identificación del titular de CinePOV conforme a la Ley 34/2002 (LSSI), condiciones de uso del sitio, propiedad intelectual y política de enlaces.",
};

export default function AvisoLegalPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
      <header className="space-y-4">
        <span className="text-[10px] font-black uppercase tracking-widest text-primary-light bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
          Legal
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight text-gradient">Aviso legal</h1>
        <p className="text-base text-muted-foreground leading-relaxed">
          Información general sobre el titular de este sitio web y las condiciones de acceso, en cumplimiento del
          artículo 10 de la Ley 34/2002 de servicios de la sociedad de la información y de comercio electrónico.
        </p>
        <p className="text-xs text-muted-foreground">Última actualización: julio de 2026.</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">1. Identificación del titular</h2>
        <div className="glass-panel rounded-3xl border border-white/5 p-6 sm:p-8">
          <dl className="space-y-3 text-sm">
            <IdentityRow label="Denominación">
              <Pendiente>[PENDIENTE: razón social]</Pendiente>
            </IdentityRow>
            <IdentityRow label="NIF">
              <Pendiente>[PENDIENTE: NIF]</Pendiente>
            </IdentityRow>
            <IdentityRow label="Domicilio">
              <Pendiente>[PENDIENTE: dirección]</Pendiente>
            </IdentityRow>
            <IdentityRow label="Correo">
              <Pendiente>[PENDIENTE: email de contacto]</Pendiente>
            </IdentityRow>
            <IdentityRow label="Sitio web">
              <Pendiente>[PENDIENTE: dominio]</Pendiente>
            </IdentityRow>
            <IdentityRow label="Actividad">
              Prestación de un servicio de la sociedad de la información consistente en una plataforma de valoración
              de películas con desglose demográfico agregado.
            </IdentityRow>
          </dl>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          En lo sucesivo, este titular se identifica como CinePOV. Cuando la actividad esté sujeta a inscripción en
          un registro público, los datos registrales se incorporarán a este apartado.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">2. Objeto y condiciones de uso del sitio</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Este aviso regula el acceso y la navegación por el sitio web de CinePOV. El simple acceso atribuye la
            condición de usuario e implica la aceptación de las condiciones aquí recogidas, así como de los{" "}
            <Link href="/terminos" className="text-primary-light font-semibold hover:underline">
              términos de uso
            </Link>{" "}
            del servicio y de la{" "}
            <Link href="/privacidad" className="text-primary-light font-semibold hover:underline">
              política de privacidad
            </Link>{" "}
            cuando se crea una cuenta.
          </p>
          <p>
            El usuario se compromete a hacer un uso diligente del sitio, conforme a la ley, a la buena fe y al orden
            público, y a abstenerse de cualquier conducta que pueda dañar la imagen, los intereses o los derechos de
            CinePOV o de terceros, así como de intentar deteriorar, inutilizar o sobrecargar el servicio o impedir su
            uso normal.
          </p>
          <p>
            El acceso al sitio es gratuito, salvo el coste de la conexión a internet que el usuario tenga contratada
            con su proveedor. CinePOV se reserva la facultad de modificar, suspender o interrumpir el acceso al sitio
            o a cualquiera de sus contenidos en cualquier momento y sin necesidad de preaviso, especialmente por
            motivos de mantenimiento, seguridad o actualización.
          </p>
          <p>
            La creación de una cuenta está reservada a personas mayores de 18 años y se rige por los términos de uso.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">3. Propiedad intelectual e industrial</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            Todos los elementos del sitio web (código fuente, diseño, estructura de navegación, textos, gráficos,
            logotipos, la denominación CinePOV y sus signos distintivos) son titularidad de CinePOV o de sus
            licenciantes, y están protegidos por la normativa española e internacional de propiedad intelectual e
            industrial.
          </p>
          <p>
            Queda prohibida su reproducción, distribución, comunicación pública, transformación o extracción total o
            parcial, incluida la utilización de sistemas automatizados de recopilación de datos, sin autorización
            expresa y por escrito del titular. El acceso al sitio no otorga al usuario ningún derecho sobre estos
            elementos más allá de lo estrictamente necesario para su uso personal.
          </p>
          <p>
            La información relativa a las películas procede de{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-light font-semibold hover:underline"
            >
              The Movie Database (TMDB)
            </a>{" "}
            y se utiliza conforme a las condiciones de uso de su API.{" "}
            <span className="text-white font-semibold">
              Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB.
            </span>{" "}
            Los carteles e imágenes promocionales pertenecen a sus respectivos titulares y se muestran con finalidad
            informativa e identificativa.
          </p>
          <p>
            Si consideras que algún contenido de este sitio vulnera tus derechos de propiedad intelectual,
            comunícalo a <Pendiente>[PENDIENTE: email de contacto]</Pendiente> aportando la información necesaria
            para localizarlo y acreditar tu titularidad, y procederemos a su revisión y, en su caso, retirada.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">4. Enlaces externos</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            El sitio puede incluir enlaces a páginas de terceros, como TMDB o plataformas donde una película está
            disponible. Esos enlaces se ofrecen únicamente como información complementaria y no implican relación,
            recomendación, patrocinio ni supervisión alguna de sus contenidos.
          </p>
          <p>
            CinePOV no controla ni asume responsabilidad por la información, los servicios o las políticas de
            privacidad de los sitios enlazados. Al abandonar nuestro sitio quedas sujeto a las condiciones del
            destino, cuya lectura te recomendamos. Si detectamos que un enlace conduce a contenidos ilícitos o
            inadecuados, lo retiraremos con la mayor diligencia; puedes avisarnos en la dirección de contacto.
          </p>
          <p>
            El establecimiento de enlaces hacia este sitio desde páginas de terceros requiere que no se realicen
            manifestaciones falsas o inexactas sobre CinePOV, no se reproduzca su contenido mediante técnicas que
            oculten su origen y el enlace dirija a la página de inicio o a una página de contenido completa, sin
            enmarcarla.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">5. Exclusión de responsabilidad</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            CinePOV no garantiza la disponibilidad continuada ni la ausencia de errores en el sitio, aunque adopta
            las medidas razonables para evitarlos, corregirlos y actualizar sus contenidos. Tampoco responde de los
            daños derivados de la presencia de virus u otros elementos dañinos introducidos por terceros y ajenos a
            su control.
          </p>
          <p>
            Los contenidos con carácter estadístico publicados en el sitio tienen finalidad informativa y no
            constituyen asesoramiento de ningún tipo. Las opiniones y valoraciones aportadas por los usuarios
            corresponden exclusivamente a sus autores.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">6. Protección de datos y cookies</h2>
        <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
          <p>
            El tratamiento de datos personales se detalla en la{" "}
            <Link href="/privacidad" className="text-primary-light font-semibold hover:underline">
              política de privacidad
            </Link>
            , que incluye la información sobre las cookies utilizadas, los encargados del tratamiento y el
            procedimiento para ejercer los derechos de acceso, rectificación, supresión, portabilidad, oposición y
            limitación.
          </p>
          <p>
            La metodología de cálculo de los datos publicados, incluidos los umbrales mínimos y qué valoraciones
            cuentan, está documentada de forma pública en la{" "}
            <Link href="/metodologia" className="text-primary-light font-semibold hover:underline">
              página de metodología
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-white/5 bg-white/[0.02] p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-bold text-white">7. Legislación aplicable</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Este aviso legal se rige por la legislación española. Para la resolución de cualquier controversia
          relacionada con el sitio serán competentes los juzgados y tribunales españoles, sin perjuicio del fuero que
          corresponda al usuario cuando actúe en condición de consumidor. Para cualquier cuestión relativa a este
          aviso puedes escribir a <Pendiente>[PENDIENTE: email de contacto]</Pendiente>.
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
      <dd className="text-muted-foreground leading-relaxed">{children}</dd>
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
