/**
 * Servicio de correo electrónico de CinePOV.
 * Envía a través de Resend cuando hay credenciales configuradas. Si no las hay,
 * cae al comportamiento de desarrollo: imprimir el email en la consola del
 * servidor, para que el entorno local funcione sin cuenta de Resend.
 */

import { Resend } from "resend";
import { SITE_URL } from "./site";

/** Base pública de la aplicación, usada para construir los enlaces de los emails. */
export const APP_URL = SITE_URL;

const EMAIL_FROM = process.env.EMAIL_FROM || "CinePOV <onboarding@resend.dev>";

interface SimpleMovieData {
  title: string;
  year: number;
  avgScore: number;
  votes: number;
}

let resendClient: Resend | null = null;

/**
 * El cliente se instancia de forma perezosa porque el constructor de Resend
 * lanza una excepción si la clave no existe, y aquí la ausencia de clave es un
 * escenario válido (desarrollo local).
 */
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }

  return resendClient;
}

/**
 * Enmascara una dirección para los logs: "ana.garcia@gmail.com" → "a***@gmail.com".
 * Los logs de la plataforma no deben contener datos personales.
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

function printToConsole(label: string, to: string, subject: string, html: string): void {
  console.log("\n" + "=".repeat(80));
  console.log(`[EMAIL SIMULADOR] 📬 ${label}`);
  console.log(`Para:       ${to}`);
  console.log(`Asunto:     ${subject}`);
  console.log("-".repeat(80));
  console.log(html.trim());
  console.log("=".repeat(80) + "\n");
}

/**
 * Punto único de envío. Nunca propaga errores: un fallo de correo no debe
 * tumbar un registro ni un restablecimiento de contraseña.
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  label: string
): Promise<boolean> {
  const client = getResendClient();

  if (!client) {
    // En producción nunca se imprime el correo: contiene enlaces de un solo uso
    // (verificación, restablecimiento de contraseña) que acabarían en los logs.
    if (process.env.NODE_ENV === "production") {
      console.error(`[EMAIL] RESEND_API_KEY no está configurada: el correo "${label}" no se ha enviado.`);
      return false;
    }
    console.warn(`[EMAIL] RESEND_API_KEY no está configurada: el correo "${label}" se simula por consola.`);
    printToConsole(label, to, subject, html);
    return true;
  }

  try {
    const { error } = await client.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[EMAIL] Resend rechazó el envío de "${label}" a ${maskEmail(to)}:`, error);
      return false;
    }

    return true;
  } catch (err) {
    console.error(`[EMAIL] Error inesperado al enviar "${label}" a ${maskEmail(to)}:`, err);
    return false;
  }
}

/** Envoltorio común de todas las plantillas: contenedor oscuro y logotipo. */
function renderLayout(innerHtml: string, footerHtml: string): string {
  return `
    <div style="background-color: #0b0c10; color: #c5c6c7; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 20px; border: 1px solid #1f2833;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #66fcf1; text-transform: uppercase;">CinePOV</span>
      </div>

      ${innerHtml}

      <div style="text-align: center; margin-top: 30px; border-top: 1px solid #1f2833; pt-20px;">
        ${footerHtml}
      </div>
    </div>
  `;
}

/**
 * Envía el email de bienvenida post-registro.
 */
export async function sendWelcomeEmail(email: string, displayName: string): Promise<boolean> {
  const subject = `¡Te damos la bienvenida a CinePOV, ${displayName}! 🍿`;
  
  const htmlBody = `
    <div style="background-color: #0b0c10; color: #c5c6c7; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 20px; border: 1px solid #1f2833;">
      <div style="text-align: center; margin-bottom: 30px;">
        <span style="font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #66fcf1; text-transform: uppercase;">CinePOV</span>
      </div>
      
      <div style="background-color: #1f2833; padding: 30px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px;">
        <h2 style="color: #ffffff; font-weight: 800; margin-top: 0;">¡Hola, ${displayName}!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #c5c6c7;">
          Te damos la bienvenida oficial a <strong>CinePOV</strong>, la plataforma que rompe la tiranía de la nota media general para darte el punto de vista cinéfilo que de verdad te interesa.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #c5c6c7;">
          A partir de ahora podrás:
        </p>
        <ul style="font-size: 14px; line-height: 1.6; color: #c5c6c7; padding-left: 20px;">
          <li style="margin-bottom: 8px;">Comparar tus valoraciones con la media global y ver tus desviaciones críticas.</li>
          <li style="margin-bottom: 8px;">Filtrar los rankings por género y rangos de edad.</li>
          <li style="margin-bottom: 8px;">Importar tus históricos de Letterboxd e IMDb con un par de clics.</li>
        </ul>
      </div>
      
      <div style="text-align: center; margin-top: 30px; border-top: 1px solid #1f2833; pt-20px;">
        <p style="font-size: 11px; color: #45f3ff; font-weight: bold; margin-bottom: 5px;">Tu Punto de Vista Cinematográfico</p>
        <p style="font-size: 10px; color: #666; margin: 0;">Este correo se ha enviado de forma automática tras el registro.</p>
      </div>
    </div>
  `;

  return sendEmail(email, subject, htmlBody, "Correo de Bienvenida");
}

