// backend/routes/aeronaves.js
import express from "express";
import db from "../config/db.js"; // este debe ser mysql2/promise
const router = express.Router();

// Obtener todas las aeronaves
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM aeronaves");
    res.json({ success: true, aeronaves: rows });
  } catch (err) {
    console.error("Error al obtener aeronaves:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// Crear aeronave
router.post("/", async (req, res) => {
  try {
    const {
      matricula,
      fabricante,
      marca,
      modelo,
      anio_fabricacion,
      serie_numero,
      total_horas_vuelo,
      foto,
    } = req.body;

    if (!matricula)
      return res
        .status(400)
        .json({ success: false, message: "Falta matrícula" });

    const [result] = await db.query(
      `INSERT INTO aeronaves 
      (matricula, fabricante, marca, modelo, anio_fabricacion, serie_numero, total_horas_vuelo, foto) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        matricula,
        fabricante,
        marca,
        modelo,
        anio_fabricacion,
        serie_numero,
        total_horas_vuelo || 0,
        foto,
      ]
    );

    res.json({ success: true, aeronave_id: result.insertId });
  } catch (err) {
    console.error("Error al crear aeronave:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// Editar horas de vuelo (sumar y registrar en historial)
router.put("/:id/horas", async (req, res) => {
  try {
    const { id } = req.params;
    const { horas } = req.body;

    if (!horas)
      return res
        .status(400)
        .json({ success: false, message: "Faltan horas" });

    // Actualizar horas en aeronaves
    await db.query(
      "UPDATE aeronaves SET total_horas_vuelo = total_horas_vuelo + ? WHERE id = ?",
      [horas, id]
    );

    // Registrar en historial
    await db.query(
      "INSERT INTO horas_historial (id_aeronave, horas_sumadas) VALUES (?, ?)",
      [id, horas]
    );

    res.json({
      success: true,
      message: "Horas actualizadas y registradas en historial",
    });
  } catch (err) {
    console.error("Error al actualizar horas:", err);
    res
      .status(500)
      .json({ success: false, message: "Error al actualizar horas" });
  }
});

export default router;
// backend/config/db.js      