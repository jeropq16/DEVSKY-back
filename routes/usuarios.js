// backend/routes/usuarios.js
import { Router } from "express";
import db from "../config/db.js";

const router = Router();

// ✅ Obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre, email, rol_id FROM usuarios"
    );
    res.json({ success: true, usuarios: rows });
  } catch (err) {
    console.error("Error en GET /usuarios:", err);
    res
      .status(500)
      .json({ success: false, message: "Error en el servidor" });
  }
});

// ✅ Obtener técnicos (usuarios con rol_id = 2)
router.get("/tecnicos", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nombre, email FROM usuarios WHERE rol_id = 2"
    );
    res.json({ success: true, tecnicos: rows });
  } catch (err) {
    console.error("Error en GET /usuarios/tecnicos:", err);
    res
      .status(500)
      .json({ success: false, message: "Error en el servidor" });
  }
});

// ✅ Crear usuario
router.post("/", async (req, res) => {
  try {
    const { nombre, email, password, rol_id } = req.body;

    if (!nombre || !email || !password || !rol_id) {
      return res
        .status(400)
        .json({ success: false, message: "Faltan datos" });
    }

    const [result] = await db.query(
      "INSERT INTO usuarios (nombre, email, password, rol_id) VALUES (?, ?, ?, ?)",
      [nombre, email, password, rol_id]
    );

    res.json({ success: true, usuario_id: result.insertId });
  } catch (err) {
    console.error("Error en POST /usuarios:", err);
    res
      .status(500)
      .json({ success: false, message: "Error en el servidor" });
  }
});

export default router;