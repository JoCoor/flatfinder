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
        id: user._id,
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


module.exports = router;