/**
 * Envía el enlace de confirmación de la dirección de correo.
 */
export async function sendVerificationEmail(
  email: string,
  displayName: string,
  verifyUrl: string
): Promise<boolean> {
  const subject = `Confirma tu correo en CinePOV 🎬`;

  const htmlBody = renderLayout(
    `
      <div style="background-color: #1f2833; padding: 30px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px;">
        <h2 style="color: #ffffff; font-weight: 800; margin-top: 0;">Solo falta un paso, ${displayName}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #c5c6c7;">
          Confirma que esta dirección de correo es tuya para activar tu cuenta de <strong>CinePOV</strong>. Verificar tu email es lo que permite que tus valoraciones cuenten en las estadísticas demográficas públicas.
        </p>
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${verifyUrl}" style="display: inline-block; background-color: #45f3ff; color: #0b0c10; font-weight: bold; font-size: 12px; text-decoration: none; padding: 12px 28px; border-radius: 30px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            Confirmar mi correo
          </a>
        </div>
        <p style="font-size: 11px; line-height: 1.6; color: #666; text-align: center; margin-bottom: 0;">
          El enlace caduca en 24 horas. Si el botón no funciona, copia y pega esta dirección en tu navegador:<br />
          <span style="color: #66fcf1; word-break: break-all;">${verifyUrl}</span>
        </p>
      </div>
    `,
    `
      <p style="font-size: 11px; color: #45f3ff; font-weight: bold; margin-bottom: 5px;">Tu Punto de Vista Cinematográfico</p>
      <p style="font-size: 10px; color: #666; margin: 0;">Si no te has registrado en CinePOV, puedes ignorar este mensaje.</p>
    `
  );

  return sendEmail(email, subject, htmlBody, "Verificación de Correo");
}

/**
 * Envía el enlace para establecer una contraseña nueva.
 */
export async function sendPasswordResetEmail(
  email: string,
  displayName: string,
  resetUrl: string
): Promise<boolean> {
  const subject = `Restablece tu contraseña de CinePOV 🔐`;

  const htmlBody = renderLayout(
    `
      <div style="background-color: #1f2833; padding: 30px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px;">
        <h2 style="color: #ffffff; font-weight: 800; margin-top: 0;">Hola, ${displayName}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #c5c6c7;">
          Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de <strong>CinePOV</strong>. Pulsa el botón para elegir una contraseña nueva.
        </p>
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${resetUrl}" style="display: inline-block; background-color: #45f3ff; color: #0b0c10; font-weight: bold; font-size: 12px; text-decoration: none; padding: 12px 28px; border-radius: 30px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            Crear contraseña nueva
          </a>
        </div>
        <p style="font-size: 12px; line-height: 1.6; color: #c5c6c7; text-align: center; margin-bottom: 15px;">
          <strong style="color: #66fcf1;">Este enlace caduca en 1 hora</strong> y solo puede utilizarse una vez.
        </p>
        <p style="font-size: 11px; line-height: 1.6; color: #666; text-align: center; margin-bottom: 0;">
          Si el botón no funciona, copia y pega esta dirección en tu navegador:<br />
          <span style="color: #66fcf1; word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
    `,
    `
      <p style="font-size: 11px; color: #45f3ff; font-weight: bold; margin-bottom: 5px;">Tu Punto de Vista Cinematográfico</p>
      <p style="font-size: 10px; color: #666; margin: 0;">Si no has solicitado este cambio, ignora este mensaje: tu contraseña actual seguirá siendo válida.</p>
    `
  );

  return sendEmail(email, subject, htmlBody, "Restablecimiento de Contraseña");
}

/**
 * Avisa de que la cuenta se creó con Google y por tanto no tiene contraseña que
 * restablecer. Es la respuesta al "he olvidado mi contraseña" de una cuenta OAuth.
 */
