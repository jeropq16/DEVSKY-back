import express from 'express';
import db from '../config/db.js';
import { generarPDFOrden } from '../utils/pdf.js';
const router = express.Router();

router.get('/orden/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [ordenes] = await db.query(
      'SELECT o.*, a.matricula, a.fabricante, a.modelo FROM ordenes_trabajo o JOIN aeronaves a ON o.aeronave_id = a.id WHERE o.id = ?',
      [id]
    );
    if (!ordenes.length) return res.status(404).json({ success: false, message: 'Orden no encontrada' });
    const orden = ordenes[0];
    const [tareas] = await db.query('SELECT * FROM tareas_orden WHERE orden_id = ?', [id]);

    const pdfBuffer = await generarPDFOrden(orden, tareas);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=orden_${id}.pdf`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).json({ success: false, message: 'Error generando PDF' });
  }
});

export default router;
