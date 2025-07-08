const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Flat = require('../models/Flat');

const router = express.Router();


// =====================
// POST /users/register
// =====================
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName, birthDate } = req.body;

    // Verificar se já existe utilizador
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Encriptar a password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Criar novo utilizador
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      birthDate,
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong during registration' });
  }
});


// =====================
// POST /users/login
// =====================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Procurar utilizador pelo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Comparar a password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Gerar token JWT
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin },
      process.env.JWT_SECRET,
      { expiresIn: '3h' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Something went wrong during login' });
  }
});

// PATCH /users/favorites/:flatId
router.patch('/favorites/:flatId', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;
    const flatId = req.params.flatId;

    const user = await User.findById(userId);

    const index = user.favouriteFlats.indexOf(flatId);
    if (index === -1) {
      user.favouriteFlats.push(flatId); // adicionar
    } else {
      user.favouriteFlats.splice(index, 1); // remover
    }

    await user.save();
    res.json({ message: 'Favoritos atualizados', favourites: user.favouriteFlats });
  } catch (err) {
    console.error('Erro ao atualizar favoritos:', err);
    res.status(500).json({ message: 'Erro ao atualizar favoritos' });
  }
});

// GET /users/favorites
router.get('/favorites', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const user = await User.findById(userId).populate('favouriteFlats');

    res.json(user.favouriteFlats);
  } catch (err) {
    console.error('Erro ao obter favoritos:', err);
    res.status(500).json({ message: 'Erro ao obter favoritos' });
  }
});

// PATCH /users/:id - atualizar dados do utilizador
router.patch('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const requesterId = decoded.userId;

    const user = await User.findById(requesterId);
    const isAdmin = user?.isAdmin;
    const isOwner = requesterId.toString() === req.params.id.toString();


    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const { firstName, lastName, birthDate, password } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (birthDate) updates.birthDate = birthDate;
    if (typeof isAdmin === 'boolean') {
  updates.isAdmin = isAdmin;
}


    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.password = hashedPassword;
    }

    await User.findByIdAndUpdate(req.params.id, updates, { new: true });

    res.json({ message: 'Perfil atualizado com sucesso!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erro ao atualizar o perfil' });
  }
});

// ================================
// DELETE /users/:id (Apenas Admin)
// ================================
router.delete('/:id', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const requesterId = decoded.userId;

    const adminUser = await User.findById(requesterId);
    if (!adminUser?.isAdmin) {
      return res.status(403).json({ message: 'Apenas admins podem remover utilizadores' });
    }

    if (requesterId === req.params.id) {
      return res.status(400).json({ message: 'Um admin não pode apagar a sua própria conta' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Utilizador removido com sucesso' });
  } catch (err) {
    console.error('Erro ao remover utilizador:', err);
    res.status(500).json({ message: 'Erro ao remover utilizador' });
  }
});

// ===========================
// GET /users - listar todos os utilizadores (apenas para admin)
// ===========================
router.get('/', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const requesterId = decoded.userId;

    const user = await User.findById(requesterId);
    if (!user?.isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Não incluir password
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (err) {
    console.error('Erro ao obter utilizadores:', err);
    res.status(500).json({ message: 'Erro ao obter utilizadores' });
  }
});

const Message = require('../models/Message'); // Certifica-te que este modelo está importado

// ===============================
// GET /users/messages - mensagens enviadas pelo utilizador
// ===============================
router.get('/messages', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const messages = await Message.find({ senderId: userId })
      .sort({ createdAt: -1 })
      .populate('flatId') // necessário para mostrar info do flat no frontend
      .exec();

    res.json(messages);
  } catch (err) {
    console.error('Erro ao buscar mensagens do utilizador:', err);
    res.status(500).json({ message: 'Erro ao buscar mensagens' });
  }
});
// GET /flats/:id/conversation - para utilizador ver a conversa completa com o dono
router.get('/:id/conversation', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId;

    const flatId = req.params.id;

    // Obtem todas as mensagens relacionadas a este flat
    const messages = await Message.find({ flatId })
      .populate('senderId', 'firstName lastName email')
      .sort({ createdAt: 1 });

    // Filtra só se o user for o dono ou alguém que iniciou conversa com este flat
    const flat = await Flat.findById(flatId);
    if (!flat) return res.status(404).json({ message: 'Flat not found' });

    const isOwner = flat.ownerId.toString() === userId;
    const isParticipant = messages.some(msg => msg.senderId._id.toString() === userId);

    if (!isOwner && !isParticipant) {
      return res.status(403).json({ message: 'Acesso negado à conversa' });
    }

    res.json(messages);
  } catch (err) {
    console.error('Erro ao carregar conversa:', err);
    res.status(500).json({ message: 'Erro ao carregar conversa' });
  }
});



module.exports = router;
