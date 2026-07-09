/**
 * Servicio simulador de correo electrónico para CinePOV.
 * En desarrollo local, este módulo formatea plantillas de email HTML premium
 * y las escribe detalladamente en la consola del servidor Next.js.
 */

interface SimpleMovieData {
  title: string;
  year: number;
  avgScore: number;
  votes: number;
}

/**
 * Simula el envío de un email de bienvenida post-registro.
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
        <p style="font-size: 10px; color: #666; margin: 0;">Este es un email de simulación enviado de forma automática tras el registro.</p>
      </div>
    </div>
  `;

  // Imprimir un bloque muy visible en los logs del servidor
  console.log("\n" + "=".repeat(80));
  console.log(`[EMAIL SIMULADOR] 📬 Correo de Bienvenida Enviado`);
  console.log(`Para:       ${email}`);
  console.log(`Asunto:     ${subject}`);
  console.log("-".repeat(80));
  console.log(htmlBody.trim());
  console.log("=".repeat(80) + "\n");

  return true;
}

/**
 * Simula el envío del boletín semanal de películas populares según el segmento.
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
        <a href="http://localhost:3000/explore" style="display: inline-block; background-color: #45f3ff; color: #0b0c10; font-weight: bold; font-size: 12px; text-decoration: none; padding: 10px 24px; border-radius: 30px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          Explorar Catálogo
        </a>
      </div>
      
      <div style="text-align: center; margin-top: 35px; border-top: 1px solid #1f2833; pt-20px;">
        <p style="font-size: 10px; color: #666; margin-bottom: 5px;">Este correo se envió a ${email} porque tienes activadas las tendencias semanales.</p>
        <p style="font-size: 9px; color: #444; margin: 0;">Puedes desactivar este boletín en cualquier momento desde los ajustes de tu perfil en CinePOV.</p>
      </div>
    </div>
  `;

  // Imprimir un bloque muy visible en los logs del servidor
  console.log("\n" + "=".repeat(80));
  console.log(`[EMAIL SIMULADOR] 📬 Boletín Semanal Enviado`);
  console.log(`Para:       ${email}`);
  console.log(`Asunto:     ${subject}`);
  console.log("-".repeat(80));
  console.log(htmlBody.trim());
  console.log("=".repeat(80) + "\n");

  return true;
}
