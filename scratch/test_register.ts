import "dotenv/config";
import { db } from "../lib/db";

async function runRegisterTest() {
  console.log("=== INICIANDO TEST DE INTEGRACIÓN DE REGISTRO DE USUARIO ===");

  const testEmail = "test.user@example.com";
  
  try {
    // 1. Limpiar usuario anterior si existe para que el test sea determinista
    await db.user.delete({ where: { email: testEmail } }).catch(() => {});
    console.log("Limpieza de test previa realizada.");

    // 2. Realizar petición de registro válida al servidor local en localhost:3000
    console.log("\n1. Enviando petición de registro válida...");
    const registerResponse = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "securePassword123",
        displayName: "Usuario Test",
        birthYear: 1999,
        gender: "male",
      }),
    });

    const registerData = await registerResponse.json();
    console.log(`Estado HTTP: ${registerResponse.status}`);
    console.log("Respuesta del servidor:", registerData);

    // 3. Intentar registrar el mismo email de nuevo (debe fallar por email duplicado)
    console.log("\n2. Intentando registrar el mismo correo electrónico por segunda vez...");
    const duplicateResponse = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testEmail,
        password: "securePassword123",
        displayName: "Usuario Test Duplicado",
        birthYear: 1999,
        gender: "male",
      }),
    });

    const duplicateData = await duplicateResponse.json();
    console.log(`Estado HTTP: ${duplicateResponse.status}`);
    console.log("Respuesta del servidor (debe ser error):", duplicateData);

    // 4. Intentar registrar con género inválido (debe fallar por validación)
    console.log("\n3. Intentando registrar con género inválido...");
    const invalidGenderResponse = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "otro.email@example.com",
        password: "securePassword123",
        displayName: "Usuario Género Inválido",
        birthYear: 1999,
        gender: "helicoptero",
      }),
    });

    const invalidGenderData = await invalidGenderResponse.json();
    console.log(`Estado HTTP: ${invalidGenderResponse.status}`);
    console.log("Respuesta del servidor (debe ser error de género):", invalidGenderData);

    // 5. Verificar que el usuario válido está en la base de datos local
    console.log("\n4. Consultando base de datos local para verificar el registro...");
    const userInDb = await db.user.findUnique({
      where: { email: testEmail },
    });

    if (userInDb) {
      console.log("✅ ¡Éxito! El usuario se encuentra registrado en la base de datos:");
      console.log({
        id: userInDb.id,
        email: userInDb.email,
        displayName: userInDb.displayName,
        birthYear: userInDb.birthYear,
        gender: userInDb.gender,
        hasPasswordHash: !!userInDb.passwordHash,
      });
    } else {
      console.log("❌ Error: El usuario no se encontró en la base de datos.");
    }

    console.log("\n=== TEST DE INTEGRACIÓN DE REGISTRO COMPLETADO ===");
  } catch (error) {
    console.error("❌ Error durante el test de registro:", error);
  }
}

runRegisterTest();
