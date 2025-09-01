import express from 'express';
import db from '../config/db.js';

const router = express.Router();

// Obtener notificaciones de un usuario
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const [rows] = await db.query(
      'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY creado_en DESC',
      [userId]
    );
    res.json({ success: true, notificaciones: rows });
  } catch (err) {
    console.error('Error obteniendo notificaciones:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Crear notificación
router.post('/', async (req, res) => {
  try {
    const { usuario_id, mensaje } = req.body;
    
    if (!usuario_id || !mensaje) {
      return res.status(400).json({ success: false, message: 'Faltan datos' });
    }

    const [result] = await db.query(
      'INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)',
      [usuario_id, mensaje]
    );

    res.json({ success: true, notificacion_id: result.insertId });
  } catch (err) {
    console.error('Error creando notificación:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

// Marcar notificación como leída
router.put('/:id/leer', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE notificaciones SET leido = TRUE WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error marcando notificación como leída:', err);
    res.status(500).json({ success: false, message: 'Error en el servidor' });
  }
});

export default router;