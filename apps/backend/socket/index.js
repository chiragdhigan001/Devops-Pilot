import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { getLatestMetrics, getLatestLogs } from '../controllers/monitoringController.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: process.env.FRONTEND_URL, methods: ['GET', 'POST'] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    console.log(`User ${socket.userId} connected`);
    socket.emit('monitoring:metrics', getLatestMetrics());
    const logs = await getLatestLogs();
    socket.emit('monitoring:logs', logs);
    socket.on('join:project', (projectId) => {
      socket.join(`project:${projectId}`);
    });
    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};

export const getIO = () => io;
