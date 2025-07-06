const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { storage } = require('../utils/cloudinary');
const Flat = require('../models/Flat');
const User = require('../models/User');

const router = express.Router();
const upload = multer({ storage });


// ===========================
// GET /flats - listar todos
// ===========================
router.get('/', async (req, res) => {
  try {
    const flats = await Flat.find().populate('ownerId', 'firstName lastName');
    res.json(flats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching flats' });
  }
});


// ===========================
// GET /flats/:id - detalhes
// ===========================
router.get('/:id', async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id).populate('ownerId', 'firstName lastName');
    if (!flat) return res.status(404).json({ message: 'Flat not found' });
    res.json(flat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching flat details' });
  }
});


// ===========================
// POST /flats - criar flat
// ===========================
router.post('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('🔒 Falta token no cabeçalho');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    console.log('🟢 Token válido. ID do utilizador:', userId);
    console.log('📦 Dados recebidos no corpo da requisição:', req.body);

    const newFlat = new Flat({
      ...req.body,
      ownerId: userId,
    });

    const savedFlat = await newFlat.save();

    console.log('✅ Flat gravado com sucesso no MongoDB:', savedFlat);
    res.status(201).json({ message: 'Flat created successfully' });
  } catch (err) {
    console.error('❌ Erro ao criar flat:', err);
    res.status(500).json({ message: 'Error creating flat' });
  }
});



// ===========================
// PATCH /flats/:id - editar
// ===========================
router.patch('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });

    const user = await User.findById(userId);
    const isOwner = flat.ownerId.toString() === userId;
    const isAdmin = user?.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not allowed to edit this flat' });
    }

    // Atualizar dados (incluindo array de fotos)
    Object.assign(flat, req.body);
    await flat.save();

    res.json({ message: 'Flat updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating flat' });
  }
});


// ===========================
// DELETE /flats/:id - apagar
// ===========================
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const flat = await Flat.findById(req.params.id);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });

    const user = await User.findById(userId);
    const isOwner = flat.ownerId.toString() === userId;
    const isAdmin = user?.isAdmin;

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not allowed to delete this flat' });
    }

    await flat.deleteOne();
    res.json({ message: 'Flat deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting flat' });
  }
});


// ===============================
// POST /flats/upload - enviar img
// ===============================
router.post('/upload', upload.single('image'), (req, res) => {
  try {
    const imageUrl = req.file.path;
    res.json({ imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading image' });
  }
});


module.exports = router;
