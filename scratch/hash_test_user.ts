import "dotenv/config";
import { db } from "../lib/db";
import bcrypt from "bcrypt";

async function hashUserPassword() {
  console.log("=== ACTUALIZANDO CONTRASEÑA DE USUARIO DE PRUEBA (LUCÍA) ===");

  try {
    const email = "lucia.98@example.com";
    const password = "password123";

    // 1. Hashear contraseña con bcrypt
    console.log("Hasheando contraseña...");
    const hash = await bcrypt.hash(password, 10);
    console.log("Hash generado:", hash);

    // 2. Actualizar el usuario en la base de datos
    const user = await db.user.update({
      where: { email },
      data: { passwordHash: hash },
    });

    console.log(`✅ ¡Éxito! Contraseña de ${user.displayName} (${user.email}) actualizada a "${password}".`);
  } catch (error) {
    console.error("❌ Error actualizando contraseña:", error);
  }
}

hashUserPassword();
