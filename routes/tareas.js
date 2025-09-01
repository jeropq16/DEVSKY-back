import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Obtener todas las tareas con información de técnicos
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, u.nombre as tecnico_nombre 
      FROM tareas_orden t 
      LEFT JOIN usuarios u ON t.tecnico_id = u.id 
      ORDER BY t.id DESC
    `);
    res.json({ success: true, tareas: rows });
  } catch (err) {
    console.error('Error obteniendo tareas:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Crear nueva tarea
router.post('/', async (req, res) => {
  try {
    const { descripcion, id_tecnico_asignado } = req.body;
    
    if (!descripcion || !id_tecnico_asignado) {
      return res.status(400).json({ success: false, message: 'Faltan datos obligatorios' });
    }

    // Para crear una tarea independiente, necesitamos una orden de trabajo
    // Primero creamos una orden temporal o usamos una existente
    const [ordenResult] = await db.query(
      'INSERT INTO ordenes_trabajo (aeronave_id, estado, porcentaje_avance) VALUES (1, "en_proceso", 0)'
    );
    
    const [result] = await db.query(
      'INSERT INTO tareas_orden (orden_id, descripcion, tecnico_id, estado) VALUES (?, ?, ?, "pendiente")',
      [ordenResult.insertId, descripcion, id_tecnico_asignado]
    );

    res.json({ success: true, tarea_id: result.insertId });
  } catch (err) {
    console.error('Error creando tarea:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Actualizar estado de tarea
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    await db.query('UPDATE tareas_orden SET estado = ? WHERE id = ?', [estado, id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error actualizando tarea:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

export default router;