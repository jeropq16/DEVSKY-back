// This is the main entrance of the backend (express lift)
import express from "express";
import http from 'http';
import cors from "cors";
import bodyParser from 'body-parser';
import fs from 'fs';
import dotenv from "dotenv";
import path from 'path';

// Import routes
import authRoutes from './routes/auth.js';
import usuariosRoutes from './routes/usuarios.js';
import aeronavesRoutes from './routes/aeronaves.js';
import ordenesRoutes from './routes/ordenes.js';
import notificacionesRoutes from './routes/notificaciones.js';
import reportesRoutes from './routes/reportes.js';
import pdfRoutes from './routes/pdf.js';
import { initWebSocket } from './websocket.js';

dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de CORS - DEBE IR ANTES DE TODO
const corsOptions = {
    origin: [
        'https://devsky-back.vercel.app',
        'https://devsky-back-erb8td21v-sebitasdowns-projects.vercel.app',
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:4173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'Origin', 'Accept'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json()); // To handle JSON in requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Los PDFs se generan en memoria, no necesitamos crear directorio

// Servir archivos estáticos del frontend si existe
const frontendPath = path.join(process.cwd(), 'frontend');
if (fs.existsSync(frontendPath)) app.use(express.static(frontendPath));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/aeronaves', aeronavesRoutes);
app.use('/api/ordenes', ordenesRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/pdf', pdfRoutes);

// Ruta básica
app.get("/", (req, res) => {
    res.json({
        message: "Servidor DEVSKY funcionando correctamente",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        message: "Servidor funcionando correctamente",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get("/api/status", (req, res) => {
    res.json({
        status: "OK",
        message: "API funcionando correctamente",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: "Not configured yet"
    });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Error interno del servidor',
        message: err.message
    });
});

// Manejo de rutas no encontradas
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl
    });
});

// Solo inicializar el servidor si no estamos en Vercel
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    const server = http.createServer(app);
    server.listen(PORT, () => {
        console.log(`Servidor backend escuchando en http://localhost:${PORT}`);
    });
    initWebSocket(server);
}

// Exportar la app para Vercel
export default app;