// backend/routes/ordenes.js
import express from "express";
import db from "../config/db.js";
import { generarPDFOrden } from "../utils/pdf.js";
import { getIO } from "../websocket.js";   // 👈 WebSocket

const router = express.Router();

// 🔹 Plantillas (puedes moverlas a /data/plantillas.js si prefieres)
const plantillas = {
  "50": [
    { descripcion: "Inspección general de cabina", tipo_responsable: "tecnico" },
    { descripcion: "Revisión de sistemas eléctricos", tipo_responsable: "certificador" }
  ],
  "100": [
    { descripcion: "Cambio de filtros", tipo_responsable: "tecnico" },
    { descripcion: "Prueba de motores", tipo_responsable: "certificador" }
  ],
  "200": [
    { descripcion: "Mantenimiento profundo de motor", tipo_responsable: "tecnico" },
    { descripcion: "Inspección estructural", tipo_responsable: "certificador" }
  ]
};

// 🔹 Helper: verificar columnas en DB
async function columnExists(table, column) {
  const [rows] = await db.query(
    `SELECT 1 
       FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = ?`,
    [table, column]
  );
  return rows.length > 0;
}

/* ============================
   RUTAS
============================ */

// Ítems por técnico
router.get("/tecnico/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM tareas_orden WHERE tecnico_id = ?", [id]);
    res.json({ success: true, items: rows });
  } catch (err) {
    console.error("Error obteniendo ítems técnico:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// Ítems por certificador
router.get("/certificador/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query("SELECT * FROM tareas_orden WHERE certificador_id = ?", [id]);
    res.json({ success: true, items: rows });
  } catch (err) {
    console.error("Error obteniendo ítems certificador:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// Guardar firma
router.put("/firma/:itemId", async (req, res) => {
  const { itemId } = req.params;
  const { firma, usuario_id } = req.body;

  if (!firma || !usuario_id) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  try {
    const [user] = await db.query("SELECT rol_id FROM usuarios WHERE id = ?", [usuario_id]);
    if (!user.length) {
      return res.status(400).json({ success: false, message: "Usuario no encontrado" });
    }

    const rol = user[0].rol_id;
    let campoFirma = "", campoFecha = "";
    if (rol === 2) {
      campoFirma = "firma_tecnico";
      campoFecha = "fecha_firma_tecnico";
    } else if (rol === 3) {
      campoFirma = "firma_certificador";
      campoFecha = "fecha_firma_certificador";
    } else {
      return res.status(400).json({ success: false, message: "Rol no autorizado para firmar" });
    }

    const [item] = await db.query(`SELECT ${campoFirma} FROM tareas_orden WHERE id = ?`, [itemId]);
    if (!item.length) {
      return res.status(404).json({ success: false, message: "Ítem no encontrado" });
    }
    if (item[0][campoFirma]) {
      return res.status(400).json({ success: false, message: "Este ítem ya fue firmado" });
    }

    await db.query(
      `UPDATE tareas_orden SET ${campoFirma} = ?, ${campoFecha} = NOW() WHERE id = ?`,
      [firma, itemId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error guardando firma:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// Listar órdenes
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM ordenes_trabajo");
    res.json({ success: true, ordenes: rows });
  } catch (err) {
    console.error("Error obteniendo órdenes:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// Crear orden manual
router.post("/", async (req, res) => {
  const { aeronave_id, mantenimiento_id } = req.body;
  if (!aeronave_id || !mantenimiento_id) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO ordenes_trabajo (aeronave_id, mantenimiento_id, estado, porcentaje_avance) VALUES (?, ?, "en_proceso", 0)',
      [aeronave_id, mantenimiento_id]
    );
    res.json({ success: true, orden_id: result.insertId });
  } catch (err) {
    console.error("Error creando orden:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// ✅ Crear orden con plantilla + WebSocket
router.post("/generar", async (req, res) => {
  try {
    const { aeronave_id, tipo_mantenimiento } = req.body;
    if (!aeronave_id || !tipo_mantenimiento) {
      return res.status(400).json({ success: false, message: "Datos incompletos" });
    }

    // Detectar columnas dinámicamente
    const hasMantenimientoId = await columnExists("ordenes_trabajo", "mantenimiento_id");
    const hasTipoMantenimiento = await columnExists("ordenes_trabajo", "tipo_mantenimiento");

    if (!hasMantenimientoId && !hasTipoMantenimiento) {
      return res.status(500).json({
        success: false,
        message: "La tabla ordenes_trabajo no tiene ni mantenimiento_id ni tipo_mantenimiento"
      });
    }

    // Crear orden
    let orden_id;
    if (hasMantenimientoId) {
      const [result] = await db.query(
        'INSERT INTO ordenes_trabajo (aeronave_id, mantenimiento_id, estado, porcentaje_avance) VALUES (?, ?, "en_proceso", 0)',
        [aeronave_id, tipo_mantenimiento]
      );
      orden_id = result.insertId;
    } else {
      const [result] = await db.query(
        'INSERT INTO ordenes_trabajo (aeronave_id, tipo_mantenimiento, estado, porcentaje_avance) VALUES (?, ?, "en_proceso", 0)',
        [aeronave_id, tipo_mantenimiento]
      );
      orden_id = result.insertId;
    }

    // Insertar tareas
    const hasTipoResponsable = await columnExists("tareas_orden", "tipo_responsable");
    const tareas = plantillas[tipo_mantenimiento] || [];

    for (const tarea of tareas) {
      if (hasTipoResponsable) {
        await db.query(
          "INSERT INTO tareas_orden (orden_id, descripcion, tipo_responsable, estado) VALUES (?, ?, ?, ?)",
          [orden_id, tarea.descripcion, tarea.tipo_responsable, "pendiente"]
        );
      } else {
        await db.query(
          "INSERT INTO tareas_orden (orden_id, descripcion, estado) VALUES (?, ?, ?)",
          [orden_id, tarea.descripcion, "pendiente"]
        );
      }
    }

    // 🔔 Emitir notificación por WebSocket
    const io = getIO?.();
    if (io) {
      io.emit("notificacion", {
        titulo: "Nueva Orden de Trabajo",
        mensaje: `Se generó una orden de ${tipo_mantenimiento} horas para la aeronave ${aeronave_id}`,
        rol: "tecnico"
      });

      io.emit("orden_generada", {
        id: orden_id,
        aeronave_id,
        tipo_mantenimiento,
        tareas
      });
    }

    res.json({ success: true, orden_id, aeronave_id, tipo_mantenimiento, tareas });
  } catch (err) {
    console.error("💥 Error en POST /ordenes/generar:", err);
    res.status(500).json({ success: false, message: "Error al generar orden", error: err?.message });
  }
});

// Actualizar orden
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { porcentaje_avance, estado } = req.body;

  try {
    await db.query(
      "UPDATE ordenes_trabajo SET porcentaje_avance = ?, estado = ? WHERE id = ?",
      [porcentaje_avance, estado, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Error actualizando orden:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// Finalizar orden
router.put("/:id/finalizar", async (req, res) => {
  const { id } = req.params;
  try {
    const [pendientes] = await db.query(
      "SELECT id FROM tareas_orden WHERE orden_id = ? AND (firma_tecnico IS NULL OR firma_certificador IS NULL)",
      [id]
    );

    if (pendientes.length > 0) {
      return res.status(400).json({ success: false, message: "Aún hay ítems sin firmar" });
    }

    await db.query(
      'UPDATE ordenes_trabajo SET estado = "finalizada", porcentaje_avance = 100 WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: "Orden finalizada con éxito" });
  } catch (err) {
    console.error("Error finalizando orden:", err);
    res.status(500).json({ success: false, message: "Error en el servidor" });
  }
});

// PDF de orden
router.get("/:id/pdf", async (req, res) => {
  const { id } = req.params;
  try {
    const [ordenRows] = await db.query(
      "SELECT ot.*, a.matricula, m.nombre as mantenimiento FROM ordenes_trabajo ot INNER JOIN aeronaves a ON ot.aeronave_id = a.id INNER JOIN mantenimientos m ON ot.mantenimiento_id = m.id WHERE ot.id = ?",
      [id]
    );

    if (!ordenRows.length) {
      return res.status(404).json({ success: false, message: "Orden no encontrada" });
    }

    const orden = ordenRows[0];
    const [tareas] = await db.query("SELECT * FROM tareas_orden WHERE orden_id = ?", [id]);

    const pdfBuffer = await generarPDFOrden(orden, tareas);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=orden_${id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Error generando PDF:", err);
    res.status(500).json({ success: false, message: "Error generando PDF" });
  }
});

export default router;
