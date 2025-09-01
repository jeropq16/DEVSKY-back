// Mock database para desarrollo sin MySQL
let usuarios = [
  { id: 1, nombre: 'Admin', email: 'admin@example.com', password: 'adminpass', rol_id: 1 },
  { id: 2, nombre: 'Juan Técnico', email: 'tecnico@example.com', password: 'tecpass', rol_id: 2 },
  { id: 3, nombre: 'María Certificadora', email: 'cert@example.com', password: 'certpass', rol_id: 3 },
  { id: 4, nombre: 'Carlos Piloto', email: 'piloto@example.com', password: 'pilotopass', rol_id: 4 },
  { id: 5, nombre: 'Ana Técnico', email: 'tecnico2@example.com', password: 'tecpass2', rol_id: 2 },
  { id: 6, nombre: 'Luis Técnico', email: 'tecnico3@example.com', password: 'tecpass3', rol_id: 2 },
  { id: 7, nombre: 'Sofía piloto', email: 'sofi@tequiero.com', password: 'sofi123', rol_id: 4 }

];

let aeronaves = [
  { id: 1, matricula: 'XA-ABC', fabricante: 'Cessna', marca: 'Cessna', modelo: '172', anio_fabricacion: 2020, serie_numero: 'C172-001', total_horas_vuelo: 150, estado: 'disponible' },
  { id: 2, matricula: 'XA-DEF', fabricante: 'Piper', marca: 'Piper', modelo: 'Cherokee', anio_fabricacion: 2019, serie_numero: 'PA28-002', total_horas_vuelo: 200, estado: 'disponible' }
];

let tareas_orden = [
  {
    id: 1,
    orden_id: 101,
    descripcion: "Inspección visual del tren de aterrizaje",
    tipo_responsable: "técnico",
    tecnico_id: 5,
    certificador_id: null,
    estado: "pendiente",
    firma_tecnico: null,
    fecha_firma_tecnico: null,
    firma_certificador: null,
    fecha_firma_certificador: null
  },
  {
    id: 2,
    orden_id: 101,
    descripcion: "Cambio de filtro hidráulico",
    tipo_responsable: "técnico",
    tecnico_id: 7,
    certificador_id: 2,
    estado: "en progreso",
    firma_tecnico: "firma_digital_tecnico7.png",
    fecha_firma_tecnico: "2025-08-30 10:15:00",
    firma_certificador: null,
    fecha_firma_certificador: null
  },
  {
    id: 3,
    orden_id: 102,
    descripcion: "Revisión de presión en neumáticos",
    tipo_responsable: "técnico",
    tecnico_id: 6,
    certificador_id: null,
    estado: "pendiente",
    firma_tecnico: null,
    fecha_firma_tecnico: null,
    firma_certificador: null,
    fecha_firma_certificador: null
  },
  {
    id: 4,
    orden_id: 103,
    descripcion: "Certificación de reparación en ala izquierda",
    tipo_responsable: "certificador",
    tecnico_id: null,
    certificador_id: 3,
    estado: "completado",
    firma_tecnico: null,
    fecha_firma_tecnico: null,
    firma_certificador: "firma_cert3.png",
    fecha_firma_certificador: "2025-08-29 14:45:00"
  },
  {
    id: 5,
    orden_id: 104,
    descripcion: "Reemplazo de batería auxiliar",
    tipo_responsable: "técnico",
    tecnico_id: 8,
    certificador_id: 2,
    estado: "pendiente",
    firma_tecnico: null,
    fecha_firma_tecnico: null,
    firma_certificador: null,
    fecha_firma_certificador: null
  }
];
 

let ordenes_trabajo = [];

let notificaciones = [];
let reportes_piloto = [];
let horas_historial = [];

let nextId = {
  usuarios: 7,
  aeronaves: 3,
  ordenes_trabajo: 1,
  tareas_orden: 1,
  notificaciones: 1,
  reportes_piloto: 1,
  horas_historial: 1
};

