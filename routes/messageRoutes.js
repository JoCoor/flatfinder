const express = require('express');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Flat = require('../models/Flat');
const User = require('../models/User');

const router = express.Router();

// GET paginado: /flats/:id/messages?page=1&limit=5
router.get('/flats/:id/messages', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const flatId = req.params.id;

    const messages = await Message.find({ flatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('senderId', 'firstName lastName email');

    res.json(messages);
  } catch (err) {
    console.error('Erro ao buscar mensagens:', err);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});

// POST /flats/:id/messages – Enviar mensagem
router.post('/flats/:id/messages', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ message: 'Unauthorized' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });

    const newMessage = new Message({
      flatId: flat._id,
      senderId: userId,
      content: req.body.content,
    });

    const saved = await newMessage.save();

    // Notificação em tempo real
    const io = req.app.get('io');
    io.emit('nova-mensagem', {
      flatId: flat._id.toString(),
      content: req.body.content,
      senderId: userId,
    });

    res.status(201).json(saved);
  } catch (err) {
    console.error('Erro ao enviar mensagem:', err);
    res.status(500).json({ message: 'Erro ao enviar mensagem' });
  }
});

// PATCH /flats/:id/messages/read – Marcar como lidas
router.patch('/flats/:id/messages/read', async (req, res) => {
  try {
    const flatId = req.params.id;
    await Message.updateMany({ flatId }, { $set: { isRead: true } });
    res.json({ message: 'Mensagens marcadas como lidas' });
  } catch (err) {
    console.error('Erro ao marcar como lidas:', err);
    res.status(500).json({ message: 'Erro ao marcar como lidas' });
  }
});


module.exports = router;
