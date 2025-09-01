import express from "express";
import db from "../config/db.js";

const router = express.Router();

// Ruta de prueba GET
router.get("/test", (req, res) => {
  res.json({ message: "API de autenticación funcionando correctamente" });
});

// Ruta GET para login (solo informativa)
router.get("/login", (req, res) => {
  res.json({ 
    message: "Endpoint de login - Usar método POST", 
    example: {
      method: "POST",
      url: "/api/auth/login",
      body: { email: "usuario@ejemplo.com", password: "contraseña" }
    }
  });
});

// Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM usuarios WHERE email = ? AND password = ?",
      [email, password]
    );

    if (rows.length > 0) {
      const user = rows[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol_id: user.rol_id
        }
      });
    } else {
      res.status(401).json({ success: false, message: "Credenciales inválidas" });
    }
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

export default router;