export async function sendOAuthOnlyAccountEmail(
  email: string,
  displayName: string
): Promise<boolean> {
  const subject = `Tu cuenta de CinePOV usa acceso con Google 🔑`;
  const loginUrl = `${APP_URL}/login`;

  const htmlBody = renderLayout(
    `
      <div style="background-color: #1f2833; padding: 30px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 20px;">
        <h2 style="color: #ffffff; font-weight: 800; margin-top: 0;">Hola, ${displayName}</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #c5c6c7;">
          Has solicitado restablecer la contraseña de tu cuenta de <strong>CinePOV</strong>, pero esta cuenta no tiene contraseña: se creó accediendo con Google.
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #c5c6c7;">
          Para entrar, usa el botón <strong>Iniciar sesión con Google</strong> de la pantalla de acceso.
        </p>
        <div style="text-align: center; margin: 30px 0 0 0;">
          <a href="${loginUrl}" style="display: inline-block; background-color: #45f3ff; color: #0b0c10; font-weight: bold; font-size: 12px; text-decoration: none; padding: 12px 28px; border-radius: 30px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            Ir a iniciar sesión
          </a>
        </div>
      </div>
    `,
    `
      <p style="font-size: 11px; color: #45f3ff; font-weight: bold; margin-bottom: 5px;">Tu Punto de Vista Cinematográfico</p>
      <p style="font-size: 10px; color: #666; margin: 0;">Si no has solicitado nada, puedes ignorar este mensaje.</p>
    `
  );

  return sendEmail(email, subject, htmlBody, "Cuenta con Acceso de Google");
}

/**
 * Envía el boletín semanal de películas populares según el segmento.
 */
export async function sendWeeklyTrendsEmail(
  email: string,
  displayName: string,
  segmentLabel: string,
  movies: SimpleMovieData[]
): Promise<boolean> {
  const subject = `Tendencias semanales de tu segmento en CinePOV 🍿`;

  let moviesHtml = "";
  for (let i = 0; i < movies.length; i++) {
    const m = movies[i];
    moviesHtml += `
      <div style="display: flex; align-items: center; background-color: #0b0c10; padding: 15px; border-radius: 12px; border: 1px solid #1f2833; margin-bottom: 12px;">
        <div style="font-size: 20px; font-weight: 900; color: #66fcf1; width: 35px; text-align: center; margin-right: 10px;">${i + 1}º</div>
        <div style="flex: 1;">
          <h4 style="color: #ffffff; margin: 0 0 4px 0; font-size: 14px; font-weight: 800;">${m.title}</h4>
          <span style="font-size: 11px; color: #666;">Año ${m.year}</span>
        </div>
        <div style="text-align: right; margin-left: 15px;">
          <div style="font-size: 16px; font-weight: 900; color: #ffffff;">${m.avgScore.toFixed(1)} <span style="font-size: 10px; color: #666;">/10</span></div>
          <span style="font-size: 9px; color: #66fcf1; font-weight: bold; text-transform: uppercase;">${m.votes} votos en segmento</span>
        </div>
      </div>
    `;
  }

  const htmlBody = `
    <div style="background-color: #0b0c10; color: #c5c6c7; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; border-radius: 20px; border: 1px solid #1f2833;">
      <div style="text-align: center; margin-bottom: 35px;">
        <span style="font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #66fcf1; text-transform: uppercase;">CinePOV</span>
        <h3 style="color: #ffffff; font-weight: 700; margin-top: 10px; font-size: 16px;">Tu Boletín Semanal de Tendencias</h3>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6; color: #c5c6c7; margin-bottom: 25px;">
        Hola <strong>${displayName}</strong>. Hemos calculado las películas más populares y mejor valoradas esta semana entre personas de tu mismo segmento demográfico (<span style="color: #66fcf1; font-weight: bold;">${segmentLabel}</span>):
      </p>
      
      <div style="background-color: #1f2833; padding: 25px; border-radius: 15px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 25px;">
        <h3 style="color: #ffffff; font-size: 13px; font-weight: 800; text-transform: uppercase; tracking-wider; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #1f2833; pb-5px;">
          Top Películas en tu Segmento
        </h3>
        
        ${moviesHtml || `<div style="text-align:center; color:#666; font-size:12px; padding: 10px 0;">No hay suficientes valoraciones esta semana para calcular el Top.</div>`}
      </div>

      <p style="font-size: 13px; color: #c5c6c7; line-height: 1.5; text-align: center; margin-bottom: 20px;">
        ¿Quieres calificar más películas para afinar tu compatibilidad?
      </p>
      <div style="text-align: center;">
        <a href="${APP_URL}/explore" style="display: inline-block; background-color: #45f3ff; color: #0b0c10; font-weight: bold; font-size: 12px; text-decoration: none; padding: 10px 24px; border-radius: 30px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          Explorar Catálogo
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 35px; border-top: 1px solid #1f2833; pt-20px;">
        <p style="font-size: 10px; color: #666; margin-bottom: 5px;">Este correo se envió a ${email} porque tienes activadas las tendencias semanales.</p>
        <p style="font-size: 9px; color: #444; margin: 0;">Puedes desactivar este boletín en cualquier momento desde los ajustes de tu perfil en CinePOV.</p>
      </div>
    </div>
  `;

  return sendEmail(email, subject, htmlBody, "Boletín Semanal");
}
