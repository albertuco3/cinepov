import "dotenv/config";
import { db } from "../lib/db";

async function runCompleteProfileTest() {
  console.log("=== INICIANDO TEST DE ACTUALIZACIÓN DE PERFIL DEMOGRÁFICO ===");

  const testEmail = "oauth.user@example.com";

  try {
    // 1. Crear un usuario de prueba "incompleto" (como si viniera de Google OAuth por primera vez)
    await db.user.delete({ where: { email: testEmail } }).catch(() => {});
    
    console.log("1. Creando usuario simulado de Google (con birthYear = 0 y gender = 'prefer_not_to_say' o nulos)...");
    const oauthUser = await db.user.create({
      data: {
        email: testEmail,
        displayName: "Google User",
        birthYear: 0, // 0 o null indica que falta completar (en SQLite los enteros no nulos pueden inicializarse a 0 o manejarse nulos)
        gender: "",   // vacío indica incompleto
      },
    });

    console.log("Usuario de Google creado en BD:", {
      id: oauthUser.id,
      email: oauthUser.email,
      birthYear: oauthUser.birthYear,
      gender: oauthUser.gender,
    });

    // 2. Simular la actualización del onboarding (como haría la API)
    console.log("\n2. Simulando flujo de Onboarding Express (guardando birthYear: 1995 y gender: 'female')...");
    const updatedUser = await db.user.update({
      where: { id: oauthUser.id },
      data: {
        birthYear: 1995,
        gender: "female",
      },
    });

    console.log("✅ ¡Éxito! Usuario actualizado tras onboarding en la base de datos:");
    console.log({
      id: updatedUser.id,
      email: updatedUser.email,
      birthYear: updatedUser.birthYear,
      gender: updatedUser.gender,
    });

    // 3. Limpieza de datos de prueba
    await db.user.delete({ where: { id: oauthUser.id } });
    console.log("\nLimpieza de test realizada.");
    console.log("=== TEST DE PERFIL COMPLETADO CON ÉXITO ===");

  } catch (error) {
    console.error("❌ Error durante el test de onboarding:", error);
  }
}

runCompleteProfileTest();
