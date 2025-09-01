import { Server } from "socket.io";

let io;

/**
 * Inicializa WebSocket con socket.io
 * @param {http.Server} server
 */
export function initWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Cliente conectado al WebSocket:", socket.id);

    socket.on("disconnect", () => {
      console.log("❌ Cliente desconectado:", socket.id);
    });
  });

  return io;
}

/**
 * Devuelve la instancia de io para usar en otros módulos
 */
export function getIO() {
  return io;
}