// Simular pool.query
const mockPool = {
  query: async (sql, params = []) => {
    console.log('Mock Query:', sql, params);
    
    // Login
    if (sql.includes('SELECT * FROM usuarios WHERE email = ? AND password = ?')) {
      const [email, password] = params;
      const user = usuarios.find(u => u.email === email && u.password === password);
      return [user ? [user] : []];
    }
    
    // Get all usuarios
    if (sql.includes('SELECT id, nombre, email, rol_id FROM usuarios') && !sql.includes('WHERE')) {
      return [usuarios.map(u => ({ id: u.id, nombre: u.nombre, email: u.email, rol_id: u.rol_id }))];
    }
    
    // Get técnicos (rol_id = 2)
    if (sql.includes('SELECT id, nombre, email FROM usuarios WHERE rol_id = 2')) {
      const tecnicos = usuarios.filter(u => u.rol_id === 2).map(u => ({ id: u.id, nombre: u.nombre, email: u.email }));
      return [tecnicos];
    }
    
    // Get all aeronaves
    if (sql.includes('SELECT * FROM aeronaves')) {
      return [aeronaves];
    }
    
    // Update aeronave horas
    if (sql.includes('UPDATE aeronaves SET total_horas_vuelo = total_horas_vuelo + ?')) {
      const [horas, id] = params;
      const aeronave = aeronaves.find(a => a.id == id);
      if (aeronave) {
        aeronave.total_horas_vuelo += parseInt(horas);
      }
      return [{ affectedRows: 1 }];
    }
    
    // Insert horas_historial
    if (sql.includes('INSERT INTO horas_historial')) {
      const [id_aeronave, horas_sumadas] = params;
      horas_historial.push({
        id: nextId.horas_historial++,
        id_aeronave,
        horas_sumadas,
        fecha: new Date()
      });
      return [{ insertId: nextId.horas_historial - 1 }];
    }
    
    // Create orden
    if (sql.includes('INSERT INTO ordenes_trabajo')) {
      const orden = {
        id: nextId.ordenes_trabajo++,
        aeronave_id: params[0],
        estado: 'en_proceso',
        porcentaje_avance: 0,
        fecha_inicio: new Date()
      };
      if (sql.includes('mantenimiento_id')) {
        orden.mantenimiento_id = params[1];
      }
      if (sql.includes('tipo_mantenimiento')) {
        orden.tipo_mantenimiento = params[1];
      }
      ordenes_trabajo.push(orden);
      return [{ insertId: orden.id }];
    }
    
    // Insert tarea
    if (sql.includes('INSERT INTO tareas_orden')) {
      const tarea = {
        id: nextId.tareas_orden++,
        orden_id: params[0],
        descripcion: params[1],
        estado: 'pendiente'
      };
      if (params.length > 2) {
        if (sql.includes('tecnico_id')) {
          tarea.tecnico_id = params[2];
        } else {
          tarea.tipo_responsable = params[2];
        }
      }
      tareas_orden.push(tarea);
      return [{ insertId: tarea.id }];
    }
    
    // Get ordenes
    if (sql.includes('SELECT * FROM ordenes_trabajo')) {
      return [ordenes_trabajo];
    }
    
    // Get tareas by tecnico
    if (sql.includes('SELECT * FROM tareas_orden WHERE tecnico_id = ?')) {
      const [tecnico_id] = params;
      return [tareas_orden.filter(t => t.tecnico_id == tecnico_id)];
    }
    
    // Get tareas by certificador
    if (sql.includes('SELECT * FROM tareas_orden WHERE certificador_id = ?')) {
      const [certificador_id] = params;
      return [tareas_orden.filter(t => t.certificador_id == certificador_id)];
    }
    
    // Get tareas with tecnico info
    if (sql.includes('LEFT JOIN usuarios u ON t.tecnico_id = u.id')) {
      return [tareas_orden.map(t => ({
        ...t,
        tecnico_nombre: t.tecnico_id ? usuarios.find(u => u.id == t.tecnico_id)?.nombre : null
      }))];
    }
    
    // Insert reporte piloto
    if (sql.includes('INSERT INTO reportes_piloto')) {
      const reporte = {
        id: nextId.reportes_piloto++,
        aeronave_id: params[0],
        matricula: params[1],
        horas_vuelo: params[2],
        salida: params[3],
        llegada: params[4],
        fecha: params[5],
        reporte: params[6],
        accion_correctiva: params[7],
        firma_piloto: params[8],
        creado_en: new Date()
      };
      reportes_piloto.push(reporte);
      return [{ insertId: reporte.id }];
    }
    
    // Get reportes
    if (sql.includes('SELECT * FROM reportes_piloto')) {
      return [reportes_piloto];
    }
    
    // Insert notificacion
    if (sql.includes('INSERT INTO notificaciones')) {
      const notif = {
        id: nextId.notificaciones++,
        usuario_id: params[0],
        mensaje: params[1],
        leido: false,
        creado_en: new Date()
      };
      notificaciones.push(notif);
      return [{ insertId: notif.id }];
    }
    
    // Get notificaciones by user
    if (sql.includes('SELECT * FROM notificaciones WHERE usuario_id = ?')) {
      const [usuario_id] = params;
      return [notificaciones.filter(n => n.usuario_id == usuario_id)];
    }
    
    // Default empty result
    return [[]];
  },
  
  getConnection: async () => ({
    release: () => {}
  })
};

export default mockPool;