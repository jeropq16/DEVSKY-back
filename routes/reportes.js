import express from 'express';
import db from '../config/db.js';
import { getIO } from '../websocket.js';

const router = express.Router();

// Crear reporte de piloto
router.post('/', async (req, res) => {
  try {
    const {
      piloto_id,
      aeronave_id,
      horas_vuelo,
      trayecto_salida,
      trayecto_llegada,
      fecha,
      reporte,
      accion_correctiva,
      firma_piloto
    } = req.body;

    if (!piloto_id || !aeronave_id || !horas_vuelo || !fecha || !reporte) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }

    // Obtener matrícula de la aeronave
    const [aeronaveRows] = await db.query('SELECT matricula FROM aeronaves WHERE id = ?', [aeronave_id]);
    const matricula = aeronaveRows.length > 0 ? aeronaveRows[0].matricula : '';

    const [result] = await db.query(
      `INSERT INTO reportes_piloto 
       (aeronave_id, matricula, horas_vuelo, salida, llegada, fecha, reporte, accion_correctiva, firma_piloto) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [aeronave_id, matricula, horas_vuelo, trayecto_salida, trayecto_llegada, fecha, reporte, accion_correctiva, firma_piloto]
    );

    // Notificar al admin via WebSocket
    const io = getIO?.();
    if (io) {
      io.emit('notificacion', {
        titulo: 'Nuevo Reporte de Piloto',
        mensaje: `Reporte de vuelo para aeronave ${matricula} - ${horas_vuelo} horas`,
        rol: 'admin'
      });
    }

    res.json({ success: true, reporte_id: result.insertId });
  } catch (err) {
    console.error('Error creando reporte:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Obtener reportes
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM reportes_piloto ORDER BY creado_en DESC');
    res.json({ success: true, reportes: rows });
  } catch (err) {
    console.error('Error obteniendo reportes:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

export default router;