import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import aeronavesRoutes from './routes/aeronaves.js';
import ordenesRoutes from './routes/ordenes.js';
import notificacionesRoutes from './routes/notificaciones.js';
import reportesRoutes from './routes/reportes.js';
import pdfRoutes from './routes/pdf.js';
import tareas from './routes/tareas.js';
import { initWebSocket } from './websocket.js';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;

const pdfDir = path.join(process.cwd(), 'pdfs');
if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const frontendPath = path.join(process.cwd(), '..', 'frontend');
if (fs.existsSync(frontendPath)) app.use(express.static(frontendPath));

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/aeronaves', aeronavesRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/tareas', tareas);

app.get('/', (req, res) => res.send('Servidor de GMA funcionando con Mock Database'));

const server = http.createServer(app);
server.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
  console.log('✅ Usando Mock Database (sin MySQL)');
});

initWebSocket(server);

console.log('✅ Servidor iniciado correctamente con base de datos simulada');