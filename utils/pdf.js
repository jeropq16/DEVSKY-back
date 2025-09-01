import PDFDocument from "pdfkit";

export async function generarPDFOrden(orden, tareas) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ autoFirstPage: true });
      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      doc.fontSize(18).text('Orden de Trabajo', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Aeronave: ${orden.matricula || ''} ${orden.fabricante || ''} ${orden.modelo || ''}`);
      if (orden.fecha_inicio) doc.text(`Fecha inicio: ${orden.fecha_inicio}`);
      if (orden.estado) doc.text(`Estado: ${orden.estado}`);
      doc.moveDown();
      doc.text('Tareas:');
      tareas.forEach((t, i) => {
        doc.text(`${i + 1}. ${t.descripcion} - Estado: ${t.estado || 'pendiente'}`);
        if (t.firma_tecnico) doc.text(`   Firma técnico: ${t.firma_tecnico}`);
        if (t.firma_certificador) doc.text(`   Firma certificador: ${t.firma_certificador}`);
      });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
