const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http'); // necessário para usar socket.io
const { Server } = require('socket.io');
require('dotenv').config();

// Importar routers
const userRoutes = require('./routes/userRoutes');
const flatRoutes = require('./routes/flatRoutes'); 
const messageRoutes = require('./routes/messageRoutes');

const app = express();
const server = http.createServer(app); // Criar servidor HTTP
const io = new Server(server, {
  cors: {
    origin: '*', // permite acesso do frontend local
    methods: ['GET', 'POST', 'PATCH'],
  },
});

// Disponibilizar io para todos os routers
app.set('io', io);

// Middlewares
app.use(cors());
app.use(express.json());

// Usar routers
app.use('/users', userRoutes);
app.use('/flats', flatRoutes); 
app.use('/', messageRoutes);

// Ligação à base de dados
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB error:", err));

// Eventos de WebSocket (opcional – debug)
io.on('connection', (socket) => {
  console.log('🟢 Novo cliente conectado ao WebSocket');

  socket.on('disconnect', () => {
    console.log('🔴 Cliente desconectado');
  });
});

// Arrancar servidor com WebSocket
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
